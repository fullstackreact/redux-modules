import configureMockStore from 'redux-mock-store';
import fetchMock from 'fetch-mock';
import thunk from 'redux-thunk';
import createApiMiddleware from '../lib/createApiMiddleware';

export const makeStore = (opts, initialState) => {
  let apiMiddleware = createApiMiddleware(opts);
  let nextHandler = apiMiddleware(store)

  let mockStore = configureMockStore([apiMiddleware, thunk])
  let store = mockStore(initialState);
  return {nextHandler, store};
}

export const BASE_URL = 'http://fullstackreact.com';

const handleResponse = (status, msg) => (reqUrl, reqOpts) => {
  if (typeof msg === 'function') {
    return msg(reqUrl, reqOpts);
  }
  return {status, body: JSON.stringify(msg)}
}

export const makeBaseOpts = (opts = {}) => Object.assign({}, {
    _debug: false,
    baseUrl: BASE_URL,
    appendExt: false, // optional
    headers: {
      'X-Requested-With': 'spec'
    }
  }, opts);

export const generateResponse = (path, status, msg={}) => {
  return fetchMock.mock(`${BASE_URL}${path}`, handleResponse(status, msg));
}

export const doDispatch = () => {};
export const doGetState = () => {};
