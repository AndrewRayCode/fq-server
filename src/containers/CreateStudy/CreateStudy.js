import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import { asyncConnect } from 'redux-async-connect';
import * as authActions from 'redux/modules/auth';
import { push, } from 'react-router-redux';
import { AutoComplete, } from 'components';
import {
    isLoaded as isAuthLoaded, load as loadAuth, signup,
} from 'redux/modules/auth';
import { checkTitle, save, } from 'redux/modules/studies';

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
        existingStudyId: state.studies.existingStudyId,
        error: state.studies.saveError,
    }),
    { signup, checkTitle, pushState: push, save, }
)
export default class CreateStudy extends Component {

    handleSubmit = event => {
        event.preventDefault();

        const form = ReactDOM.findDOMNode( this.refs.form );
        const formData = new FormData( form );

        this.props.save( formData ).then( () => {
            form.reset();
        });
    }

    render() {

        const { error, existingStudyId, } = this.props;
        const styles = require( './CreateStudy.scss' );
        const appStyles = require( '../App/App.scss' );

        return <div>

            <Helmet title="Add Study" />

            <h1 className={ appStyles.pageTitle }>
                Add Study
            </h1>

            <form onSubmit={ this.handleSubmit } ref="form">

                <div className="form-group">
                    <label>
                        Title
                    </label>
                    <input
                        name="title"
                        type="text"
                        placeholder="Title"
                        className="form-control"
                        onBlur={ e => this.props.checkTitle( e.target.value ) }
                    />
                    { existingStudyId ? <div className="alert alert-danger" role="alert" id="existsToast">
                        <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
                        <span className="sr-only">Error: </span> This study already exists
                    </div> : null }
                </div>

                <div className="checkbox">
                    <label>
                        <input
                            value="true"
                            name="includes_fqs"
                            type="checkbox"
                            placeholder="title"
                            defaultChecked
                        />
                        Includes "fluoroquinolones?" (Not only "quinolones"?)
                    </label>
                </div>

                <div className="form-group">
                    
                    <div className="row">
                        <div className="col-xs-2">
                            <label>
                                Year
                            </label>
                            <input
                            className="form-control"
                            name="year"
                            type="number"
                            placeholder="2016"
                            />
                        </div>
                        <div className="col-xs-2">
                            <label>
                                Month
                            </label>
                            <input
                                className="form-control"
                                name="month"
                                type="number"
                                placeholder="1"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label>
                        Authors
                    </label>
                    <input
                        className="form-control"
                        name="authors"
                        type="text"
                        placeholder="Author 1, Author 2..."
                    />
                </div>

                <div className="form-group">
                    <label>
                        Keywords
                    </label>
                    <AutoComplete
                        serviceUrl="/api/studies/searchKeywords"
                        className="form-control"
                        name="keywords"
                        type="text"
                        placeholder="Keyword 1, Keyword 2..."
                    />
                </div>

                <div className="form-group">
                    <label>
                        Abstract
                    </label>
                    <textarea
                        className="form-control"
                        name="abstract"
                        placeholder="Abstract"
                    ></textarea>
                </div>

                <div className="form-group">
                    <label>
                        Conclusions
                    </label>
                    <textarea
                        className="form-control"
                        name="conclusions"
                        placeholder="Conclusions"
                    ></textarea>
                </div>

                <div className="form-group">
                    <label>
                        File?
                    </label>
                    <input
                        type="file"
                        name="file"
                    />
                </div>

                <div className="form-group">
                    <label>
                        Full Text Link?
                    </label>
                    <input
                        type="text"
                        name="fullText"
                        className="form-control"
                        placeholder="http://..."
                    />
                </div>

                { error ? <div className="alert alert-danger" role="alert" id="existsToast">
                    <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
                    <span className="sr-only">Error: </span> { error }
                </div> : null }
                <input className="btn btn-primary btn-lg" type="submit" />

            </form>

        </div>;

    }
}
