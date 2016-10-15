import React, { Component, PropTypes } from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-async-connect';
import { browserHistory } from 'react-router';
import queryString from 'query-string';

import { ShowMore, } from 'components';
import * as studyActions from 'redux/modules/studies';
import {
    isLoaded as areStudiesLoaded, search as searchStudies
} from 'redux/modules/studies';
import {
    isLoaded as areKeywordsLoaded, load as loadKeywords
} from 'redux/modules/keywords';
import { toQueryString, uniqueArray, } from 'utils/utils';

function formatAuthor( author ) {
    return author.name;
}

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
            allKeywords: state.keywords.data,
            inactiveKeywords: state.keywords.data.filter( kw => activeKeywords.indexOf( kw.name ) === -1 ),
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

        const { studies, inactiveKeywords, activeKeywords, } = this.props;

        return <div>
            <h1>
                Studies
            </h1>

            <Helmet title="Studies" />

            { inactiveKeywords ? inactiveKeywords.map( keyword =>
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

            { activeKeywords ? <div>

                <label>Active Keywords</label>
                <br />

                { activeKeywords.map( keyword =>
                    <button
                        key={ keyword }
                        className="btn btn-primary"
                        type="button"
                        title="Remove this keyword search"
                        onClick={ e => {

                            e.preventDefault();

                            browserHistory.push(
                                window.location.pathname + '?' + queryString.stringify({
                                    keywords: activeKeywords.filter( kw => kw !== keyword )
                                })
                            );

                        }}
                    >
                        { keyword }
                        <span className="glyphicon glyphicon-remove" aria-hidden="true"></span>
                    </button>
                )}

            </div> : null }

            { studies ? <div>
                <ul className={ styles.studies }>
                    { studies.map( study => <li
                        key={ study.id }
                        className={ styles.study }
                    >
                        <div className="panel panel-default">
                            <div className="panel-body">
                                <div className={ styles.title }>{ study.title }</div>
                                <ul className={ styles.subTitle }>
                                    <li>
                                        <a href={ study.fulltext } target="_blank">Full Text</a>
                                    </li>
                                    <li>
                                        <b>Authors:</b> { study.authors.map( a => formatAuthor( a ) ).join(', ') }
                                    </li>
                                </ul>
                                <p>
                                    <b>Abstract:</b> <ShowMore text={ study.abstract } />
                                </p>
                                <p>
                                    <b>Sample of Conclusions:</b> { study.conclusions.replace( /\n/g, '<br />' ) }
                                </p>
                                <p>
                                    <b>Keywords:</b> { study.keywords.map( kw => kw.name ).join(', ') }
                                </p>
                            </div>
                        </div>
                    </li>) }
                </ul>
            </div> : null }

        </div>;

    }

}
