import React, {PropTypes as T} from 'react'

import styles from './styles.module.css';

const readme = require("../README.md")
console.log('readme', readme);

export class Readme extends React.Component {
  componentDidMount() {
    this.props.highlight();
  }

  componentDidUpdate() {
    this.props.highlight();
  }

  render() {
    return (
      <div className={styles.container}>
        <div id="readme"
              dangerouslySetInnerHTML={{__html: readme.__content}} />
      </div>
    )
  }
}

export default Readme;
