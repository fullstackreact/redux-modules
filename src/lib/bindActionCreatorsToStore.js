import { bindActionCreators } from 'redux'

export const bindActionCreatorsToStore = (actions, store) => {
  Object.keys(actions).forEach(k => {
    let theseActions = actions[k];

    let actionCreators = Object.keys(theseActions)
      .reduce((sum, actionName) => {
        // theseActions are each of the module actions which
        // we export from the `rootReducer.js` file (we'll create shortly)
        let fn = theseActions[actionName];
        // We'll bind them to the store
        sum[actionName] = fn.bind(store);
        return sum;
      }, {});

    // Using react-redux, we'll bind all these actions to the
    // store.dispatch
    actions[k] = bindActionCreators(actionCreators, store.dispatch);
  });

  return actions;
}
