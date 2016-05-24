import React, {PropTypes as T} from 'react'
import ReactDOM from 'react-dom'
import {Link} from 'react-router'
import GitHubForkRibbon from 'react-github-fork-ribbon'

import styles from './styles.module.css'
import Readme from './readme';

export const Container = React.createClass({

  propTypes: {
    children: T.element,
    readme: T.object,
    highlight: T.func
  },

  contextTypes: {
    router: T.object
  },

  componentDidMount: function() {
    this.props.highlight();
  },

  render: function() {
    const {routeMap, routeDef} = this.props;
    const {router} = this.context;

    return (
      <div className={styles.container}>
        <GitHubForkRibbon href="//github.com/fullstackreact/google-maps-react"
                  target="_blank"
                  position="right">
          Fork me on GitHub
        </GitHubForkRibbon>
        <div className={styles.wrapper}>
          <div className={styles.content}>
            <div className={styles.header}>
              <h1>Redux modules</h1>
              <h2><a href="https://github.com/fullstackreact/google-maps-react/blob/master/README.md">Readme</a></h2>
            </div>
            <Readme {...this.props} />
          </div>
        </div>
      </div>
    )
  }
})

export default Container;
