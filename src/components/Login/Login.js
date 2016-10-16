import React, {Component, PropTypes} from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import * as authActions from 'redux/modules/auth';

export default class Login extends Component {

    handleSubmit = (event) => {
        event.preventDefault();
        const username = this.refs.username;
        const password = this.refs.password;
        this.props.login( username.value, password.value );
    }

    render() {

        const { error, } = this.props;
        const styles = require('./Login.scss');

        return <div className={ styles.loginForm }>
            <form onSubmit={ this.handleSubmit }>
                { error ? <div className="alert alert-danger" role="alert" id="existsToast">
                    <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true" />
                    {' '}{ error.error }
                </div> : null }
                <div className="row">
                    <div className="col-md-6">
                        <label htmlFor="username">Username or email</label>
                        <div className="form-group">
                            <input
                                autoFocus
                                id="username"
                                type="text"
                                ref="username"
                                placeholder="Username or email"
                                className="form-control"
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
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
                    </div>
                </div>
                <div className={ styles.right }>
                    <button
                        className="btn btn-success"
                        onClick={ this.handleSubmit }
                    >
                        <i className="fa fa-sign-in" />{' '}Log In
                    </button>
                </div>
            </form>
        </div>;

    }
}
