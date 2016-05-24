---
todos:
  - Why handle this in one project
---

## Redux modules

The `redux-modules` package offers a different method of handling [redux](http://redux.js.org/) module packaging.

The overall idea behind `redux-modules` is to build all of the corresponding redux functionality, constants, reducers, actions in a common location that makes it easy to understand the entire workflow common to a component of an application.

Redux modules is essentially a collection of helpers that provide functionality for common tasks related to using Redux.


## Quick take

A redux module enables us to build our redux modules in a simple manner. A redux module can be as simple as:

```javascript
/**
 * Creates a `types` object
 * with the hash of constants
 **/
const types = createConstants({
  prefix: 'TODO'
})(
  'CREATE',
  'MARK_DONE',
  'FETCH_ALL': {api: true}
);

/**
 * The root reducer that handles only create
 **/
const reducer = createReducer({
  [types.CREATE]: (state, {payload}) => ({
    ...state,
    todos: state.todos.concat(payload)
  }),

  // decorator form
  @apiHandler(types.FETCH_ALL, (apiTypes) => {
    // optional overrides
    [apiTypes.FETCH_ALL_LOADING]: (state, action) => ({...state, loading: true})
  })
  handleFetchAll: (state, action) => ({...state, todos: action.payload})

  // or non-decorator form:
  handleFetchAll: createApiHandler(types.FETCH_ALL)((state, action) => {
    return {...state, todos: action.payload};
  })
})

/**
 * Actions
 **/
const actions = createActions({
  createTodo: (text) => (dispatch) => dispatch({
    type: types.CREATE,
    payload: {text: text, done: false}
  }),

  // decorator form
  @api(types.FETCH_ALL)
  fetchAll: (client, opts) => client.get({path: '/todos'})

  // or non-decorator form
  fetchAll: createApiAction(types.FETCH_ALL)((client, opts) => {
    return () => (dispatch, getState) => client.get('/todos')
  })
})
```

In our app, our entire todo handler, reducer, and actions are all in one place in a single file. Incorporating the handler, reducer, and actions in our redux app is up to you. See [Usage in Redux](#usage-with-redux) for information.

## Example

For example, let's take the idea of writing a TODO application. We'll need a few actions:

* Create
* Mark done
* Fetch All

Using `redux-modules`, we can create an object that carries a unique _type_ string for each of the actions in namespace path on a type object using the `createConstants()` exported method. For instance:

```javascript
const types = createConstants('TODO')({
  'CREATE': true, // value is ignored
  'FETCH_ALL': {api: true}
})
```

<div id="constantExample"></div>

If you prefer not to use any of the api helpers included with `redux-modules`, the `createConstants()` function accepts a simple list of types instead:

```javascript
const types = createConstants('TODO')(
  'CREATE', 'MARK_DONE', 'DELETE'
)
```

## createReducer

The `createReducer()` exported function is a simple reduce handler. It accepts a single object and is responsible for passing action handling down through defined functions on a per-action basis.

The first argument object is the list of handlers, by their type with a function to be called on the dispatch of the action. For instance, from our TODO example, this object might look like:

```javascript
const reducer = createReducer({
  [types.CREATE]: (state, {payload}) => ({
    ...state,
    todos: state.todos.concat(payload)
  })
});
```

The previous object defines a handler for the `types.CREATE` action type, but does not define one for the `types.FETCH_ALL`. When the `types.CREATE` type is dispatched, the function above runs and is considered the reducer for the action. In this example, when the `types.FETCH_ALL` action is dispatched, the default handler: `(state, action) => state` is called (aka the original state).

To add handlers, we only need to define the key and value function.

## API handling

The power of `redux-modules` really comes into play when dealing with async code. The common pattern of handling async API calls, which generates multiple states. Notice in our above example we can mark types as `api`

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
