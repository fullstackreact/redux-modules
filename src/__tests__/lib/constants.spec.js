import {
    expect
} from 'chai';
import {
    createConstants,
    apiKeys,
    apiValues
} from '../../lib/constants';

describe('createConstants', () => {
    let obj, typeFn;
    beforeEach(() => {
        obj = {};
        typeFn = createConstants({});
    });

    const prefixTests = (types, expected) => {
        it('creates a constant on the given object', () => {
            expect(types.HARRY).to.exist;
        });

        Object.keys(expected).forEach(key => {
            it(`creates a ${key} constant to equal ${expected[key]}`, () => {
                expect(types[key]).to.eql(expected[key])
            })
        })
        return types;
    }

    describe('with prefix', () => {
        prefixTests(createConstants({
            prefix: 'person'
        })('HARRY'), {
            'HARRY': 'PERSON_HARRY'
        })
    })

    describe('with a string opts', () => {
      const types = createConstants('some_prefix')('CREATE');
      expect(types.CREATE).to.eql('SOME_PREFIX_CREATE');
    });


    describe('without prefix', () => {
        prefixTests(createConstants({})('HARRY'), {
            'HARRY': '_HARRY'
        })
    })

    describe('with initialObject', () => {
        const types = prefixTests(createConstants({
            initialObject: {
                'bob': 1
            }
        })('HARRY'), {
            'HARRY': '_HARRY',
            'bob': 1
        });

        it('does not overwrite the initial value', () => {
            expect(Object.keys(types)).to.include('HARRY')
        });
    });

    describe('objects', () => {
        let types;
        beforeEach(() => {
            types = createConstants({})({
                'HISTORY': true,
                'PERSON': {
                    api: true
                },
                'DOG': {
                    api: true,
                    states: ['sit', 'stay']
                }
            })
        })
        it('accepts an object definition', () => {
            expect(types.HISTORY).to.exist;
        });
        it('creates api events for each type', () => {
            expect(types.PERSON).to.exist;
            expect(types.PERSON_LOADING).to.exist;
            expect(types.PERSON_SUCCESS).to.exist;
            expect(types.PERSON_ERROR).to.exist;
        });
        it('creates api type postfixes', () => {
            expect(types.PERSON).to.eql('_PERSON');
            expect(types.PERSON_LOADING).to.eql('API__PERSON_LOADING');
            expect(types.PERSON_SUCCESS).to.eql('API__PERSON_SUCCESS');
            expect(types.PERSON_ERROR).to.eql('API__PERSON_ERROR');
        });
        it('accepts custom states', () => {
            expect(types.DOG).to.eql('_DOG');
            expect(types.DOG_SIT).to.eql('API__DOG_SIT')
            expect(types.DOG_STAY).to.eql('API__DOG_STAY');
            expect(types.DOG_LOADING).not.to.exist;
        })
    })

  describe('separator', () => {
    it('can accept a string separator', () => {
      let types = createConstants({
        separator: '/'
      })('DOG', 'CAT');
      expect(Object.keys(types).length).to.equal(2);
      expect(types.DOG).to.eql('/DOG')
      expect(types.CAT).to.eql('/CAT');
    });

    it('accepts a string prefix', () => {
      const types = createConstants({
        separator: '/',
        prefix: 'animals'
      })('DOG', 'CAT')
      expect(types.DOG).to.eql('ANIMALS/DOG');
      expect(types.CAT).to.eql('ANIMALS/CAT');
    })

    it('accepts an array prefix', () => {
      const types = createConstants({
        separator: '/',
        prefix: ['test', 'animals']
      })('DOG', 'CAT')
      expect(Object.keys(types).length).to.equal(2);
      expect(types.DOG).to.eql('TEST/ANIMALS/DOG');
      expect(types.CAT).to.eql('TEST/ANIMALS/CAT');
    })
  })
})

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

describe('apiValues', () => {
    it('passes api values', () => {
        let vals = apiValues('BALL')
        expect(vals.BALL_LOADING).to.eql('API_BALL_LOADING')
    });
    it('passes api values with custom states', () => {
        let vals = apiValues('DOG', ['sit'])
        expect(vals.DOG_SIT).to.eql('API_DOG_SIT')
    })
})
