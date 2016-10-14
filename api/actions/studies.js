import db from '../../src/db';

function objectValues( obj ) {
    return Object.keys( obj ).map( function( key ) { return obj[ key  ]; });
}

function searchStudies( search ) {

    var query = db( 'studies' )
        .select( 'studies.*' )

        .select( db.raw( 'ARRAY_AGG( DISTINCT keywords.id ) as keyword_ids' ) )
        .select( db.raw( 'ARRAY_AGG( DISTINCT keywords.name ) as keyword_names' ) )
        .leftJoin( 'study_keywords', 'study_keywords.study_id', 'studies.id' )
        .leftJoin( 'keywords', 'study_keywords.keyword_id', 'keywords.id'  )

        .select( db.raw( 'ARRAY_AGG( DISTINCT authors.id ) as author_ids' ) )
        .select( db.raw( 'ARRAY_AGG( DISTINCT authors.name ) as author_names' ) )
        .leftJoin( 'study_authors', 'study_authors.study_id', 'studies.id' )
        .leftJoin( 'authors', 'study_authors.author_id', 'authors.id'  )

        .groupBy( 'studies.id' )

    if( 'keywords' in search ) {
        query = query.whereIn( 'keywords.id', search.keywords );
    }

    return query.then( function( rows ) {
        return rows.map( function( row ) {

            console.log('got',row);
            var keyword_ids = row.keyword_ids;
            var keyword_names = row.keyword_names;
            var author_ids = row.author_ids;
            var author_names = row.author_names;

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
                // authors, etc. tried adding DISTINCT to the ARRAY_AGG
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

function getKeywords( query ) {
    const normalizedQuery = query || '';
    return db.select( 'keywords.*' )
        .select( db.raw( 'COUNT( keywords.id ) as study_count' ) )
        .from( 'keywords' )
        .leftJoin( 'study_keywords', 'study_keywords.keyword_id', 'keywords.id' )
        .groupBy( 'keywords.id' )
        .where( 'name', 'like', `%${ query }%` )
        .orWhere( 'name', 'ilike', `%${ normalizedQuery }%` );
}

function getAuthors( query ) {
    const normalizedQuery = query || '';
    return db.select( 'authors.*' )
        .select( db.raw( 'COUNT( authors.id ) as study_count' ) )
        .from( 'authors' )
        .leftJoin( 'study_keywords', 'study_keywords.keyword_id', 'authors.id' )
        .groupBy( 'authors.id' )
        .where( 'name', 'like', `%${ query }%` )
        .orWhere( 'name', 'ilike', `%${ normalizedQuery }%` );
}

function doesStudyExistWithTitle( title ) {
    return db.select( 'id' )
        .from( 'studies' )
        .where( 'title', 'ilike', `${ title }%` )
        .then( function( row ) {
            return row.length ? row[ 0 ].id : null;
        });
}

export function add( req ) {

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
    db.select( 'id' )
        .from( 'studies' )
        .where( 'title', title )
        .then( function( result ) {

            if( result.length > 0 ) {
                throw new Error( 'A study with this title has already been indexed' );
            }

        // Find any existing author ids, building { name: id } object
        }).then( function() {

            return db.select( 'name', 'id' )
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
                return db.insert({ name: name })
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

            return db.select( 'name', 'id' )
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
                return db.insert({ name: name })
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

            return db.insert({
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
                return db.insert({
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
                return db.insert({
                    study_id: studyId,
                    author_id: authors[ name ],
                }).into( 'study_authors' );
            }) ).then( function() {
                return continuation;
            });

        }).then( function( continuation ) {

            return { success: true };

        });

}

export function keywords( req ) {

    const query = ( req.query && req.query.query ) || '';

    return getKeywords( query ).then( function( keywords ) {
        return {
            query: query,
            suggestions: keywords
        };
    });

}

export function authors( req ) {

    const query = ( req.query && req.query.query ) || '';

    return getAuthors( query ).then( function( authors ) {
        return {
            query: query,
            suggestions: authors
        }
    });

}

export function checkTitle( req ) {

    const title = req.query && req.query.title;

    return doesStudyExistWithTitle( title ).then( function( exists ) {

        return { existingId: exists };

    });

}

export function getSiteData() {

    return getKeywords().then( function( keywords ) {
        return { keywords: keywords };
    }).then( function( continuation ) {

        return getAuthors().then( function( authors ) {

            return Object.assign( {}, continuation, {
                authors: authors,
            })

        });

    }).then( function( continuation ) {

        return db( 'studies' ).count( '* as count' ).then( function( row ) {

            return Object.assign( {}, continuation, {
                totalStudies: row[ 0 ].count,
            })

        })

    });

}

export function studies( req ) {

    return searchStudies( req.query );

}
