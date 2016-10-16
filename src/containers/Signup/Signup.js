import React, {Component, PropTypes} from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import { asyncConnect } from 'redux-async-connect';
import * as authActions from 'redux/modules/auth';
import { push, } from 'react-router-redux';
import {
    isLoaded as isAuthLoaded, load as loadAuth, signup
} from 'redux/modules/auth';

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
        error: state.auth.signupError,
    }),
    { signup, pushState: push }
)
export default class Signup extends Component {

    handleSubmit = event => {
        event.preventDefault();
        const email = this.refs.email;
        const username = this.refs.username;
        const password = this.refs.password;
        this.props.signup(
            email.value, username.value, password.value
        ).then( () => this.props.pushState( '/profile' ) );
    }

    render() {

        const { error, } = this.props;
        const styles = require( './Signup.scss' );
        const appStyles = require( '../App/App.scss' );

        return <div>

            <h1 className={ appStyles.pageTitle }>
                Sign up
            </h1>
            <form onSubmit={ this.handleSubmit }>

                { error ? <div className="alert alert-danger" role="alert" id="existsToast">
                    <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true" />
                    {' '}{ error.error }
                </div> : null }

                <label htmlFor="email">Email</label>
                <div className="form-group">
                    <input
                        autoFocus
                        id="email"
                        type="text"
                        ref="email"
                        placeholder="jane@doe.com"
                        className="form-control"
                    />
                </div>

                <label htmlFor="username">Username</label>
                <div className="form-group">
                    <input
                        autoFocus
                        id="username"
                        type="text"
                        ref="username"
                        placeholder="Username"
                        className="form-control"
                    />
                </div>

                <label htmlFor="password">Password</label>
                <div className="form-group">
                    <input
                        id="password"
                        type="password"
                        placeholder="password"
                        ref="password"
                        className="form-control"
                    />
                </div>

                <button
                    className="btn btn-success"
                    onClick={ this.handleSubmit }
                >
                    <i className="fa fa-sign-in" />{' '}Sign Up
                </button>

            </form>
        </div>;

    }
}
