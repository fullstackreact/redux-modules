import invariant from 'invariant';

/*
 * Default api states
 */
export const apiStates = ['loading', 'success', 'error'];

/*
 * apiKeys to fetch the api key type
 */
export function apiKeys(name, states = apiStates) {
  return states.map((state) => `${name}_${state}`.toUpperCase())
}

const toApiKey = (key) => `api_${key}`.toUpperCase();

/*
 * get the api values
 */
export function apiValues(name, states = apiStates) {
  return apiKeys(name, states)
    .reduce((sum, key) => ({
      ...sum,
      [key]: toApiKey(key)
    }), {});
}

export function createConstants(opts) {
  opts = opts || {};

  const defineType = (obj, prefix, n, v) => {
    if (typeof n === 'object') {
      // If it's an API type, decorate with the different
      // api states
      Object.keys(n).forEach((key) => {
        if (n.hasOwnProperty(key)) {
          let val = n[key];
          if (val && val.api) defineApi(obj, prefix, key, val.states);

          // Don't store objects in static arrays
          if (typeof val === 'object') {
            val = null;
          }

          defineType(obj, prefix, key, v);
        }
      });
    } else {
      v = v || `${prefix}_${n}`.toUpperCase();
      Object.defineProperty(obj, n, {
        value: v,
        enumerable: true,
        writable: false,
        configurable: false
      });
    }
    return obj;
  };

  const defineApi = (obj, prefix, n, states) => {
    apiKeys(n, states).forEach((apiKey) => {
      const apiPrefix = `api_${prefix}`;
      defineType(obj, apiPrefix, apiKey);
    });
  };


  const definer = (obj, prefix) => {
    return (...definitions) => {
      definitions.forEach((def) => {
        defineType(obj, prefix, def);
      });
      return obj;
    };
  };

  let initialObject = opts.initialObject || {};
  let prefix = opts.prefix || '';
  return definer(initialObject, prefix);
}

export default createConstants;
