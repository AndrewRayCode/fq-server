import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import config from '../src/config';
import multer from 'multer';
import * as actions from './actions/index';
import {mapUrl} from 'utils/url.js';
import PrettyError from 'pretty-error';
import http from 'http';
import db from '../src/db';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';

const pretty = new PrettyError();
const app = express();

const server = new http.Server(app);
const fileUploadSizeLimit = '10mb';

app.use(session({
    secret: 'react and redux rule!!!!',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 }
}));

app.use( bodyParser.json({ limit: fileUploadSizeLimit }) );
app.use( bodyParser.urlencoded({
    extended: true,
    limit: fileUploadSizeLimit
}) );

app.use( passport.initialize() );
app.use( passport.session() );

passport.use( new LocalStrategy(
    { usernameField: 'email' },
    ( username, password, done ) => {

        db( 'users' )
            .where( 'email', email )
            .then( rows => {

                if( rows.length !== 1 ) {
                    done( new Error( 'No user found with that email.' ) );
                }

                const existingUser = rows[ 0 ];
                const { encrypted_password, } = existingUser;

                bcrypt.compare( password, encrypted_password, ( err, res ) => {

                    if( err ) {
                        console.error( 'Password error: ', err, err.message );
                        done( new Error( 'Unknown error' ) );
                    }

                    if( !res ) {
                        done( new Error( 'Incorrect password' ) );
                    }

                    done( null, existingUser );

                });

            }).catch( done );

    }
));

passport.serializeUser( ( user, cb ) => {
    cb( null, user );
});

passport.deserializeUser( ( obj, cb ) => {
    cb( null, obj );
});


const storage = multer.diskStorage({
    destination: ( req, file, cb ) => {
        cb( null, path.join( __dirname, 'uploads' ) );
    },
    filename: ( req, file, cb ) => {
        cb( null, file.originalname );
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10000000
    }
});

const addUploads = upload.fields( [{
    name: 'file', maxCount: 1
}] );

app.use( addUploads, ( req, res ) => {
    const splittedUrlPath = req.url.split('?')[0].split('/').slice(1);

    const {action, params} = mapUrl(actions, splittedUrlPath);

    if (action) {
        action(req, params)
        .then((result) => {
            if (result instanceof Function) {
                result(res);
            } else {
                res.json(result);
            }
        }, (reason) => {
            if (reason && reason.redirect) {
                res.redirect(reason.redirect);
            } else {
                console.error('API ERROR:', pretty.render(reason));
                res.status(reason.status || 500).json(reason);
            }
        });
    } else {
        res.status(404).end('NOT FOUND');
    }
});

if (config.apiPort) {
    const runnable = app.listen(config.apiPort, (err) => {
        if (err) {
            console.error(err);
        }
        console.info('----\n==> 🌎  API is running on port %s', config.apiPort);
        console.info('==> 💻  Send requests to http://%s:%s', config.apiHost, config.apiPort);
    });

} else {
    console.error('==>     ERROR: No PORT environment variable has been specified');
}
