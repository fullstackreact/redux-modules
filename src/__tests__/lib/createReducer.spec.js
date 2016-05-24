import {expect} from 'chai';
import {makeStore} from '../spec_helpers';
import {createReducer} from '../../lib/createReducer';

describe('createReducer', () => {
  let reducer, handlers, store;

  beforeEach(() => {
    let res = makeStore({}, {msg: 'init'})
    store = res.store;
  });

  beforeEach(() => {
    let handlers = {
      'HANDLE_THING': (state, action) => ({msg: 'called'})
    }
    reducer = createReducer(handlers)
  })

  it('calls a reducer when defined in the hash', () => {
    let resp = reducer(store.getState(), {type: 'HANDLE_THING'});
    expect(resp.msg).to.eql('called');
  });

  it('returns original state with non-defined type handler', () => {
    let resp = reducer(store.getState(), {type: 'HANDLE_OTHER_THING'});
    expect(resp.msg).to.eql('init');
  })
});
