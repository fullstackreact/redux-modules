import {apiStates, getApiTypes, toApiKey} from './utils';


function apiKeys(name) {
  return apiStates.map((state) => `${name}_${state}`.toUpperCase());
}

// Default reducers (this happens when you don't define a reducer per state)
// Order is: loading, success, error
const apiStateHandlers = [
  (state) => ({...state, loading: true}),
  (state, action) => ({...state, loading: false, data: action.payload, errors: []}),
  (state, action) => ({...state, loading: false, data: [], errors: action.payload})
]

// Mapping of the state to their default handler from above
// NOTE: this one differs from uncommented version also
const apiReducers = {
  [apiStates[0]]: apiStateHandlers[0],
  [apiStates[1]]: apiStateHandlers[1],
  [apiStates[2]]: apiStateHandlers[2],
}

/**
 * Build the state to names handler reducer and
 * the handlers object in one to avoid multiple iterations
 * @constructor
 * @param {string} type string - the type constant
 * @returns {object} object returns with reducers and names
 */
function handlerReducersForType(type:String) {
  let apiActionTypes = getApiTypes(type);
  let reducers = {};
  let namesToState = {};
  apiActionTypes.forEach((key, idx) => {
    reducers[apiActionTypes[idx]] = apiReducers[apiStates[idx]];
    namesToState[toApiKey(apiStates[idx])] = apiActionTypes[idx];
  });
  return {reducers, namesToState};
}

// Decorator for a reducer object property function
// @param String type - string constant type
// @param Function handlerFn (optional) - Function defining custom reducers that
//        accepts a single argument of the api types mapped to their
//        corresponding constant, i.e.
//        { loading: 'FETCH_ALL_LOADING',
//          success: 'FETCH_ALL_SUCCESS',
//          error: 'FETCH_ALL_ERROR' }
// Usage:
//   @apiHandler('FETCH_ALL', (apiStates) => {})
//   i.e:
//   @apiHandler(types.SAVE_CROP)
//   handleSaveCrop: (state, action) => {return new state after doing stuff..})
export function createApiHandler(type, handlerFn) {
  // The decorator function
  // target is the object,
  // name is the function name
  // def is the object property definition
  return function decoratedHandler(target) {
    // Default api action handlers
    let {reducers, namesToState} = handlerReducersForType(type);

    // If there is no handle function or the handle function is not
    // a function, then set it to be a identity function
    if (!handlerFn || typeof handlerFn !== 'function') {
      handlerFn = (d) => {
        return d;
      }
    }

    // Custom handlers for the different api states from the second argument
    // If no function is passed, the identify function is used
    let handlers = handlerFn(namesToState) || {};

    // Compute difference between the default hanlders and our almost new target
    // Keys our custom function handler overwrites defaults
    let handlerKeys = Object.keys(handlers);

    // All handler keys, i.e. loading, success, error
    let defaultReducerKeys = Object.keys(reducers);

    // The difference between what we handled and what we did not
    // i.e. allows us to only overwrite 1..n without overwriting other defaults
    let missingHandlerKeys = defaultReducerKeys.filter(x => handlerKeys.indexOf(x) === -1);

    // Set defaults for those undefined by custom function
    missingHandlerKeys.forEach(k => handlers[k] = reducers[k]);

    // The handler passed by the decorated function
    let valueHandler = target;

    // ALWAYS set the function to be the defined function
    handlers[namesToState.SUCCESS] = valueHandler;

    // Return the new object property definition
    return handlers;
  }
}

// decorator form
// @param type - string constant
// @return function - a nwe decorated function Object.defineProperty
export function apiHandler(type, handlerFn) {
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
   let valueHandler = def.initializer(type);
   let handlers = createApiHandler(type, handlerFn)(valueHandler);

    // Dark and murky overwrite object in place -- possibly the grossest thing ever
    Object.assign(target, handlers);

   let newDef =  {
     enumerable: true,
     writable: true,
     configurable: true,
     value: handlers,
   };

   return newDef;
 }
}

export default apiHandler;
