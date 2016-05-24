## Redux modules

The `redux-modules` package offers a different method of handling [redux](http://redux.js.org/) module packaging.

The overall idea behind `redux-modules` is to build all of the corresponding redux functionality, constants, reducers, actions in a common location that makes it easy to understand the entire workflow common to a component of an application.

Redux modules is essentially a collection of helpers that provide functionality for common tasks related to using Redux.

## Quick take

A redux module enables us to build our redux modules in a simple manner. A redux module can be as simple as:

```javascript
/**
 * Creates a `types` object
 * with the hash of CREATE, DELETE, MARK_DONE constants
 **/
const types = createConstants('TODO')( 'CREATE', 'DELETE', 'MARK_DONE');

/**
 * The root reducer that handles only create
 **/
const reducer = createReducer({
  [types.CREATE]: (state, {payload}) => ({
    ...state,
    todos: state.todos.concat(payload)
  })
})

/**
 * Actions
 **/
const actions = createActions({
  createTodo: (text) => (dispatch) => dispatch({
    type: types.CREATE,
    payload: {text: text, done: false}
  })
})
```

In our app, our entire todo handler, reducer, and actions are all in one place in a single file. Incorporating the handler, reducer, and actions in our redux app is up to you. See [Usage in Redux](#usage-with-redux) for information.

## Example

For example, let's take the idea of writing a TODO application. We'll need three actions:

* Create
* Delete
* Mark done

Using `redux-modules`,

## Redux api handlers

The first requirement is to require a middleware (similar to the `react-redux-routing` library) to provide common api configuration settings.

```javascript
// ...
let todoApp = combineReducers(reducers)
let apiMiddleware = createApiMiddleware({
                      baseUrl: BASE_URL,
                      headers: {}
                    });
let store = createStore(reducers,
            applyMiddleware(apiMiddleware, thunk));
// ...
```

The `apiMiddleware` variable above currently decorates an actions `meta` object. For instance:

```javascript
store.dispatch({
  type: 'API_FETCH_ALL',
  payload: {},
  meta: {isApi: true}
});
// passes to the `thunk` middleware the resulting action:
store.dispatch({
  type: 'API_FETCH_ALL',
  payload: {},
  meta: {
    isApi: true,
    baseUrl: BASE_URL,
    headers: {}
  }
});
```

The second requirement is that api actions are currently _decorated_ with the `@api` decorator:

```javascript
// actions
@api(types.FETCH_ALL)
fetchAll: (client, opts) => {
  return client.get({
    path: '/news'
  }).then((json) => {
    return json;
  });
}
```

To handle this api in a reducer, we have the `@apiHandler` decorator. The `@apiHandler` decorator provides a common interface for handling the different states of an api request (i.e. `loading`, `success`, and `error` states).

```javascript
@apiHandler(types.FETCH_ALL)
handleFetchAll: (state, {payload}) => {...state, ...payload}
```

To handle custom loading states, we can "hook" into them with a second argument:

```javascript
@apiHandler(types.FETCH_ALL, (apiTypes) => ({
  [apiTypes.ERROR]: (state, {payload}) => ({
    ...state,
    error: payload.body.message,
    loading: false
  })
}))
handleFetchAll: (state, {payload}) => {...state, ...payload}
```

## Usage with redux

## Combining usage with `ducks-modular-redux`


## All exports

The `redux-modules` is comprised by the following exports:

### createConstants

`createConstants()` creates an object to handle creating an object of type constants. It allows for multiple

### createReducer

### apiClient

### createApiMiddleware

### createApiAction/@api

### createApiHandler/@apiHandler

### apiHandler
