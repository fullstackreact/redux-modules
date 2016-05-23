import React from 'react';
import {
    expect
} from 'chai';
import sinon from 'sinon';

import core from '../'

describe('index', () => {
    it('exports a createConstants() function', () => {
        expect(core.createConstants).to.be.defined;
    })
})
