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
import ApiClient from './apiClient';

export const API_CONSTANTS = {
  401: 'API_ERROR_FOUR_OH_ONE',
  // 422: 'API_ERROR_UNPROCESSABLE',
}
export const apiStates = ['loading', 'success', 'error'];

function apiKeys(name) {
  return apiStates.map((state) => `${name}_${state}`.toUpperCase());
}

const toApiKey = (k) => `${k}`.toUpperCase();
const getApiTypes = (type) => apiKeys(type).reduce((memo, key) => memo.concat(key), []);

const getActionTypesForKeys = (type, actionCreator = noop, metaCreator) => getApiTypes(type)
  .reduce((memo, key, idx) => ({
    ...memo,
    [apiStates[idx]]: createAction(toApiKey(key), actionCreator, metaCreator),
  }), {});

// Define a decorator for a function defined in an object
// that is expected to be an action.
// @param type - string constant
export function setApi(type, requestTransforms, responseTransforms, metaCreator) {
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
  return function decoration(target) {
    // ApiTypes is the string constants mapped to a
    // createdAction (using `createAction`)
    // i.e. { loading: fetchAllLoading(), // anonymouse function
    //        success: fetchAllSuccess(),
    //        error: fetchAllError(),
    //      }
    let apiTypes = getActionTypesForKeys(type, (t) => t, metaCreator);
    // The new value for the object definition
    return function decorated(opts) {
      opts = opts || {};
      // return a function (for thunk)
      return (dispatch, getState) => {
        // The `initializer` is the original pre-decorated function
        // let actionFn = def ? def.initializer(opts) : target;
        let actionFn = target;
        // Small helper to turn all functions within this decorated functions
        // into a promise
        let promiseWrapper = (fn) => {
          return (...args) => Promise.resolve(dispatch(fn(...args)));
        };

        // The default handlers for the different states of the api request
        let loading = promiseWrapper(apiTypes.loading);
        let success = promiseWrapper(apiTypes.success);
        let error   = (errorObj) => {
          const reduceError = err => dispatch(apiTypes.error({error: errorObj, body: err}));
          if (errorObj && errorObj.status) {
            const apiConstForStatus = API_CONSTANTS[errorObj.status] || getApiTypes(type)[2]
            dispatch({
              type: apiConstForStatus,
              payload: errorObj
            });
          }
          // throw errorObj;
          // return errorObj.body.then(reduceError).catch(reduceError);
        }

        // Every action gets an instance of ApiClient
        let client =
          new ApiClient(opts, getState, requestTransforms, responseTransforms);
        // NOTE, check this: do we need below version ?
        // new ApiClient(opts, getState, requestTransforms, responseTransforms);

        // callAction wraps the `async` functionality that ensures
        // we always get a promise returned (and can be used to pass along
        // other thunk functions)
        let callAction = () => {
          let retVal = actionFn.call(null, client, opts, getState, dispatch);
          if (typeof retVal.then !== 'function') {
            retVal = Promise.resolve(retVal);
          }
          return retVal
            .then(success)
            .catch(error);
        };
        // NOTE, check this: do we need below version ?
        // new ApiClient(opts, getState, requestTransforms, responseTransforms);

        // callAction wraps the `async` functionality that ensures
        // we always get a promise returned (and can be used to pass along
        // other thunk functions)
        return [
          loading(opts),
          callAction()
        ];
      };
    };
  };
}

 // decorator form
 // @param type - string constant
 // @return function - a nwe decorated function Object.defineProperty
export function api(type, requestTransforms, responseTransforms, metaCreator) {
  // console.log('type in @api ->', type);
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
    let newVal = setApi(type, requestTransforms, responseTransforms, metaCreator)(def.initializer);
    let newDef =  {
      enumerable: true,
      writable: true,
      configurable: true,
      value: newVal,
    };

    return newDef;
  }
}
