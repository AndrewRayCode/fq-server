import passport from 'passport';
import db from '../../src/db';
import { guid, } from '../../src/utils/utils';
import bcrypt from 'bcrypt';

function sanitizeUser( user ) {
    return {
        username: user.username,
        email: user.email,
        role_ids: user.role_ids,
        id: user.id,
    };
}

export function login( req ) {

    const { usernameOrEmail, password, } = req.body;

    return new Promise( ( resolve, reject ) => {

        if( !usernameOrEmail || !password ) {
            return reject({ error: 'Please enter your username or email, and your password.' });
        }

        passport.authenticate( 'local', ( err, user, info ) => {

            if( err ) {
                return reject({ error: err.message });
            }
            if( !user ) {
                return reject({ error: info });
            }

            req.logIn( user, loginError => {
                if( loginError ) {
                    reject({ error: loginError.message });
                } else {
                    resolve( sanitizeUser( user ) );
                }
            });

        })( req );

    });

}

function hashPassword( password ) {

    return new Promise( ( resolve, reject ) => {
        bcrypt.hash( password, 10, ( err, res ) => {
            if( err ) {
                console.error( 'Hashing signup error: ', err, err.message );
                reject( new Error( 'Unknown error' ) );
            }
            resolve( res );
        });
    });

}

export function signup( req ) {

    const { username, email, password, } = req.body;

    return new Promise( ( resolve, reject ) => {

        if( req.user ) {
            return reject({
                error: "You are already logged in and can't create a new account.",
                alreadyLoggedIn: true
            });
        }

        if( !password || !username || !email ) {
            return reject({ error: 'Please enter an email address, username and password and try again.' });
        }

        return db( 'site_data' )
            .select( 'default_user_role_id' )
            .then( rows => {

                return {
                    role_id: rows[ 0 ].default_user_role_id,
                };

            }).then( continuation => {

                return db( 'users' )
                    .where( 'email', email )
                    .then( rows => {

                        if( rows.length !== 0 ) {
                            throw new Error( 'A user with that email address already exists.' );
                        }

                        return continuation;

                    });

            }).then( continuation => {

                return db( 'users' )
                    .where( 'username', username )
                    .then( rows => {

                        if( rows.length !== 0 ) {
                            throw new Error( 'A user with that username address already exists.' );
                        }

                        return continuation;

                    });

            }).then( continuation => {

                return hashPassword( password ).then( hash => {
                    return {
                        ...continuation,
                        hash,
                    };
                });

            }).then( continuation => {

                const { hash, role_id, } = continuation;

                const user = {
                    username,
                    email,
                    encrypted_password: hash,
                    unique_hash: guid(),
                    current_sign_in_ip: req.headers[ 'x-forwarded-for' ] || req.connection.remoteAddress,
                    last_sign_in_at: new Date(),
                    created_at: new Date(),
                    updated_at: new Date()
                };

                return db.insert( user )
                    .into( 'users' )
                    .returning( 'id' )
                    .then( rows => {
                        return {
                            ...continuation,
                            user: {
                                ...user,
                                role_ids: [ role_id ],
                                id: rows[ 0 ]
                            }
                        };
                    });

            }).then( continuation => {

                return db.insert({
                        user_id: continuation.user.id,
                        role_id: continuation.role_id,
                    })
                    .into( 'user_roles' )
                    .then( () => {
                        return continuation;
                    });

            }).then( continuation => {

                const { user, } = continuation;

                return new Promise( ( aResolve, aReject ) => {

                    req.logIn( user, loginError => {

                        if( loginError ) {
                            return aReject( loginError );
                        }

                        aResolve( continuation );

                    });

                });

            }).then( continuation => {

                resolve( sanitizeUser( continuation.user ) );

            }).catch( error => {
                console.error( 'Signup error', error );
                reject({ error: error.message });
            });

    });

}

export function load( req ) {

    const { user, } = req;

    return Promise.resolve( user ? sanitizeUser( user ) : null );

}

export function logout( req ) {

    const { user, } = req;

    if( user ) {

        req.logout();
        return Promise.resolve({ success: true });

    } else {

        return Promise.reject({ error: 'You are not logged in' });

    }

}
