import React, { Component, PropTypes } from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import * as studyActions from 'redux/modules/studies';
import { isLoaded, load as loadStudies } from 'redux/modules/studies';
import { isLoaded as areKeywordsLoaded, load as loadKeywords } from 'redux/modules/studies';
import { WidgetForm } from 'components';
import { asyncConnect } from 'redux-async-connect';

@asyncConnect( [{
    //deferred: true,
    promise: ({ store: { dispatch, getState } }) => {

        if (!isLoaded(getState())) {
            return dispatch(loadStudies());
        }

    }
}] )
@connect(
    state => ({
        studies: state.studies.data,
    }),
    { ...studyActions }
)
export default class Studies extends Component {
    static propTypes = {
        studies: PropTypes.array,
        error: PropTypes.string
    };

    render() {
        const styles = require('./Studies.scss');
        const { studies } = this.props;
        return <div className={ styles.widgets + ' container' }>
            <h1>
                Studies
            </h1>
            <Helmet title="Studies"/>
            { studies.length }
        </div>;
    }
}

