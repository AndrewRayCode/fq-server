import React, { Component } from 'react';
import { Link } from 'react-router';
import config from '../../config';
import Helmet from 'react-helmet';

export default class Home extends Component {
  render() {
    const styles = require('./Home.scss');
    // require the logo image both from client and server
    const logoImage = require('./logo.png');
    return (
      <div className={styles.home}>
        <Helmet title="Home"/>
        <div className={styles.masthead}>
          <div className="container">
            <div className={styles.logo}>
              <p>
                <img src={logoImage}/>
              </p>
            </div>
            <h1>Fluroquinolone</h1>
            <h2>Hello world</h2>

            <p className={styles.humility}>
              Hello
            </p>
          </div>
        </div>

        <div className="container">
          <p>Hello world</p>
        </div>
      </div>
    );
  }
}
