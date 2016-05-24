export const createReducer = function(actionHandlers, initialState={}) {
  return function(state = initialState, action): Object {
    const handler = actionHandlers[action.type];
    return handler ? handler(state, action) : state;
  }
}
