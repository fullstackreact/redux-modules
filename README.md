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

In our app, our entire todo handler, reducer, and actions are all in one place in a single file. Incorporating the handler, reducer, and actions in our redux app is up to you. See [Usage in Redux](#usage-with-react-redux) for information.

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

The power of `redux-modules` really comes into play when dealing with async code. The common pattern of handling async API calls, which generates multiple states.

Notice in our above example we can mark types as `api: true` within a type object and notice that it created 4 action key/values in the object which correspond to different states of an api call (loading, success, error, and the type itself). We can use this pattern to provide simple api handling to any action/reducer.

### apiMiddleware

In order to set this up, we need to add a middleware to our redux stack. This middleware helps us define defaults for handling API requests. For instance. In addition, `redux-modules` depends upon [redux-thunk](https://github.com/gaearon/redux-thunk) being available as a middleware _after_ the apiMiddleware.

For instance:

```javascript
// ...
let todoApp = combineReducers(reducers)
let apiMiddleware = createApiMiddleware({
                      baseUrl: `https://fullstackreact.com`,
                      headers: {}
                    });
let store = createStore(reducers,
            applyMiddleware(apiMiddleware, thunk));
// ...
```

The object the `createApiMiddleware()` accepts is the default configuration for all API requests. For instance, this is a good spot to add custom headers, a `baseUrl` (required), etc. Whatever we pass in here is accessible across every api client.

For more _dynamic_ requests, we can pass a function into any one of these options and it will be called with the state so we can dynamically respond. An instance where we might want to pass a function would be with our headers, which might respond with a token for every request. Another might be a case for A/B testing where we can dynamically assign the `baseUrl` on a per-user basis.

```javascript
// dynamically adding headers for _every_ request:
let apiMiddleware = createApiMiddleware({
                      baseUrl: `https://fullstackreact.com`,
                      headers: (state) => ({
                        'X-Auth-Token': state.user.token
                      })
                    });
```

The `apiMiddleware` above currently decorates an actions `meta` object. For instance:

```javascript
{
  type: 'API_FETCH_ALL',
  payload: {},
  meta: {isApi: true}
}
// passes to the `thunk` middleware the resulting action:
{
  type: 'API_FETCH_ALL',
  payload: {},
  meta: {
    isApi: true,
    baseUrl: BASE_URL,
    headers: {}
  }
}
```

### apiActions

The easiest way to take advantage of this api infrastructure is to decorate the actions with the `@api` decorator (or the non-decorator form `createApiAction()`). When calling an api action created with the `@api/createApiAction`, `redux-modules` will dispatch two actions, the loading action and the handler.

The `loading` action is fired with the type `[NAMESPACE]_loading`. The second action it dispatches is the handler function. The method that it is decorated with is expected to return a promise (although `redux-modules` will convert the response to a promise if it's not already one) which is expected to resolve in the case of success and error otherwise.

More conveniently, `redux-modules` provides a client instance of [ApiClient](https://github.com/fullstackreact/redux-modules/blob/master/src/lib/apiClient.js) for every request (which is a thin wrapper around `fetch`).

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

The `apiClient` includes handling for request transformations, status checking, and response transformations. We'll look at those in a minute. The `apiClient` instance includes the HTTP methods:

* GET
* POST
* PUT
* PATCH
* DELETE
* HEAD

These methods can be called on the client itself:

```javascript
client.get({})
client.post({})
client.put({})
```

When they are called, they will be passed a list of options, which includes the base options (passed by the middleware) combined with custom options passed to the client (as the first argument).

#### api client options

The `apiClient` methods accept an argument of options for a per-api request customization. The following options are available and each can be either an atomic value or a function which gets called with the api request options within the client itself _or_ in the `baseOpts` of the middleware.

When defining these options in the middleware, keep in mind that they will be available for every request passed by the `client` instance.

1. path

If a `path` option is found, `apiClient` will append the path to the `baseUrl`. If the `client` is called with a single _string_ argument, then it is considered the `path`. For instance:

```javascript
// the following are equivalent
client.get('/foo')
client.get({path: '/foo'})
// each results in a GET request to [baseUrl]/foo
```

2. url

To completely ignore the `baseUrl` for a request, we can pass the `url` option which is used for the request.

```javascript
client.get({url: 'http://google.com/?q=fullstackreact'})
```

3. appendPath

For dynamic calls, sometimes it's convenient to add a component to the path. For instance, we might want to append the url with a custom session key.

```javascript
client.get({appendPath: 'abc123'})
```

4. appendExt

The `appendExt` is primarily useful for padding extensions on a url. For instance, to make all requests to the url with the `.json` extension, we can pass the `appendExt` to json:

```javascript
client.get({appendExt: 'json'})
```

5. params

The `params` option is a query-string list of parameters that will be passed as query-string options.

```javascript
client.get({params: {q: 'fullstackreact'}})
```

6. headers

Every request can define their own headers (or globally with the middleware) by using the `headers` option:

```javascript
client.get({headers: {'X-Token': 'bearer someTokenThing'}})
```

#### transforms

The request and response transforms provide a way to manipulate requests as they go out and and they return. These are functions that are called with the `state` as well as the current request options.

#### requestTransforms

Request transforms are functions that can be defined to create a dynamic way to manipulate headers, body, etc. For instance, if we want to create a protected route, we can use a requestTransform to append a custom header.

```javascript
client.get({
  requestTransforms: [(state, opts) => req => {
    req.headers['X-Name'] = 'Ari';
    return req;
  }]
})
```

#### responseTransforms

A response transform handles the resulting request response and gives us an opportunity to transform the data to another format on the way in. The default response transform is to respond with the response body into json. To handle the actual response, we can assign a responseTransform to overwrite the default json parsing and get a handle on the actual fetch response.

```javascript
let timeTransform = (state, opts) => res => {
  res.headers.set('X-Response-Time', time);
  return res;
}
let jsonTransform = (state, opts) => (res) => {
  let time = res.headers.get('X-Response-Time');
  return res.json().then(json => ({...json, time}))
}
client.get({
  responseTransforms: [timeTransform, jsonTransform]
})
```

For apis that do not respond with json, the `responseTransforms` are a good spot to handle conversion to another format, such as xml.

### apiHandlers

To handle api responses in a reducer, `redux-modules` provides the `apiHandler` decorator (and it's non-decorator form: `createApiHandler()`). This decorator provides a common interface for handling the different states of an api request (i.e. `loading`, `success`, and `error` states).

```javascript
@apiHandler(types.FETCH_ALL)
handleFetchAll: (state, {payload}) => {...state, ...payload}
```

The decorated function is considered the _success_ function handler and will be called upon a success status code returned from the request.

To handle custom loading states, we can "hook" into them with a second argument. The second argument is a function that's called with the dynamic states provided by the argument it's called with. For instance, to handle custom handling of an error state:

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

## Usage with react-redux

There are multiple methods for combining `redux-modules` with react and this is our opinion about how to use the two together.

First, our directory structure generally sets all of our modules in their own directory:

```bash
index.js
  /redux
    /modules/
      todo.js
      users.js
    configureStore.js
    rootReducer.js
    index.js
```

Configuring the store for our app is straight-forward. First, we'll apply the `createApiMiddleware()` before we create the final store. In a `configureStore.js` file, we like to handle creating a store in a single spot. We'll export a function to configure the store:

```javascript
import {rootReducer, actions} from './rootReducer'

export const configureStore = ({initialState = {}}) => {
  let middleware = [
    createApiMiddleware({
      baseUrl: BASE_URL
    }),
    thunkMiddleware
  ]
  // ...
  const finalCreateStore =
        compose(applyMiddleware(...middleware))(createStore);

  const store = finalCreateStore(rootReducer, initialState);
  // ...
}
```

This creates the middleware for us. Next, we like to combine our actions into a single actions object that we'll pass along down through our components. We'll use the `bindActionCreatorsToStore()` export to build our action creators and bind them to the store.

We'll need to bind our actions to the store, so that when we call dispatch it will use our store's dispatch (see [react-redux](https://github.com/reactjs/react-redux)). Just after we create the store, we'll:

```javascript
let actions = bindActionCreatorsToStore(actions, store);
```

From here, we just return the store and actions from the function:

```javascript
export const configureStore = ({initialState = {}}) => {
  // ...
  const store = finalCreateStore(rootReducer, initialState);
  // ...
  let actions = bindActionCreatorsToStore(actions, store);

  return {store, actions};
}
```

Now that the heavy-lifting is done, the `rootReducer.js` file is pretty simple. We export all the actions and reducers pretty simply:

```javascript
const containers = ['users', 'todos'];

export const reducers = {}
export const actions = {};

containers.forEach(k => {
  let val = require(`./modules/${v}`);
  reducers[k] = val.reducer;
  actions[k] = val.actions || {};
});

export const rootReducer = combineReducers(reducers);
```

From here, our main container can pass the store and actions as props to our components:

```javascript
const {store, actions} = configureStore({initialState});
// ...
ReactDOM.render(
  <Container store={store}, actions={actions} />,
  node);
```

Now, anywhere in our code, we can refer to the actions we export in our modules by their namespace. For instance, to call the `createTodo()` function, we can reference it by the prop namespace:

```javascript
class Container extends React.Component {

  createTodo() {
    const {actions} = this.props;
    // form: actions.[namespace].[actionName]();
    actions.todos.createTodo("Finish this text");
  }

  render() {
    return (
      <div onClick={this.createTodo.bind(this)}>
        Create todo
      </div>
    )
  }
}
```

## Combining usage with `ducks-modular-redux`

`redux-modules` plays nicely with other redux packages as well. For instance, the `ducks-modular-redux` package defines a specific method of handling actions, reducers, and types.

To create types in the same way, we can use the `separator` and `prefix` options in `createConstants()`. For instance, to create the constants defined by `ducks-modular-redux`'s README':

```javascript
const LOAD   = 'my-app/widgets/LOAD';
const CREATE = 'my-app/widgets/CREATE';
const UPDATE = 'my-app/widgets/UPDATE';
const REMOVE = 'my-app/widgets/REMOVE';
// In redux-modules:
const types = createConstants({
  prefix: ['my-app', 'widgets'],
  separator: '/'
})('LOAD', 'CREATE', 'UPDATE', 'REMOVE')
```

Handling the reducer function is similarly easy as well:

```javascript
export default function reducer(state = {}, action = {}) {
  switch (action.type) {
    // do reducer stuff
    default: return state;
  }
}
const reducer = createReducer({
  [types.LOAD]: (state, {payload}) => ({
    ...state,
    todos: state.todos.concat(payload)
  }),
  // ...
});
```

Finally, exporting functions individually from the file is directly supported. The `createActions()` and `createApiAction()` helpers can be used directly on created functions.

## All exports

The `redux-modules` comprises the following exports:

### createConstants

`createConstants()` creates an object to handle creating an object of type constants. It allows for multiple types to be dynamically created with their own custom prefixing, created on a single object.

```javascript
const types = createConstants({})('DOG', 'CAT');
```

Options:

* prefix (string/array, default: '')

The `prefix` option creates each type with a predefined prefix.

```javascript
const types = createConstants({
  prefix: 'animals'
})('DOG', 'CAT')
expect(types.DOG).to.eql('ANIMALS_DOG');
expect(types.CAT).to.eql('ANIMALS_CAT');

const types = createConstants({
  prefix: ['test', 'animals']
})('DOG', 'CAT')
expect(types.DOG).to.eql('TEST_ANIMALS_DOG');
expect(types.CAT).to.eql('TEST_ANIMALS_CAT');
```

* separator (string, default: `_`)

The separator option allows us to change the way prefixes are concatenated. To change the separator to use a `/`, add the separator option:

```javascript
const types = createConstants({
  separator: '/',
  prefix: ['test', 'animals']
})('DOG', 'CAT')
expect(types.DOG).to.eql('TEST/ANIMALS/DOG');
expect(types.CAT).to.eql('TEST/ANIMALS/CAT');
```

* initialObject (object, default: `{}`)

For the case where you want to define types on an existing object, `createConstants()` accepts an `initialObject` to add the types. This allows us to create a single global object (for instance) to define all of our types.

```javascript
const types = createConstants({
  initialObject: types
})('OTHER', 'CONSTANTS');
```

### createReducer

The `createReducer()` function returns a function that acts similar to the switch-case functionality of redux where we'll define the types and the reducers that handle the types.

```javascript
const reducer = createReducer({
  [types.CREATE]: (state, {payload}) => ({
    ...state,
    todos: state.todos.concat(payload)
  })
});
```

### bindActionCreatorsToStore

The `bindActionCreatorsToStore()` function accepts two arguments, the action handler object and the store object. It takes each action, binds the function to the `store` object (so `this` refers to the `store`) and then calls the `bindActionCreators()` redux function to the store object. Use the returned value as the reducer object.

```javascript
let actions = bindActionCreatorsToStore(actions, store);
```

### createApiMiddleware

In order to set global options for every api request, we have to include a middleware in our stack. Creating the middleware for our redux stack uses `createApiMiddleware()` and essentially looks for any api action (with `meta.isApi` set to true) and merges global options into the `meta` key of the action.

We _must_ set the `baseUrl` in the middleware, which is used as the default url to make a request against. Without the `baseUrl`, all requests will be sent without an http component (unless set otherwise in the `apiClient`):

```javascript
let apiMiddleware = createApiMiddleware({
                      baseUrl: `https://fullstackreact.com`,
                      headers: {
                        'Accept': 'application/json'
                      }
                    });
```

### apiClient

The `apiClient` is a loose wrapper around the native html5 `fetch()` function (built around `isomorphic-fetch`, which makes testing easier). When an action is marked as an API action, it will be called with an instance of the `apiClient` as well as the options `fetch()` will be called with. This gives us an easy, flexible way to make API requests.

The `apiClient` instance creates methods for each HTTP method, which accepts custom parameters to make the requests. It handles building the request, the options, putting together the url, packaging the body, request and response transformations, and more.

Using the `apiClient` instance inside of an api action request looks like:

```javascript
@api(types.FETCH_ALL)
fetchAll: (client, opts) => client.get({path: '/todos'})
// or non-decorator version
let decoratedFetchall = createApiAction(types.FETCH_ALL)(function(client, opts) {
  return client.get({path: '/todos'})
});
```

By default, the request is assumed to be in json format, but this is flexible and can be manipulated on a global/per-request level.

Every option that the `apiMiddleware` and `apiClient.[method]` accepts can be either an atomic value or it can be a function. If a function is passed, it will be called at runtime with the current options and state to allow for dynamic responses based upon the state.

The available options for _both_ apiMiddleware and client method requests are [here](#api-client-options).

### createApiAction/@api

To create an api action creator, we can decorate it with the `@api` decorator (when defined inline in an object) or using the `createApiAction()` function. Using this decorator, the function itself will be used to fetch an api.

The decorated function is expected to use the `client`, although it is not required. It is expected that the decorated function returns a value, either a promise or an atomic value.

```javascript
{
  actions: {
    @api(types.FETCH_ALL)
    fetchAll: (client, opts) => client.get({path: '/todos'})
  }
}
// OR non-decorator version
const fetchAll = createApiAction(types.FETCH_ALL)(
  (client, opts) => client.get('/todos'));
```

Using the decorator will dispatch actions according to their response status, first dispatching the `loading` type (i.e. `{type: 'API_FETCH_ALL_LOADING', opts}`), then it calls the handler. Once the handler returns, the corresponding action `_SUCCESS` or `_ERROR` action types are dispatched.

### createApiHandler/@apiHandler

In order to handle the response from an api request, we need to create a reducer. The `api` decorator fires the status values for the state of the api request. Using the `createApiHandler()/@apiHandler` decorator sets up default handlers for dealing with these responses.

```javascript
{
  reducers: {
    @apiHandler(types.FETCH_ALL)
    handleFetchAll: (state, action) => ({...state, ...action.payload});
  }
}
// or non-decorator version
const handlers = createApiHandler(types.FETCH_ALL) => {})((state, action) => {
  return {
    ...state,
    ...action.payload
  }  
});
```

The default actions will set the `loading` flag to true when the `_LOADING` action type is called, while the `loading` flag (in the state) will be set to false for the `_ERROR` and `_SUCCESS` types.

For the case where we want to handle the states in a custom way, we can pass a second argument as a function which is called with the api states object where we can set custom handlers. For instance, to handle loading and errors in our previous example:

```javascript
{
  reducers: {
    @apiHandler(types.FETCH_ALL, (apiStates) => {
      [apiStates.loading]: (state, action) => ({...state, loading: true}),
      [apiStates.error]: (state, action) => {
        return ({
          ...state,
          error: action.payload
        })
      }
    })
    handleFetchAll: (state, action) => ({...state, ...action.payload});
  }
}
```

The decorated function is considered the success handler.

## Contributing

```shell
git clone https://github.com/fullstackreact/redux-modules.git
cd redux-modules
npm install
make dev
```

To run the tests (please ensure the tests pass when creating a pull request):

```shell
make test # or npm run test
```

___

# Fullstack React Book

<a href="https://fullstackreact.com">
<img align="right" src="https://github.com/fullstackreact/google-maps-react/raw/master/resources/readme/fullstack-react-hero-book.png" alt="Fullstack React Book" width="155" height="250" />
</a>

This repo was written and is maintained by the [Fullstack React](https://fullstackreact.com) team. In the book we cover many more projects like this. We walk through each line of code, explain why it's there and how it works.

This app is only one of several apps we have in the book. If you're looking to learn React, there's no faster way than by spending a few hours with the Fullstack React book.

<div style="clear:both"></div>

## License
 [MIT](/LICENSE)
