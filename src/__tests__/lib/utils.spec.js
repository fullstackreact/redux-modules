import {expect} from 'chai';
import {apiKeys, syncEach} from '../../lib/utils';

describe('Utils', () => {
  describe('apiKeys', () => {
      it('creates state keys', () => {
          let keys = apiKeys('PERSON')
          expect(keys).to.include('PERSON_LOADING')
          expect(keys).to.include('PERSON_SUCCESS')
          expect(keys).to.include('PERSON_ERROR')
      });
      it('creates state keys with dynamic states', () => {
          let keys = apiKeys('PERSON', ['sit'])
          expect(keys).to.include('PERSON_SIT')
      });
  })

  describe('syncEach', () => {

    it('returns the initial value with an empty list', (done) => {
      syncEach(101, (curr) => curr)([])
        .then((val) => {
          expect(val).to.equal(101);
          done();
        }).catch(done);
    })

    it('waits for a list of atomic values', (done) => {
      syncEach(1, (val, curr) => val + curr)([2, 3])
        .then((val) => {
          expect(val).to.equal(6);
          done();
        }).catch(done);
    });

    it('waits for a list of promises', (done) => {
      const delayedPromise = (n) => (curr) => {
        return new Promise(resolve => {
          setTimeout(() => resolve(n + curr), n);
        })
      }
      const list = [
        delayedPromise(5),
        delayedPromise(5)
      ]

      syncEach(Promise.resolve(10))(list)
        .then(val => {
          expect(val).to.equal(20); // 10 + 15 + 20
          done();
        }).catch(done);
    })

  })
})
