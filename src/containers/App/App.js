import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { IndexLink } from 'react-router';
import Helmet from 'react-helmet';
import { Dropdown, Expander, Login, } from 'components';
import {
    isLoaded as isAuthLoaded, load as loadAuth, logout, login
} from 'redux/modules/auth';
import { push } from 'react-router-redux';
import config from '../../config';
import { asyncConnect, } from 'redux-async-connect';
import * as authActions from 'redux/modules/auth';
import { ellipsify, } from 'utils/utils';

@asyncConnect( [{
    promise: ( { store: { dispatch, getState } } ) => {
        const promises = [];

        if( !isAuthLoaded( getState() ) ) {
            promises.push( dispatch( loadAuth() ) );
        }

        return Promise.all( promises );
    }
}] )
@connect(
    state => ({
        user: state.auth.user,
        loginError: state.auth.loginError,
    }),
    { loginAction: login, logout, pushState: push }
)
export default class App extends Component {

    static contextTypes = {
        store: PropTypes.object.isRequired
    };

    handleLogout = event => {
        event.preventDefault();
        this.props.logout().then( () => this.props.pushState( '/' ) );
    };

    render() {

        const { user, loginAction, loginError } = this.props;
        const styles = require( './App.scss' );
        require( './global.scss' );

        return <div className={ styles.app }>
            <Helmet { ...config.app.head } />

            <div className={ styles.header }>

                <div className={ styles.content }>

                    <a href="/" className={ styles.logo }>FQ Research</a>

                    <div className={ styles.nav }>
                        <a href="/studies">Studies</a>
                    </div>

                    <ul className={ styles.auth }>

                        { user ? <li>
                            Hello, <Dropdown
                                items={[
                                    <a href="/profile" key={ 0 }>Profile</a>,
                                    <a href="#" onClick={ this.handleLogout } key={ 1 }>Log out</a>
                                ]}
                            >
                                { ellipsify( user.username, 15 ) }{' '}
                                <span
                                    className={ 'glyphicon glyphicon-cog ' + styles.gear }
                                    aria-hidden="true"
                                />
                            </Dropdown>
                        </li> : [
                            <li key={ 0 }>
                                <Expander
                                    expanded={ <Login
                                        login={ loginAction }
                                        error={ loginError }
                                    /> }
                                >
                                    Log in
                                </Expander>
                            </li>,
                            <li key={ 1 }>
                                <a href="/signup">
                                    Join Us!
                                </a>
                            </li>,
                        ] }

                    </ul>

                </div>

            </div>

            <div className={ styles.appContent + ' clearfix' }>
                { this.props.children }
            </div>

            <div className={ styles.footer }>
                <div className={ styles.content }>
                    Website by <a href="https://twitter.com/andrewray" target="_blank">@andrewray</a>
                </div>
            </div>
        </div>;

    }

}
