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

        const { logout, } = this.props;
        const styles = require('./Login.scss');

        return <div className={ styles.loginForm }>
            <form className="login-form form-inline" onSubmit={ this.handleSubmit }>
                <div className="form-group">
                    <label htmlFor="username">Username or email</label>
                    <input id="username" type="text" ref="username" placeholder="Username or email" className="form-control"/>
                </div>
                <div className="form-group">
                    <label htmlFor="password">Username or email</label>
                    <input id="password" type="password" placeholder="password" ref="password" className="form-control"/>
                </div>
                <button className="btn btn-success" onClick={this.handleSubmit}>
                    <i className="fa fa-sign-in"/>{' '}Log In
                </button>
            </form>
        </div>;

    }
}
