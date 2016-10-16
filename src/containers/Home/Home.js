import React, { Component } from 'react';
import Helmet from 'react-helmet';

export default class Home extends Component {

    render() {

        const styles = require( './Home.scss' );
        const appStyles = require( '../App/App.scss' );

        return <div className={ styles.home }>
            
            <Helmet />

            <h1 className={ appStyles.pageTitle }>
                Welcome to Fluorquinolone Research!
            </h1>

            <p>Hello world</p>
        </div>;

    }

}
