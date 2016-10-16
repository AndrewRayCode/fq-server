import passport from 'passport';
import db from '../../src/db';
import { guid, } from '../../src/utils/utils';
import bcrypt from 'bcrypt';

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
                    resolve({  user });
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

        return db( 'users' )
            .where( 'email', email )
            .then( eRows => {

                if( eRows.length !== 0 ) {
                    throw new Error( 'A user with that email address already exists.' );
                }

                return db( 'users' )
                    .where( 'username', username )
                    .then( uRows => {

                        if( uRows.length !== 0 ) {
                            throw new Error( 'A user with that username address already exists.' );
                        }

                    });

            }).then( () => {

                return hashPassword( password );

            }).then( hash => {

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
                    .then( uRows => {
                        return {
                            ...user,
                            id: uRows[ 0 ]
                        };
                    });

            }).then( user => {

                return new Promise( ( aResolve, aReject ) => {

                    req.logIn( user, loginError => {

                        if( loginError ) {
                            return aReject( loginError );
                        }

                        aResolve({
                            id: user.id
                        });

                    });

                });

            }).then( created => {

                resolve( created );

            }).catch( error => {
                console.error( 'Signup error', error );
                reject({ error: error.message });
            });

    });

}

export function load( req ) {
    const { user, } = req;

    return Promise.resolve( user ? {
        username: user.username,
        email: user.email,
        id: user.id,
    } : null );
}

export function logout( req ) {

    if( req.user ) {
        return Promise.resolve({ success: true });
    } else {
        return Promise.reject({ error: 'You are not logged in' });
    }

}
