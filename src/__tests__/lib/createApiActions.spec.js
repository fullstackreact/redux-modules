import sinon from 'sinon';
import {expect} from 'chai';
import ApiClient from '../../lib/apiClient';
import {createApiAction, API_CONSTANTS} from '../../lib/createApiActions';
import {REDUX_MODULE_API_ACTION_KEY} from '../../lib/constants';
import configureMockStore from 'redux-mock-store';
import {generateResponse, makeBaseOpts, BASE_URL, makeStore, doDispatch, doGetState} from '../spec_helpers';
// import 'whatwg-fetch';
import fetch from 'isomorphic-fetch'
import fetchMock from 'fetch-mock';

const createStubStore = () => {
  let res = makeStore({
    baseUrl: BASE_URL,
  }, {numbers: []})
  let store = res.store;
  return {res, store};
}
describe('@api decorator', () => {
  let fn, decorated, baseOpts, store;
  beforeEach(() => baseOpts = makeBaseOpts({}));
  beforeEach(() => {
    let stub = createStubStore();
    store = stub.store;
    fn = (client) => client.get('/go')
  });
  beforeEach(() => decorated = createApiAction('YES')(fn)(baseOpts))
  afterEach(() => fetchMock.restore());

  it('calls two actions (LOADING, SUCCESS)', (done) => {
    generateResponse('/go', 200);
    let {type, meta} = decorated(store.dispatch, store.getState);
    const {runFn} = meta;
    expect(type).to.eql(REDUX_MODULE_API_ACTION_KEY);
    expect(typeof runFn).to.eql('function')

    runFn(baseOpts)
      .then((json) => {
        let actions = store.getActions();
        expect(actions.length).to.equal(2);
        expect(actions[0].type).to.eql('API_YES_LOADING');
        expect(actions[1].type).to.eql('API_YES_SUCCESS');
        done();
      })
      .catch((err) => {
        console.log('An error occurred', err);
        done(err);
      })
  });

  it('calls the error action when error is received', (done) => {
    generateResponse('/go', 500);
    let {type, meta} = decorated(store.dispatch, store.getState);
    const {runFn} = meta;

    runFn(baseOpts)
      .then((json) => {
        let actions = store.getActions();

        expect(actions.length).to.equal(2);
        expect(actions[0].type).to.eql('API_YES_LOADING');
        expect(actions[1].type).to.eql('API_YES_ERROR');

        done();
      }).catch(done)
  });

  describe('meta creator', () => {
    it('appends isApi to the meta object of loading/success', (done) => {
      generateResponse('/go', 200)
      let {type, meta} = decorated(store.dispatch, store.getState);
      const {runFn} = meta;

      runFn(baseOpts)
      .then((json) => {
        let actions = store.getActions();

        expect(actions.length).to.equal(2);
        expect(actions[0].meta.isApi).to.be.true;
        expect(actions[1].meta.isApi).to.be.true;

        done();
      }).catch(done)
    });

    it('appends the errorStatus to the payload object of error', (done) => {
      generateResponse('/go', 418)

      let {type, meta} = decorated(store.dispatch, store.getState);
      const {runFn} = meta;

      runFn(baseOpts)
      .then((json) => {
        let actions = store.getActions();

        expect(actions.length).to.equal(2);
        expect(actions[0].meta.isApi).to.be.true;

        const {payload} = actions[1];
        expect(payload.error).to.be.defined;
        expect(payload.status).to.eql(API_CONSTANTS[418])

        done();
      }).catch(done)
    });

  })

});
