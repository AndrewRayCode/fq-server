import React, { Component } from 'react';
import Helmet from 'react-helmet';

export default class Profile extends Component {

    render() {

        const styles = require( './Profile.scss' );
        return <div className={ styles.home }>
            <Helmet title="Profile" />
            <div className="container">
                <p>Hello world</p>
            </div>
        </div>;

    }

}
