/*
 * Decorate the api actions with common handlers
 */
export const createApiMiddleware = (baseOpts) => {
  const _mergeMetaOpts = (action, newMeta = {}) => {
    return Object.assign({}, action.meta, baseOpts, newMeta);
  }
  const _runMetaFunction = (store, action) => {
    let newMeta = baseOpts(store, action);
    return _mergeMetaOpts(action, newMeta);
  }

  const getMeta = (store, action) => (typeof baseOpts === 'function') ?
                                _runMetaFunction(store, action) :
                                _mergeMetaOpts(action);

  return store => next => action => {
    if (action && action.meta && action.meta.isApi) {

      let newMeta = getMeta(store, action);
      let newAction = Object.assign({}, action, {
        meta: newMeta
      });
      return next(newAction);
    }

    return next(action);
  }
}

export default createApiMiddleware;
