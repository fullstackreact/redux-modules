import sinon from 'sinon';
import {expect} from 'chai';
import ApiClient from '../../lib/apiClient';
import configureMockStore from 'redux-mock-store';
import {makeStore} from '../spec_helpers';
import fetchMock from 'fetch-mock';

const BASE_URL = 'http://fullstackreact.com';

const baseOpts = {
  _debug: false,
  baseUrl: BASE_URL,
  appendExt: false, // optional
  headers: {
    'X-Requested-With': 'spec'
  }
}

describe('ApiClient', () => {
  let client, state;
  let helpers;

  beforeEach(() => {
    fetchMock
      .mock(`${BASE_URL}/foo`, {
        status: 200,
        body: {msg: 'world'}
      })
  });

  afterEach(() => fetchMock.restore());

  beforeEach(() => {
    state = {};
    client = new ApiClient(baseOpts, () => state);
  });

  describe('option parsing', () => {
    const makeOptionParsingTest = (key, val) => {
      // common tests for each option
      it(`accepts ${key} in defaultOpts as a value`, () => {
        let res = client._parseOpt(key, {}, { [key]: val });
        expect(res).to.eql(val)
      });
      it(`accepts ${key} in instance options as a value`, () => {
        let res = client._parseOpt(key, { [key]: val });
        expect(res).to.eql(val)
      });
      it(`accepts ${key} as a function`, () => {
        let res = client._parseOpt(key, { [key]: () => val });
        expect(res).to.eql(val)
      });
      it(`accepts ${key} as false (nullify)`, () => {
        let res = client._parseOpt(key, { [key]: false });
        expect(res).to.be.null;
      });
    }

    // Test for appendPath
    makeOptionParsingTest('appendPath', `/${Math.random(0, 20)}`)
    makeOptionParsingTest('appendExt', 'json')

  })

  describe('get', () => {
    it('defines GET as a function', () => {
      expect(typeof client.get).to.eql('function');
    })

    it('runs a request', (done) => {
      client.get({url: `${BASE_URL}/foo`})
        .then((resp) => {
          expect(resp.msg).to.eql('world')
          done();
        }).catch(done);
    });

    it('accepts a string as a path', done => {
      client.get('/foo')
        .then((resp) => {
          expect(resp.msg).to.eql('world');
          done();
        }).catch(done);
    })

    it('accepts a path (appended to the baseUrl)', done => {
      client.get({path: '/foo'})
        .then((resp) => {
          expect(resp.msg).to.eql('world');
          done();
        }).catch(done);
    });

    it('accepts appendPath', done => {
      fetchMock.mock(`${BASE_URL}/foo/yellow`, '{}')
      client.get({path: '/foo', appendPath: '/yellow'})
        .then(() => done()).catch(done);
    });
  });

  describe('post', () => {
    it('defines POST as a function', () => {
      expect(typeof client.post).to.eql('function');
    });

    it('sends `data` along with the request', (done) => {
      fetchMock.post(`${BASE_URL}/foo`, {
        msg: 'world'
      })
      client.post({
        path: '/foo',
        data: {msg: 'hello'}
      }).then((data) => {
        expect(data).to.eql({msg: 'world'})
        done();
      }).catch(done);
    })
  })

  describe('error handling', () => {
    let client;
    const generateError = (status, msg={}, options={}) => {
      return fetchMock.mock(`${BASE_URL}/err`, (reqUrl, reqOpts) => {
        return {
          status,
          body: JSON.stringify(msg)
        }
      })
    }

    beforeEach(() => {
      client = new ApiClient(baseOpts, () => state);
    });

    it('responds with the status code', (done) => {
      let p = generateError(500, {msg: 'blah'});
      client.get({path: '/err'})
      .catch((err) => {
        expect(err.status).to.equal(500);
        done();
      })
    });

    it('responds with the error messsage', (done) => {
      generateError(400, {msg: 'error error'});
      client.get({path: '/err'})
        .catch((err) => {
          err.body.then((json) => {
            expect(json.msg).to.eql('error error')
            done();
          })
        })
    })
  })

  describe('request transforms', () => {
    let transform = (state, opts) => req => {
      req.headers['X-Name'] = 'Ari';
      return req;
    }
    beforeEach(() => {
      fetchMock.mock(`${BASE_URL}/name`, (reqUrl, reqOpts) => {
        return {
          status: 200,
          body: JSON.stringify(reqOpts)
        }
      });
      client = new ApiClient(baseOpts, () => state);
    });

    it('can accept a single requestTransform', () => {
      baseOpts.requestTransforms = [transform];
      client = new ApiClient(baseOpts, () => state);
      client.get({path: '/name'})
      .then((json) => {
        expect(res.headers['X-Name']).to.eql('Ari')
      });
    });

    it('accepts multiple requestTransforms', () => {
      client = new ApiClient(baseOpts, () => state);
      client.get({path: '/name', requestTransforms: [transform]})
    });
  });

  describe('response transforms', () => {
    let time, msg;
    let transform = (state, opts) => res => {
      res.headers.set('X-Response-Time', time);
      return res;
    }
    let jsonTransform = (state, opts) => (res) => {
      let time = res.headers.get('X-Response-Time');
      return res.json()
              .then(json => ({...json, time}))
    }
    beforeEach(() => {
      time = new Date()
      msg  = 'hello world';
      fetchMock.mock(`${BASE_URL}/response/time`, {
          status: 200,
          body: JSON.stringify({time, msg})
      });
      client = new ApiClient(baseOpts, () => state);
    });

    it('returns parsed JSON by default without responseTransforms', (done) => {
      client = new ApiClient(baseOpts, () => state)
        .get({path: '/response/time'})
          .then(json => {
            expect(json.msg).to.eql(msg);
            done();
          }).catch(done)
    });

    it('can accept a single responseTransforms', (done) => {
      baseOpts.responseTransforms = [transform];
      client = new ApiClient(baseOpts, () => state);
      client.get({path: '/response/time'})
      .then((res) => {
        expect(res.headers.get('X-Response-Time')).to.eql(time)
        done();
      }).catch(done)
    });

    it('accepts multiple responseTransforms', (done) => {
      client = new ApiClient(baseOpts, () => state);
      client.get({path: '/response/time',
                  responseTransforms: [transform, jsonTransform]})
      .then((json) => {
        expect(json.time).to.eql(time);
        done();
      }).catch(done)
    });
  });

})
