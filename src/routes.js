import React from 'react';
import { IndexRoute, Route, } from 'react-router';
import {
    isLoaded as isAuthLoaded, load as loadAuth,
} from 'redux/modules/auth';
import {
    isLoaded as isSiteLoaded, load as loadSiteData,
} from 'redux/modules/site';
import {
    App, Home, Studies, About, Signup, NotFound, Profile, CreateStudy,
    Analysis,
} from 'containers';

export default store => {

    const requireAdmin = ( nextState, replace, cb ) => {

        function checkAuth() {
            const {
                auth: { user },
                site: { data },
            } = store.getState();

            if(
                !user ||
                !user.role_ids.some( role => data.roles[ role ] === 'Admin' )
            ) {
                replace( '/' );
            }
            cb();
        }

        const promises = [];
        if( !isAuthLoaded( store.getState() ) ) {
            promises.push( store.dispatch( loadAuth() ) );
        }
        if( !isSiteLoaded( store.getState() ) ) {
            promises.push( store.dispatch( loadSiteData() ) );
        }

        if( promises.length ) {
            Promise.all( promises )
                .then( checkAuth )
                .catch( e => console.error(e) );
        } else {
            checkAuth();
        }

    };

    const requireLogin = ( nextState, replace, cb ) => {
        function checkAuth() {
            const { auth: { user }} = store.getState();
            if( !user) {
                replace( '/signup' );
            }
            cb();
        }

        if( !isAuthLoaded( store.getState() ) ) {
            store.dispatch( loadAuth() ).then( checkAuth );
        } else {
            checkAuth();
        }
    };

    const requireLogout = ( nextState, replace, cb ) => {
        function checkNoAuth() {
            const { auth: { user }} = store.getState();
            if( user) {
                replace( '/profile' );
            }
            cb();
        }

        if( !isAuthLoaded( store.getState() ) ) {
            store.dispatch( loadAuth() ).then( checkNoAuth );
        } else {
            checkNoAuth();
        }
    };

    /**
     * Please keep routes in alphabetical order
     */
    return <Route path="/" component={ App } >
        { /* Home (main) route */ }
        <IndexRoute component={ Home } />

        { /* Routes */ }
        <Route path="about" component={ About } />
        <Route path="studies" component={ Studies } />
        <Route path="studies/:slug" component={ Analysis } />

        <Route onEnter={ requireAdmin }>
            <Route path="/addStudy" component={ CreateStudy } />
        </Route>

        <Route onEnter={ requireLogout }>
            <Route path="signup" component={ Signup } />
        </Route>
        
        <Route onEnter={ requireLogin }>
            <Route path="profile" component={ Profile } />
        </Route>

        { /* Catch all route */ }
        <Route path="*" component={ NotFound } status={ 404 } />
    </Route>;

};
