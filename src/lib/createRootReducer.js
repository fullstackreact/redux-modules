// create root reducer
import { combineReducers } from 'redux';

const noop = (r) => r;
export const createRootReducer = (modules, {
  initialActions={},
  initialInitialState={},
  initialReducers={}
}={}) => {
  // Copies of initially passed in config objects
  let actions = Object.assign({}, initialActions);
  let initialState = Object.assign({}, initialInitialState);
  let reducers = Object.assign({}, initialReducers);

  Object.keys(modules).forEach(key => {
    const module = modules[key];

    initialState[key] = Object.assign({},
                          initialState[key] || {},
                          module.initialState || {});

    actions[key] = Object.assign({},
                          actions[key] || {},
                          module.actions || {});

    reducers[key] = module.reducer || noop;
  });

  return {initialState, actions, reducers}
}
// const containers = {
//   events: require('./modules/events'),
//   currentEvent: require('./modules/currentEvent'),
//   images: require('./modules/images'),
//   users: require('./modules/users')
// }
// export let actions = {
//   routing: {
//     navigateTo: path => dispatch => dispatch(push(path))
//   }
// }
//
// export let initialState = {}
// export let reducers = {routing};
//
// Object.keys(containers).forEach(key => {
//   const container = containers[key];
//   initialState[key] = container.initialState || {};
//   actions[key] = container.actions;
//   reducers[key] = container.reducer;
// });
//
// export const rootReducer = combineReducers(reducers);
