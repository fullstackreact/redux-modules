/* eslint-disable func-names */
/* ***********************************************
 * Example usage:
   // take the main action, and then return an object with each apiState handler function.
   @apiHandler(types.DOTHING, (apiTypes) => ({
   [apiTypes.LOADING]: (state) => ({
     ...state,
     loading: true,
     time: Date.now(),
     errors: [],
   }),
   [apiTypes.ERROR]: (state, action) => {
      // do stuf, like set the biggest thing, and do not return object immediately.
      let biggest = state.things.sort().shift
      return {
        ...state,
        biggest: biggest,
        loading: false,
        errors: action.payload.error,
        performance: Date.now() - state.time,
      }
    },
   }))
   handleGetMe: (state, action) => {
     return {
      ...userForState(state, action),
       wait_for_load_with_token: false,
       }
   },
   // here is a template to start with:
   @apiHandler(types.SAVE_ESTIMATE, (apiTypes) => ({
    [apiTypes.LOADING]: (state) => ({...state}),
    [apiTypes.ERROR]: (state, action) => ({...state, action.payload}),
   }))
   handleSaveEstimateSuccess: {}
 ************************************************/
import {createAction} from 'redux-actions';
import {REDUX_MODULE_API_ACTION_KEY} from './constants';
import ApiClient from './apiClient';
import {apiStates, getApiTypes, toApiKey, noop} from './utils';

export const API_CONSTANTS = {
  401: 'API_ERROR_FOUR_OH_ONE',
  418: 'API_ERROR_I_AM_A_LITTLE_TEAPOT',
  // 422: 'API_ERROR_UNPROCESSABLE',
  UNKNOWN_ERROR: 'API_ERROR_UNKNOWN'
}

const getActionTypesForKeys = (type, actionCreator = noop, metaCreator = noop) => getApiTypes(type)
  .reduce((memo, key, idx) => ({
    ...memo,
    [apiStates[idx]]: createAction(toApiKey(key), actionCreator, (...args) => ({isApi: true, ...metaCreator(args)}))
  }), {});

// Define a decorator for a function defined in an object
// that is expected to be an action.
// @param type - string constant
export function createApiAction(type, requestTransforms, responseTransforms, metaCreator) {
  // The decorator function wrapper (design: decoratorFn(fn()))
  // @param target - function to be decorated
  // @param name - the function name
  // @param def - the Object.defineProperty definition
  //
  // Functionally, this works by accepting the object definition type
  // from ES5 syntax, i.e.
  //    Object.defineProperty(this, 'fetchAll', {configurable: false, value: 2})
  // and it manipulates the definition by changing the value to be a function
  // that wraps the different api states, aka LOADING, SUCCESS, ERROR
  return function decoration(target) {
    // ApiTypes is the string constants mapped to a
    // createdAction (using `createAction`)
    // i.e. { loading: fetchAllLoading(), // anonymouse function
    //        success: fetchAllSuccess(),
    //        error: fetchAllError(),
    //      }
    let apiTypes = getActionTypesForKeys(type, (t) => t, metaCreator);
    // The new value for the object definition
    // return function decorated(globalOpts) {
      // globalOpts = globalOpts || {};
      // return a function (for thunk)
      return (configurationOpts={}) => (dispatch, getState) => {

        let autoExecute = true;
        if (typeof configurationOpts.autoExecute !== 'undefined') {
          autoExecute = configurationOpts.autoExecute;
          delete configurationOpts['autoExecute'];
        }

        // Small helper to turn all functions within this decorated functions
        // into a promise
        let promiseWrapper = (fn) => {
          return (...args) => Promise.resolve(dispatch(fn(...args)));
        };

        // The default handlers for the different states of the api request
        let loading = promiseWrapper(apiTypes.loading);
        let success = promiseWrapper(apiTypes.success);
        let error   = (errorObj) => {
          const getErrorStatus = status => typeof API_CONSTANTS[status] !== 'undefined' ?
                                              API_CONSTANTS[status] :
                                              API_CONSTANTS.UNKNOWN_ERROR;

          const reduceError = err => dispatch(apiTypes.error({error: errorObj, body: err}));
          const errType = toApiKey(getApiTypes(type)[2]);
          const errStatus = errorObj && errorObj.status ?
                getErrorStatus(errorObj.status) :
                API_CONSTANTS.UNKNOWN_ERROR;

            const action = {
              type: errType,
              payload: {
                error: errorObj,
                status: errStatus
              }
            };

            dispatch(action)
            return action;
        }

        const runFn = (runtimeOpts) => {
          const opts = Object.assign({}, configurationOpts, runtimeOpts);
          // The `initializer` is the original pre-decorated function
          // let actionFn = def ? def.initializer(opts) : target;
          let actionFn = target;
          // Every action gets an instance of ApiClient
          let client =
            new ApiClient(opts, getState, requestTransforms, responseTransforms);
          // NOTE, check this: do we need below version ?
          // new ApiClient(opts, getState, requestTransforms, responseTransforms);

          // callAction wraps the `async` functionality that ensures
          // we always get a promise returned (and can be used to pass along
          // other thunk functions)
          let callAction = () => {
            loading(opts);
            let retVal = actionFn.call(null, client, opts, getState, dispatch);
            if (typeof retVal.then !== 'function') {
              retVal = Promise.resolve(retVal);
            }
            return retVal
              .then(success)
              // Should we _also_ fire the original event, even if it's an API request too?
              // .then((...args) => dispatch({type: type, payload: args}))
              .catch(error);
          };
          // NOTE, check this: do we need below version ?
          // new ApiClient(opts, getState, requestTransforms, responseTransforms);

          // callAction wraps the `async` functionality that ensures
          // we always get a promise returned (and can be used to pass along
          // other thunk functions)
          return callAction();
        };

        const action = {
          type: REDUX_MODULE_API_ACTION_KEY,
          meta: { runFn, type }
        }
        if (autoExecute) {
          dispatch(action);
        } else {
          return action;
        }
        // dispatch(action);
        // return action;
      };
    // };
  };
}

 // decorator form
 // @param type - string constant
 // @return function - a nwe decorated function Object.defineProperty
export function api(type, requestTransforms, responseTransforms, metaCreator) {
  // The decorator function wrapper (design: decoratorFn(fn()))
  // @param target - function to be decorated
  // @param name - the function name
  // @param def - the Object.defineProperty definition
  //
  // Functionally, this works by accepting the object definition type
  // from ES5 syntax, i.e.
  //    Object.defineProperty(this, 'fetchAll', {configurable: false, value: 2})
  // and it manipulates the definition by changing the value to be a function
  // that wraps the different api states, aka LOADING, SUCCESS< ERROR
  return function decoration(target, name, def) {
    let newVal = createApiAction(type, requestTransforms, responseTransforms, metaCreator)(def.initializer);
    let newDef =  {
      enumerable: true,
      writable: true,
      configurable: true,
      value: newVal,
    };

    return newDef;
  }
}

export default api;
