import React, { Component, PropTypes } from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { browserHistory } from 'react-router';
import queryString from 'query-string';

import { load, } from 'redux/modules/analysis';

function formatAuthor( author ) {
    return author.name;
}

@asyncConnect( [{
    promise: ( params ) => {

        const { slug, } = params.params;

        const { store, } = params;
        const { dispatch, getState } = store;
        const { analysis, } = getState();

        if( !( slug in analysis.data ) ) {
            return dispatch( load( slug ) );
        }

    }
}] )
@connect(
    ( state, ownProps ) => {

        const { slug, } = ownProps.params;
        return {
            analysis: state.analysis.data[ slug ]
        };

        //const { query, } = ownProps.location;
        //const { keywords, } = query;

        //let activeKeywords;

        //if( keywords ) {
            //activeKeywords = typeof keywords === 'string' ? [ keywords ] : keywords;
        //} else {
            //activeKeywords = [];
        //}

        //return {
            //studies: state.studies.data,
            //allKeywords: state.keywords.data,
            //inactiveKeywords: state.keywords.data.filter( kw => activeKeywords.indexOf( kw.name ) === -1 ),
            //activeKeywords,
        //};

    },
    {}
)
export default class Analysis extends Component {

    static propTypes = {
        studies: PropTypes.array,
        error: PropTypes.string
    };

    render() {

        const { analysis, } = this.props;
        const styles = require( './Analysis.scss' );
        const appStyles = require( '../App/App.scss' );

        //const { studies, inactiveKeywords, activeKeywords, } = this.props;

        return <div>

            <Helmet title="Study" />

            <h1 className={ appStyles.pageTitle }>
                { analysis.title }
            </h1>

            { analysis.body }

        </div>;

    }

}
