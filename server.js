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
                abstract TEXT,
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
    destination: function( req, file, cb ) {
      cb( null, path.join( __dirname, 'uploads' ) )
    },
    filename: function( req, file, cb ) {
        cb( null, file.originalname );
    }
});

var upload = multer({ storage: storage });

var addUploads = upload.fields( [{
    name: 'file', maxCount: 1
}] );

app.post( '/add', addUploads, function( req, res ) {

    const fileName = req.files && req.files.file && req.files.file[ 0 ] && req.files.file[ 0 ].originalname;

    const title = req.body.title;
    const month = req.body.month;
    const year = req.body.year;
    const includesFqs = req.body.includesFqs;
    const conclusions = req.body.conclusions;
    const abstract = req.body.abstract;
    const fullText = fileName ? '/uploads/' + fileName : req.body.fullText;

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
                conclusions: conclusions,
                abstract: abstract
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

function getKeywords( query ) {
    const normalizedQuery = query || '';
    return knex.select( 'keywords.*' )
        .select( knex.raw( 'COUNT( keywords.id ) as study_count' ) )
        .from( 'keywords' )
        .leftJoin( 'study_keywords', 'study_keywords.keyword_id', 'keywords.id' )
        .groupBy( 'keywords.id' )
        .where( 'name', 'like', `%${ query }%` )
        .orWhere( 'UPPER( name )', 'like', `%${ normalizedQuery.toUpperCase() }%` );
}

function getAuthors( query ) {
    const normalizedQuery = query || '';
    return knex.select( 'authors.*' )
        .select( knex.raw( 'COUNT( authors.id ) as study_count' ) )
        .from( 'authors' )
        .leftJoin( 'study_keywords', 'study_keywords.keyword_id', 'authors.id' )
        .groupBy( 'authors.id' )
        .where( 'name', 'like', `%${ query }%` )
        .orWhere( 'UPPER( name )', 'like', `%${ normalizedQuery.toUpperCase() }%` );
}

function doesStudyExistWithTitle( title ) {
    return knex.select( 'id' )
        .from( 'studies' )
        .where( 'title', title )
        .then( function( row ) {
            return row.length ? row[ 0 ].id : null;
        });
}

app.get( '/keywords', function( req, res ) {

    const query = ( req.query && req.query.query ) || '';

    return getKeywords( query ).then( function( keywords ) {
        res.json({
            query: query,
            suggestions: keywords
        });
    }).catch( function( error ) {
        console.error( error );
        res.status( 500 );
        res.json( error );
    });

});

app.get( '/authors', function( req, res ) {

    const query = ( req.query && req.query.query ) || '';

    return getAuthors( query ).then( function( authors ) {
        res.json({
            query: query,
            suggestions: authors
        });
    }).catch( function( error ) {
        console.error( error );
        res.status( 500 );
        res.json( error );
    });

});

app.get( '/checkTitle', function( req, res ) {

    const title = req.query && req.query.title;

    return doesStudyExistWithTitle( title ).then( function( exists ) {

        res.json({ existingId: exists });

    }).catch( function( error ) {
        console.error( error );
        res.status( 500 );
        res.json({ error: error });
    });

});

function getSiteData() {
    return getKeywords().then( function( keywords ) {
        return { keywords: keywords };
    }).then( function( continuation ) {

        return getAuthors().then( function( authors ) {

            return Object.assign( {}, continuation, {
                authors: authors,
            })

        });

    }).then( function( continuation ) {

        return knex( 'studies' ).count( '* as count' ).then( function( row ) {

            return Object.assign( {}, continuation, {
                totalStudies: row[ 0 ].count,
            })

        })

    });
}

app.get( '/siteData', function( req, res ) {

    return getSiteData().then( function( data ) {

        res.json( data );

    }).catch( function( error ) {
        console.error( error );
        res.status( 500 );
        res.json({ error: error });
    });

});

function objectValues( obj ) {
    return Object.keys( obj ).map( function( key ) { return obj[ key  ]; });
}

function searchStudies( search ) {

    var query = knex( 'studies' )
        .select( 'studies.*' )

        .select( knex.raw( 'group_concat( DISTINCT keywords.id ) as keyword_ids' ) )
        .select( knex.raw( 'group_concat( DISTINCT keywords.name ) as keyword_names' ) )
        .leftJoin( 'study_keywords', 'study_keywords.study_id', 'studies.id' )
        .leftJoin( 'keywords', 'study_keywords.keyword_id', 'keywords.id'  )

        .select( knex.raw( 'group_concat( DISTINCT authors.id ) as author_ids' ) )
        .select( knex.raw( 'group_concat( DISTINCT authors.name ) as author_names' ) )
        .leftJoin( 'study_authors', 'study_authors.study_id', 'studies.id' )
        .leftJoin( 'authors', 'study_authors.author_id', 'authors.id'  )

        .groupBy( 'studies.id' )

    if( 'keywords' in search ) {
        query = query.whereIn( 'keywords.id', search.keywords );
    }

    return query.then( function( rows ) {
        return rows.map( function( row ) {

            var keyword_ids = row.keyword_ids.split( ',' );
            var keyword_names = row.keyword_names.split( ',' );
            var author_ids = row.author_ids.split( ',' );
            var author_names = row.author_names.split( ',' );

            return {
                id: row.id,
                title: row.title,
                includesFQs: !!row.includesFQs,
                fullText: row.fullText,
                year: row.year,
                month: row.month,
                conclusions: row.conclusions,
                abstract: row.abstract,

                // I don't know why the above query returns dupe keywords,
                // authors, etc. tried adding DISTINCT to the group_concat
                // functions but it just errors. De-dupe and deserialize
                keywords: objectValues( keyword_ids.reduce( function( memo, id, index ) {
                    memo[ id ] = {
                        id: id,
                        name: keyword_names[ index ],
                    };
                    return memo;
                }, {} ) ),
                authors: objectValues( author_ids.reduce( function( memo, id, index ) {
                    memo[ id ] = {
                        id: id,
                        name: author_names[ index ],
                    };
                    return memo;
                }, {} ) ),
            };
        });
    });

}

app.get( '/studies', function( req, res ) {

    return searchStudies( req.query ).then( function( studies ) {

        res.json( studies );

    }).catch( function( error ) {
        console.error( error );
        res.status( 500 );
        res.json({ error: error });
    });

});

app.listen( port, function () {
    console.log( 'Example app listening on port', port );
});
