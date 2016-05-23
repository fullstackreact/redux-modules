import sinon from 'sinon';
import {expect} from 'chai';
import ApiClient from '../../lib/apiClient';
import {setApi} from '../../lib/createApiActions';
import configureMockStore from 'redux-mock-store';
import {generateResponse, makeBaseOpts, BASE_URL, makeStore, doDispatch, doGetState} from '../spec_helpers';
// import 'whatwg-fetch';
import fetch from 'isomorphic-fetch'
import fetchMock from 'fetch-mock';

describe('@api decorator', () => {
  let fn, decorated, baseOpts, store;
  beforeEach(() => fetchMock.useNonGlobalFetch(fetch));
  beforeEach(() => baseOpts = makeBaseOpts({}));
  beforeEach(() => {
    let res = makeStore({
      baseUrl: BASE_URL
    }, {numbers: []})
    store = res.store;
    fn = (client) => client.get('/go')
  });
  beforeEach(() => decorated = setApi('YES')(fn)(baseOpts))
  afterEach(() => fetchMock.restore());

  it('calls two actions (LOADING, SUCCESS)', (done) => {
    generateResponse('/go', 200);
    let res = decorated(store.dispatch, store.getState);
    res[1]
    .then((json) => {
      let actions = store.getActions();

      expect(actions.length).to.equal(2);
      expect(actions[0].type).to.eql('YES_LOADING');
      expect(actions[1].type).to.eql('YES_SUCCESS');
      done();
    })
    .catch(done)
  });

  it('calls the error action when error is received', (done) => {
    generateResponse('/go', 500);
    let res = decorated(store.dispatch, store.getState);
    res[1].then((json) => {
      let actions = store.getActions();

      expect(actions.length).to.equal(2);
      expect(actions[0].type).to.eql('YES_LOADING');
      expect(actions[1].type).to.eql('YES_ERROR');

      done();
    }).catch(done)
  });

  it('returns an array of promises for each function', () => {
    generateResponse('/go', 500);
    let res = decorated(store.dispatch, store.getState);
    expect(res.length).to.equal(2);
  });

});
