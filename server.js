var express = require( 'express' );
var path = require( 'path' );
var fs = require( 'fs' );
var bodyParser = require( 'body-parser' );
var multer  = require( 'multer' )

var file = './content/db.db';
var exists = fs.existsSync( file );

var knex = require('knex')({
    client: 'sqlite3',
    useNullAsDefault: true,
    connection: {
        filename: file
    }
});

var port = process.env.PORT;

var sqlite3 = require( 'sqlite3' ).verbose();
var db = new sqlite3.Database( file );

if( !exists ) {

    db.serialize(function() {

        // These two queries will run sequentially.
        db.run( `
            CREATE TABLE IF NOT EXISTS studies (
                id INTEGER PRIMARY KEY,
                title VARCHAR(255),
                includesFQs INTEGER,
                fullText VARCHAR(255),
                year INT,
                month INT,
                conclusions TEXT,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL
            )
        `);

        db.run( `
            CREATE TABLE IF NOT EXISTS images (
                id INTEGER PRIMARY KEY,
                name VARCHAR(255),
                title VARCHAR(255),
                link VARCHAR(255),
                study_id INTEGER REFERENCES studies (id) ON DELETE SET NULL ON UPDATE CASCADE
            )
        `);

        db.run( `
            CREATE TABLE IF NOT EXISTS authors (
                id INTEGER PRIMARY KEY,
                name VARCHAR(255)
            )
        `);

        db.run( `
            CREATE TABLE IF NOT EXISTS study_authors (
                id INTEGER PRIMARY KEY,
                study_id INTEGER REFERENCES studies (id) ON DELETE SET NULL ON UPDATE CASCADE,
                author_id INTEGER REFERENCES studies (id) ON DELETE SET NULL ON UPDATE CASCADE
            )
        `);

        db.run( `
            CREATE TABLE IF NOT EXISTS keywords (
                id INTEGER PRIMARY KEY,
                name VARCHAR( 255 ),
                description TEXT
            )
        `);

        db.run( `
            CREATE TABLE IF NOT EXISTS study_keywords (
                id INTEGER PRIMARY KEY,
                keyword_id INTEGER REFERENCES keywords (id) ON DELETE SET NULL ON UPDATE CASCADE,
                study_id INTEGER REFERENCES studies (id) ON DELETE SET NULL ON UPDATE CASCADE
            )
        `);


    });

}

if( !port ) {
    throw new Error( 'Please run script with a port' );
}

var app = express();

// to support JSON-encoded bodies
app.use( bodyParser.json() );
// to support URL-encoded bodies
app.use( bodyParser.urlencoded({
    extended: true
}) );

app.use( '/', express.static( path.join( __dirname, 'static' ) ) );
app.use( '/files', express.static( path.join( __dirname, 'uploads' ) ) );

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb( null, path.join( __dirname, 'uploads' ) )
    },
    filename: function (req, file, cb) {
        cb( null, file.originalname );
    }
});

var upload = multer({ storage: storage });

var addUploads = upload.fields( [{
    name: 'file', maxCount: 1
}] );

app.post( '/add', addUploads, function( req, res ) {

    console.log( req.body, req.files );

    const title = req.body.title;
    const month = req.body.month;
    const year = req.body.year;
    const includesFqs = req.body.includesFqs;
    const conclusions = req.body.conclusions;
    const fullText = ( req.files && req.files[ 0 ] ) || req.body.fullText;

    const authors = req.body.authors.split(',').map( function( author ) {
        return author.trim();
    });
    const keywords = req.body.keywords.split(',').map( function( keyword ) {
        return keyword.trim();
    });

    // Check for existing study
    knex.select( 'id' )
        .from( 'studies' )
        .where( 'title', title )
        .then( function( result ) {

            if( result.length > 0 ) {
                throw new Error( 'A study with this title has already been indexed' );
            }

        // Find any existing author ids, building { name: id } object
        }).then( function() {

            return knex.select( 'name', 'id' )
                .from( 'authors' )
                .whereIn( 'name', authors )
                .then( function( rows ) {
                    return rows.reduce( function( memo, row ) {
                        var newRow = {};
                        newRow[ row.name ] = row.id;
                        return Object.assign( {}, memo, newRow );
                    }, {} )
                })

        // Create any new authors
        }).then( function( existingAuthors ) {

            // Find author names that aren't in the db already
            const newAuthors = authors.filter( function( name ) {
                return !( name in existingAuthors );
            });

            // Create them all
            return Promise.all( newAuthors.map( function( name ) {
                return knex.insert({ name: name })
                    .returning([ 'name', 'id' ])
                    .into( 'authors' )
                    .then( function( row ) {
                        return {
                            name: name,
                            id: row[ 0 ],
                        };
                    });
            // Build the full list of all authors, merging the newly inserted
            // ones with the existing list
            }) ).then( function( insertedAuthors ) {
                return Object.assign(
                    {},
                    insertedAuthors.reduce( function( memo, author ) {
                        memo[ author.name ] = author.id;
                        return memo;
                    }, {} ),
                    existingAuthors
                );
            });

        // Find any existing keyword ids, building { name: id } object
        }).then( function( authors ) {

            return knex.select( 'name', 'id' )
                .from( 'keywords' )
                .whereIn( 'name', keywords )
                .then( function( rows ) {
                    return rows.reduce( function( memo, row ) {
                        var newRow = {};
                        newRow[ row.name ] = row.id;
                        return Object.assign( {}, memo, newRow );
                    }, {} )
                }).then( function( existingKeywords ) {
                    return {
                        existingKeywords: existingKeywords,
                        authors: authors,
                    };
                });

        // Create any new keywords
        }).then( function( continuation ) {

            const existingKeywords = continuation.existingKeywords;

            // Find author names that aren't in the db already
            const newKeywords = keywords.filter( function( name ) {
                return !( name in existingKeywords );
            });

            // Create them all
            return Promise.all( newKeywords.map( function( name ) {
                return knex.insert({ name: name })
                    .returning([ 'name', 'id' ])
                    .into( 'keywords' )
                    .then( function( row ) {
                        return {
                            name: name,
                            id: row[ 0 ],
                        };
                    });
            // Build the full list of all authors, merging the newly inserted
            // ones with the existing list
            }) ).then( function( insertedKeywords ) {
                return Object.assign(
                    {},
                    insertedKeywords.reduce( function( memo, author ) {
                        memo[ author.name ] = author.id;
                        return memo;
                    }, {} ),
                    existingKeywords
                );
            }).then( function( keywords ) {
                return Object.assign( {}, continuation, {
                    keywords: keywords,
                });
            });

        // Create the actual study, get the id and pass authors
        }).then( function( continuation ) {

            return knex.insert({
                title: title,
                includesFqs: includesFqs ? 1 : 0,
                fullText: fullText,
                month: month,
                year: year,
                conclusions: conclusions
            }).into( 'studies' )
                .returning( 'id' )
                .then(function( studyRow ) {

                    return Object.assign( {}, continuation, {
                        studyId: studyRow[ 0 ],
                    });

                });

        // Populate the keyword-study join table
        }).then( function( continuation ) {

            const keywords = continuation.keywords;
            const studyId = continuation.studyId;

            return Promise.all( Object.keys( keywords ).map( function( name ) {
                return knex.insert({
                    study_id: studyId,
                    keyword_id: keywords[ name ],
                }).into( 'study_keywords' );
            }) ).then( function() {
                return continuation;
            });

        // Populate the author-study join table
        }).then( function( continuation ) {

            const authors = continuation.authors;
            const studyId = continuation.studyId;

            return Promise.all( Object.keys( authors ).map( function( name ) {
                return knex.insert({
                    study_id: studyId,
                    author_id: authors[ name ],
                }).into( 'study_authors' );
            }) ).then( function() {
                return continuation;
            });

        }).then( function( continuation ) {

            res.json({ success: true });

        }).catch( function( knexError ) {
            console.error( knexError );
            res.status( 400 );
            res.json( knexError );
        });

});

function getAllKeywords() {
    return knex.select( 'keywords.*' )
        .select( knex.raw( 'COUNT( keywords.id ) as study_count' ) )
        .from( 'keywords' )
        .leftJoin( 'study_keywords', 'study_keywords.keyword_id', 'keywords.id' )
        .groupBy( 'keywords.id' );
}

function getAllAuthors() {
    return knex.select( 'authors.*' )
        .select( knex.raw( 'COUNT( authors.id ) as study_count' ) )
        .from( 'authors' )
        .leftJoin( 'study_keywords', 'study_keywords.keyword_id', 'authors.id' )
        .groupBy( 'authors.id' );
}

app.get( '/keywords', function( req, res ) {

    return getAllKeywords().then( function( keywords ) {
        res.json( keywords );
    }).catch( function( error ) {
        console.error( error );
        res.status( 500 );
        res.json( error );
    });

});

app.get( '/authors', function( req, res ) {

    return getAllAuthors().then( function( authors ) {
        res.json( authors );
    }).catch( function( error ) {
        console.error( error );
        res.status( 500 );
        res.json( error );
    });

});

app.listen( port, function () {
    console.log( 'Example app listening on port', port );
});
