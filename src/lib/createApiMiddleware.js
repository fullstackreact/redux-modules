import {REDUX_MODULE_ACTION_KEY} from './constants';
/*
 * Decorate the api actions with common handlers
 */
export const createApiMiddleware = (baseOpts) => {
  return store => next => action => {

    if (action.type === REDUX_MODULE_ACTION_KEY) {
      const { runFn: fn } = action && action.meta || {};
      if (fn) {
        const res = fn(baseOpts);
        return res;
      }
    } else {
      return next(action);
    }
  }
}

export default createApiMiddleware;
