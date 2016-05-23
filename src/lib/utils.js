import invariant from 'invariant';

export const noop = (r) => r;
export const syncEach = (initial, cb) => {
  invariant(initial, 'No initial value defined');

  cb = typeof cb === 'function' ? cb : noop;

  return (list) => {
    return new Promise(function(resolve, reject) {
      list = list.slice(0);

      const doNext = (val) => {
        if (list.length) {
          let item = list.shift();

          let fn = typeof item === 'function' ? cb(item) : cb;

          let ret;
          if ('then' in Object(val)) {
            ret = val.then((res) => fn(res, item))
          } else {
            ret = Promise.resolve(fn(val, item))
          }

          ret.then(doNext, reject);
        } else {
          resolve(val);
        }
      }

      doNext(initial);
    });
  }
}
