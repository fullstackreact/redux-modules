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
    // pending... as in... this works differently now
    // so the old tests do not make sense any more...
    // the functionality is tested in createApiActions.spec
  })
});
