import {
    expect
} from 'chai';
import {
    createConstants
} from '../../lib/constants';

describe('createStores', () => {
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

    })
});
