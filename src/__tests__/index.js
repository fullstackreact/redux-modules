import React from 'react';
import {
    expect
} from 'chai';
import sinon from 'sinon';

import core from '../'

describe('exports', () => {
    it('exports an createConstants()', () => {
        expect(core.createConstants).to.be.defined;
    })
})
