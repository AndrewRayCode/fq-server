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
            CREATE TABLE IF NOT EXISTS study_tags (
                id INTEGER PRIMARY KEY,
                tag_id INTEGER REFERENCES keywords (id) ON DELETE SET NULL ON UPDATE CASCADE,
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

        // Find any existing author ids
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

            const newAuthors = authors.filter( function( name ) {
                return !( name in existingAuthors );
            });

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
            // Build the full list of all authors
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

        }).then( function( authors ) {

            console.log('authors',authors);
            return knex.insert({
                title: title,
                includesFqs: includesFqs ? 1 : 0,
                fullText: fullText,
                conclusions: conclusions
            }).into( 'studies' ).returning( 'id' );

        }).then( function() {
            res.json({ success: true });
        }).catch( function( knexError ) {
            console.error( knexError );
            res.status( 400 );
            res.json( knexError );
        });

});

app.listen( port, function () {
    console.log( 'Example app listening on port', port );
});
