import React, {Component, PropTypes as T} from 'react'
import ReactDOM, {render} from 'react-dom';

import styles from './styles.module.css';

const readme = require("../README.md")

import Inspector from 'react-inspector';
import { createConstants } from '../src/index';

const Demo = (props) => (
  <div className={styles.demo}>
    <p>{props.name || 'Demo'}</p>
    {props.children}
  </div>
)

// Examples
class CreateConstantsExample extends Component {
  render() {
    const types = createConstants('TODO')({
      'CREATE': 'unimportant',
      'FETCH_ALL': { api: true }
    });
    const str = `createConstants('TODO')({
  'CREATE': true, // value is ignored
  'FETCH_ALL': { api: true }
});  `
    return (
      <Demo name='Create constants object'>
        <pre> {str} </pre>
        <Inspector expandLevel={1} data={types} />
      </Demo>
    )
  }
}

export class Readme extends React.Component {
  componentDidMount() {
    this.props.highlight();
    this.mountExamples();
  }

  componentDidUpdate() {
    this.props.highlight();
    this.mountExamples();
  }

  mountExamples() {
    const constantExampleNode = document.querySelector('#constantExample')
    render(<CreateConstantsExample />, constantExampleNode);
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
