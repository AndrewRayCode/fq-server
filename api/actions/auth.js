import passport from 'passport';
import db from '../../src/db';
import { guid, } from '../../src/utils/utils';
import bcrypt from 'bcrypt';

export function login( req ) {

    return new Promise( ( resolve, reject ) => {

        passport.authenticate( 'local', function authenticate( err, user, info ) {

            if( err ) {
                return reject( err );
            }
            if( !user ) {
                return reject( info );
            }

            req.logIn( user, loginError => {
                if( loginError ) {
                    reject( loginError );
                } else {
                    resolve( user );
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

    const { username, email, password, } = req.query;

    return new Promise( ( resolve, reject ) => {

        if( req.user ) {
            return reject({ error: 'You are already logged in' });
        }

        if( !password || !username || !email ) {
            return reject({ error: 'Missing credentials' });
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

                req.logIn( user, loginError => {
                    if( loginError ) {
                        throw ( loginError );
                    } else {
                        resolve({
                            id: user.id
                        });
                    }
                });

            }).catch( error => {
                console.error( 'Signup error', error );
                reject({ error: error.message });
            });

    });

}
