import React from 'react';
import {
    expect
} from 'chai';
import sinon from 'sinon';

import {createConstants} from '../'

describe('index', () => {
    it('exports a createConstants() function', () => {
        expect(core.createConstants).to.be.defined;
    })
})
