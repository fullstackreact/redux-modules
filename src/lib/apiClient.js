import * as qs from 'query-string';
import {noop, syncEach} from './utils';

export const sharedHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest'
};

// Helpers
// JSON parser
// const parseJson = (resp) => resp.json();
const parseJson = (state, opts) => (resp) => {
  return resp.json();
}

// MIDDLEWARE THINGS
const checkStatus = (resp) => {
  if (!resp.ok) {
    let err = new Error(resp.statusText);
    err.status = resp.status;
    err.response = resp;
    err.body = Promise.resolve(noop(resp))
                .then(resp => resp.json())
                .catch((err) => Promise.reject({msg: 'Service error'}))
    throw err;
  }
  return resp;
}

/**
 * API Client class
 *
 * baseOpts
 *  {
 *    baseUrl: Required,
 *    appendExt: boolean || string
 *  }
 */
export class ApiClient {
  constructor(baseOpts, getState) {
    // basically makeRequest
    this._debugging = baseOpts._debug;

    ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].forEach((method) => {
      this[method.toLowerCase()] = (options) => {
        let opts = this.requestDefaults(method, options, baseOpts);

        let url = this._getUrl(options, baseOpts);

        let requestTransforms =
            this._parseOpt('requestTransforms', options, baseOpts, []);
        let responseTransforms =
            this._parseOpt('responseTransforms', options, baseOpts, [parseJson]);

        // let requestTransforms = [].concat(reqTransforms);
        // let responseTransforms = [].concat(respTransforms);

        return new Promise((resolve, reject) => {
          this.runTransforms(requestTransforms, getState, opts)
            .then(this.debugLog(() => 'requesting...'))
            .then((transformedOpts) => fetch(url, transformedOpts))
            .then(this.debugLog())
            .then(checkStatus)
            .then(this.debugLog(resp => `Status: ${resp}`))
            .then((resp) => this
                    .runTransforms(responseTransforms, getState, resp))
            .then(this.debugLog(json => `JSON: ${json}`))
            .then(resolve)
            .catch(err => reject(err))
        });
      }
    });
  }

  runTransforms (transforms:Array, getState:Function, opts:Object) {
    return syncEach(noop(opts), (fn, prev) => {
      return typeof fn === 'function' ? fn(getState, opts) : fn;
    })(transforms)
  }

  debugLog(msgFn) {
    return (args) => {
      if (this._debugging) {
        console.log((msgFn || noop)(args))
      }
      return args;
    }
  }

  // Option handling
  _parseOpt(key, opts, defaultOpts = {}, defaultValue = null) {
    let val = opts[key] || defaultOpts[key];
    if (!val) {
      return defaultValue;
    }

    return (typeof val === 'function') ? val.call(this, opts) : val;
  }

  requestDefaults (method, params, defaultOpts) {
    let opts = params || {};

    let customHeaders = this._parseOpt('headers', opts, defaultOpts, {});
    let headers = Object.assign({}, sharedHeaders, customHeaders);

    let meta = this._parseOpt('meta', opts, defaultOpts, {});
    let data = this._parseOpt('data', opts, defaultOpts, {});

    let requestOpts = {
      method: method,
      headers: headers,
      meta: meta,
    }

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      requestOpts.body = JSON.stringify(data);
    }

    return requestOpts;
  }

  // Get custom url if included in the opts
  // otherwise, get the default one
  _getUrl(opts, defaultOpts = {}) {
    if (typeof opts === 'string') {
      opts = {path: opts}
    }
    let url   = this._parseOpt('url', opts);
    let path  = this._parseOpt('path', opts);

    if (path) {
      path = path[0] !== '/' ? '/' + path : path;
    }

    if (!url) {
      url = [defaultOpts.baseUrl, path].join('');  // eslint-disable-line no-undef
    }

    let appendPath = this._parseOpt('appendPath', opts, defaultOpts);
    if (appendPath) {
      url = [url, appendPath].join('')
    }

    // Append (or don't)
    let appendExt = this._parseOpt('appendExt', opts, defaultOpts)
    if (appendExt) {
      url = url + `.${appendExt}`;
    }

    let params = this._parseOpt('params', opts, defaultOpts);
    if (params) {
      let qsParams = qs.stringify(params);
      url = url + '?' + qsParams;
    }

    return url;
  }
}

export default ApiClient;
