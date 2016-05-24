import React from 'react'
import ReactDOM from 'react-dom'
import {Router, hashHistory, Redirect, Route, IndexRoute, Link} from 'react-router'

import styles from './global.styles.css';
import Container from './Container'

const highlight = () => {
  const hljs = require('highlight.js');

  const codes = document.querySelectorAll('pre code');
  for (var i = 0; i < codes.length; i++) {
    const block = codes[i]
    hljs.highlightBlock(block);
  }
  return hljs;
}

const mountNode = document.querySelector('#root')
const main = <Container highlight={highlight} />
ReactDOM.render(main, mountNode);
