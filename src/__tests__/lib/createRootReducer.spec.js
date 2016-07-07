import {expect} from 'chai';
import sinon from 'sinon'
import {makeStore} from '../spec_helpers';
import {createRootReducer} from '../../lib/createRootReducer';

describe('createRootReducer', () => {
  let handlers, store;

  beforeEach(() => {
    let res = makeStore({}, {msg: 'init'})
    store = res.store;
  });

  beforeEach(() => {
    handlers = createRootReducer({
      users: {}
    });
  })

  it('returns an actions object', () => {
    expect(handlers.actions).to.be.defined;
  })
  it('returns a reducers object', () => {
    expect(handlers.reducers).to.be.defined;
  })
  it('returns an initialState object', () => {
    expect(handlers.initialState).to.be.defined;
  });

  ['actions', 'reducers', 'initialState'].forEach(key => {
    // A little meta
    it(`has a users key in ${key}`, () => {
      expect(handlers[key].users).to.be.defined;
    });
  });

  describe('initialInitialState', () => {
    beforeEach(() => {
      handlers = createRootReducer({
        users: {
          initialState: { currentUser: { name: 'Ari' }}
        },
        events: {}
      }, {
        initialInitialState: {
          users: { currentUser: { name: 'fred' }},
        }
      });
    })

    it('overrides the initial state of the user', () => {
      expect(handlers.initialState.users.currentUser.name).to.eql('Ari')
    })
    it('does not override initial state when none is defined', () => {
      expect(handlers.initialState.events).to.eql({})
    });
  })

  describe('initialActions', () => {
    let sayFn, rejectFn, makeFn;
    beforeEach(() => {
      sayFn = sinon.spy();
      rejectFn = sinon.spy();
      makeFn = sinon.spy();

      handlers = createRootReducer({
        users: {
          actions: { say: sayFn }
        },
        events: {}
      }, {
        initialActions: {
          users: {reject: rejectFn}
        }
      })
    })

    it('creates actions as an empty object for modules, even if they do not exist', () => {
      expect(handlers.actions.events).to.eql({});
    })

    it('keeps the actions defined for those that do define actions', () => {
      expect(handlers.actions.users.say).to.be.defined;
      expect(typeof handlers.actions.users.say).to.eql('function');
    });

    it('does not override a function in actions', () => {
      handlers.actions.users.say('bob')
      expect(sayFn).to.have.been.calledWith('bob')
      handlers.actions.users.reject();
      expect(rejectFn).to.have.been.called
    });
  })

  describe('initialReducers', () => {
    let routingReducer, userReducer;
    beforeEach(() => {
      routingReducer = sinon.spy();
      userReducer = sinon.spy();

      handlers = createRootReducer({
        users: {
          reducer: userReducer
        },
        events: {}
      }, {
        initialReducers: {
          routing: routingReducer
        }
      })
    });

    it('merges passed reducer in', () => {
      expect(handlers.reducers.users).to.eql(userReducer);
    })

    it('sets the reducer to a noop value when no reducer is passed', () => {
      expect(typeof handlers.reducers.events).to.eql('function')
    });

    it('sets the reducer to the initial reducer if no module is found', () => {
      expect(handlers.reducers.routing).to.eql(routingReducer)
    })
  })

});
