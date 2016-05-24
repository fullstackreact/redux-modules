import sinon from 'sinon';
import {expect} from 'chai';
import {createApiHandler} from '../../lib/createApiHandler';
import configureMockStore from 'redux-mock-store';
import {BASE_URL, generateResponse, makeStore} from '../spec_helpers';
// import 'whatwg-fetch';
import fetch from 'isomorphic-fetch'
import fetchMock from 'fetch-mock';

describe('apiHandler', () => {
  let fn, handlers, store;
  let dispatch, getState;
  const responseData = 'hello world';
  beforeEach(() => {
    fn = (state, action) => responseData;
  });
  beforeEach(() => {
    handlers = createApiHandler('A_TYPE', (apiStates) => {})(fn);
  });
  beforeEach(() => {
    let res = makeStore({
      baseUrl: BASE_URL
    }, {numbers: []})
    store = res.store;
    dispatch = store.dispatch;
    getState = store.getState;
  });

  it('can create an apiHandler', () => {
    expect(handlers).to.exist;
    expect(Object.keys(handlers).length).to.equal(3);
    expect(typeof handlers['A_TYPE_LOADING']).to.eql('function');
    expect(typeof handlers['A_TYPE_ERROR']).to.eql('function');
    expect(handlers['A_TYPE_SUCCESS']).to.eql(fn);
  });

  describe('default handlers', () => {
    beforeEach(() => {
      store = sinon.mock(store);
    })

    it('sets the state to loading without a loading handler taking', () => {
      let expectedAction = {
        type: 'A_TYPE_SUCCESS',
        payload: responseData
      }
      let res = handlers['A_TYPE_LOADING'](dispatch, getState);
      expect(res.loading).to.be.true;
    });

    it('sets runs the success handler function on success', () => {
      let res = handlers['A_TYPE_SUCCESS'](dispatch, getState);
      expect(res).to.eql(responseData);
    })

    it('sets the loading state to false on ERROR', () => {
      let res = handlers['A_TYPE_ERROR'](dispatch, getState);
      expect(res.loading).to.be.false;
    })
  });

})
