import { combineReducers } from 'redux';
import multireducer from 'multireducer';
import { routerReducer } from 'react-router-redux';
import {reducer as reduxAsyncConnect} from 'redux-async-connect';

import auth from './auth';
import counter from './counter';
import {reducer as form} from 'redux-form';
import info from './info';
import widgets from './widgets';
import studies from './studies';
import keywords from './keywords';
import authors from './authors';
import site from './site';

export default combineReducers({
    routing: routerReducer,
    reduxAsyncConnect,
    auth,
    form,
    studies,
    keywords,
    authors,
    site,
});
