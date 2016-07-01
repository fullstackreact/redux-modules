export const createReducer = function(actionHandlers, initialState={}) {
  return function(state = initialState, action): Object {
console.log('createReducer', state, action);
    const handler = actionHandlers[action.type];
    return handler ? handler(state, action) : state;
  }
}
