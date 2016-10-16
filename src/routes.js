import React from 'react';
import { IndexRoute, Route, } from 'react-router';
import { isLoaded as isAuthLoaded, load as loadAuth } from 'redux/modules/auth';
import {
    App, Chat, Home, Widgets, Studies, About, Signup, Survey, NotFound, Profile,
} from 'containers';

export default store => {

    const requireLogin = ( nextState, replace, cb ) => {
        function checkAuth() {
            const { auth: { user }} = store.getState();
            if (!user) {
                // oops, not logged in, so can't be here!
                replace('/signup');
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
            if (user) {
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
