import sinon from 'sinon';
import {expect} from 'chai';
import configureMockStore from 'redux-mock-store';
import {makeStore} from '../spec_helpers';

const BASE_URL = 'http://fullstackreact.com';

const doDispatch = () => {};
const doGetState = () => {};
const makeDispatchAction = (action, fn) => dispatch => {
  fn && fn(action);
  return dispatch(action)
};

describe('ApiClient middleware', () => {
  let nextHandler, apiMiddleware;
  let store, mockStore;

  let createNext = fn => (action) => fn && fn(action);

  let initialState = { numbers: [] };
  let runtimeOpts = {dispatch: doDispatch, getState: doGetState}

  beforeEach(() => {
    let res = makeStore({
      baseUrl: BASE_URL
    }, {numbers: []})
    nextHandler = res.nextHandler;
    store = res.store;
  });


  it('returns a function', () => {
    const actionHandler = nextHandler(createNext());

    expect(typeof actionHandler).to.eql('function');
    expect(actionHandler.length).to.equal(1);
  })

  describe('non-api requests', () => {
    const testType = 'TEST';
    let action, msg;
    beforeEach(() => {
      let payload = JSON.stringify({add: 1})
      msg = {type: testType, payload};
    })

    it('runs the action with dispatch', done => {
      action = makeDispatchAction(msg, () => done());
      store.dispatch(action)
      expect(store.getActions().length).to.eql(1);
      expect(store.getActions()[0].type).to.eql(testType);
    });
  });

  describe('api requests', () => {
    const apiType = 'API';
    const makeApiAction = (payload, extraMeta = {}, done) => {
      return makeDispatchAction({
        type: apiType,
        meta: Object.assign({}, {isApi: true}, extraMeta),
        payload
      }, done)
    };
    const makeApiActionWithFn = (payload, extraMeta={}, done) => {
      return makeDispatchAction({
        type: apiType,
      })
    }

    describe('middleware with options as an object', () => {
      let store;
      beforeEach(() => {
        let res = makeStore({
          baseUrl: BASE_URL
        }, {online: true})
        store = res.store;
      });

      it('adds configuration information on middleware', (done) => {
        let action = makeApiAction({}, {path: '/foo'}, () => done());
        store.dispatch(action);
        let actions = store.getActions();
        expect(actions.length).to.eql(1);
        expect(actions[0].meta.baseUrl).to.exist;
        expect(actions[0].meta.baseUrl).to.eql(BASE_URL);
      });

      it('calls the next function', (done) => {
        let action = makeApiAction({}, {path: '/foo'}, () => done());
        store.dispatch(action);
        let actions = store.getActions();
        expect(actions.length).to.eql(1);
        expect(actions[0].meta.baseUrl).to.exist;
        expect(actions[0].meta.baseUrl).to.eql(BASE_URL);
      });
    });

    describe('middleware options as function', () => {
      const ONLINE_URL = 'http://online.fullstackreact.com';
      const OFFLINE_URL = 'http://offline.fullstackreact.com';

      const makeApiFetcherWithFn = (initialState = {}) => {
        const makeStoreFn = (store, action) => {
          const state = store.getState();
          return {
            baseUrl: state.online ? ONLINE_URL : OFFLINE_URL
          }
        }

        return makeStore(makeStoreFn, initialState)
      }

      const makeStoreWithState = (state) => makeApiFetcherWithFn(state);
      const createStatusTests = (state, meta, expectedUrl) => {
        describe(`with dynamic state: (online: ${state.online})`, () => {
          let store, action, currentActions;
          beforeEach(() => {
            // create custom store
            let res = makeApiFetcherWithFn(state);
            store = res.store;
          });

          beforeEach(() => {
            action = makeApiAction({}, meta);
            store.dispatch(action);
            currentActions = store.getActions();
          })

          it('adds configuration information on middleware', () => {
            expect(currentActions.length).to.eql(1);
          });

          it('adds the baseUrl to action.meta', () => {
            expect(currentActions[0].meta.baseUrl).to.exist;
            expect(currentActions[0].meta.baseUrl).to.eql(expectedUrl);
          })
        });
      }

      // tests to confirm the dynamic state is added
      createStatusTests({online: true}, {path: '/some_path'}, ONLINE_URL);
      createStatusTests({online: false}, {path: '/other'}, OFFLINE_URL);
    })

  })
});
