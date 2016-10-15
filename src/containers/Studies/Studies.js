import React, { Component, PropTypes } from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { browserHistory } from 'react-router';
import queryString from 'query-string';

import * as studyActions from 'redux/modules/studies';
import {
    isLoaded as areStudiesLoaded, search as searchStudies
} from 'redux/modules/studies';
import {
    isLoaded as areKeywordsLoaded, load as loadKeywords
} from 'redux/modules/keywords';
import { toQueryString, uniqueArray, } from 'utils/utils';

@asyncConnect( [{
    promise: ( params ) => {

        const { query, } = params.location;
        const keywords = query.keywords;
        let activeKeywords;

        if( keywords ) {
            activeKeywords = typeof keywords === 'string' ? [ keywords ] : keywords;
        } else {
            activeKeywords = [];
        }

        const { store, } = params;
        const { dispatch, getState } = store;
        const state = getState();

        const promises = [];

        if( keywords ) {
            promises.push( dispatch( searchStudies({ keywords: activeKeywords }) ) );
        }

        if( !areKeywordsLoaded( state ) ) {
            promises.push( dispatch( loadKeywords() ) );
        }

        return Promise.all( promises );

    }
}] )
@connect(
    ( state, ownProps ) => {

        const { query, } = ownProps.location;
        const { keywords, } = query;

        let activeKeywords;

        if( keywords ) {
            activeKeywords = typeof keywords === 'string' ? [ keywords ] : keywords;
        } else {
            activeKeywords = [];
        }

        return {
            studies: state.studies.data,
            keywords: state.keywords.data,
            activeKeywords,
        };

    },
    { ...studyActions }
)
export default class Studies extends Component {

    static propTypes = {
        studies: PropTypes.array,
        error: PropTypes.string
    };

    render() {

        const styles = require( './Studies.scss' );
        const { studies, keywords, activeKeywords, } = this.props;

        return <div className={ styles.widgets + ' container' }>
            <h1>
                Studies
            </h1>
            <Helmet title="Studies"/>
            { keywords ? keywords.map( keyword =>
                <button
                    key={ keyword.id }
                    onClick={ e => {

                        e.preventDefault();

                        browserHistory.push(
                            window.location.pathname + '?' + queryString.stringify({
                                keywords: uniqueArray([
                                    ...activeKeywords, keyword.name
                                ]).sort()
                            })
                        );

                    }}
                    className="btn btn-default"
                    type="button"
                >
                    { keyword.name } <span className="badge">{ keyword.study_count || '' }</span>
                </button>
            ) : 'No keywords found' }
        </div>;

    }

}
