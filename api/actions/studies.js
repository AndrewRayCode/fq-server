import db from '../../src/db';

function objectValues( obj ) {
    return Object.keys( obj ).map( key => obj[ key ] );
}

function searchStudiesQuery( search ) {

    let query = db( 'studies' )
        .select( 'studies.*' )

        .select( db.raw( 'ARRAY_AGG( DISTINCT keywords.id ) as keyword_ids' ) )
        .select( db.raw( 'ARRAY_AGG( DISTINCT keywords.name ) as keyword_names' ) )
        .leftJoin( 'study_keywords', 'study_keywords.study_id', 'studies.id' )
        .leftJoin( 'keywords', 'study_keywords.keyword_id', 'keywords.id'  )

        .select( db.raw( 'ARRAY_AGG( DISTINCT authors.id ) as author_ids' ) )
        .select( db.raw( 'ARRAY_AGG( DISTINCT authors.name ) as author_names' ) )
        .leftJoin( 'study_authors', 'study_authors.study_id', 'studies.id' )
        .leftJoin( 'authors', 'study_authors.author_id', 'authors.id'  )

        .groupBy( 'studies.id' );

    if( 'keywords' in search ) {
        query = query.whereIn( 'keywords.name', search.keywords );
    }

    return query.then( rows => {
        return rows.map( row => {

            const keywordIds = row.keyword_ids;
            const keywordNames = row.keyword_names;
            const authorIds = row.author_ids;
            const authorNames = row.author_names;

            return {
                id: row.id,
                title: row.title,
                includesFQs: !!row.includesFQs,
                fulltext: row.fulltext,
                year: row.year,
                month: row.month,
                conclusions: row.conclusions,
                abstract: row.abstract,

                // I don't know why the above query returns dupe keywords,
                // authors, etc. tried adding DISTINCT to the ARRAY_AGG
                // functions but it just errors. De-dupe and deserialize
                keywords: objectValues( keywordIds.reduce( ( memo, id, index ) => {
                    memo[ id ] = {
                        id: id,
                        name: keywordNames[ index ],
                    };
                    return memo;
                }, {} ) ),
                authors: objectValues( authorIds.reduce( ( memo, id, index ) => {
                    memo[ id ] = {
                        id: id,
                        name: authorNames[ index ],
                    };
                    return memo;
                }, {} ) ),
            };
        });
    });

}

function getKeywordsQuery( query ) {
    const normalizedQuery = query || '';
    return db.select( 'keywords.*' )
        .select( db.raw( 'COUNT( keywords.id ) as study_count' ) )
        .from( 'keywords' )
        .leftJoin( 'study_keywords', 'study_keywords.keyword_id', 'keywords.id' )
        .groupBy( 'keywords.id' )
        .where( 'name', 'like', `%${ query }%` )
        .orWhere( 'name', 'ilike', `%${ normalizedQuery }%` );
}

function getAuthorsQuery( query ) {
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
        .then( row => {
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
    const fulltext = fileName ? '/uploads/' + fileName : req.body.fulltext;

    const authors = req.body.authors.split(',').map( author => {
        return author.trim();
    });
    const keywords = req.body.keywords.split(',').map( keyword => {
        return keyword.trim();
    });

    // Check for existing study
    db.select( 'id' )
        .from( 'studies' )
        .where( 'title', title )
        .then( result => {

            if( result.length > 0 ) {
                throw new Error( 'A study with this title has already been indexed' );
            }

        // Find any existing author ids, building { name: id } object
        }).then( () => {

            return db.select( 'name', 'id' )
                .from( 'authors' )
                .whereIn( 'name', authors )
                .then( rows => {
                    return rows.reduce( ( memo, row ) => {
                        const newRow = {};
                        newRow[ row.name ] = row.id;
                        return Object.assign( {}, memo, newRow );
                    }, {} );
                });

        // Create any new authors
        }).then( existingAuthors => {

            // Find author names that aren't in the db already
            const newAuthors = authors.filter( name => {
                return !( name in existingAuthors );
            });

            // Create them all
            return Promise.all( newAuthors.map( name => {
                return db.insert({ name: name })
                    .returning([ 'name', 'id' ])
                    .into( 'authors' )
                    .then( row => {
                        return {
                            name: name,
                            id: row[ 0 ],
                        };
                    });
            // Build the full list of all authors, merging the newly inserted
            // ones with the existing list
            }) ).then( insertedAuthors => {
                return Object.assign(
                    {},
                    insertedAuthors.reduce( ( memo, author ) => {
                        memo[ author.name ] = author.id;
                        return memo;
                    }, {} ),
                    existingAuthors
                );
            });

        // Find any existing keyword ids, building { name: id } object
        }).then( authorQueryResult => {

            return db.select( 'name', 'id' )
                .from( 'keywords' )
                .whereIn( 'name', keywords )
                .then( rows => {
                    return rows.reduce( ( memo, row ) => {
                        const newRow = {};
                        newRow[ row.name ] = row.id;
                        return Object.assign( {}, memo, newRow );
                    }, {} );
                }).then( existingKeywords => {
                    return {
                        existingKeywords: existingKeywords,
                        authors: authorQueryResult,
                    };
                });

        // Create any new keywords
        }).then( continuation => {

            const existingKeywords = continuation.existingKeywords;

            // Find author names that aren't in the db already
            const newKeywords = keywords.filter( name => {
                return !( name in existingKeywords );
            });

            // Create them all
            return Promise.all( newKeywords.map( name => {
                return db.insert({ name: name })
                    .returning([ 'name', 'id' ])
                    .into( 'keywords' )
                    .then( row => {
                        return {
                            name: name,
                            id: row[ 0 ],
                        };
                    });
            // Build the full list of all authors, merging the newly inserted
            // ones with the existing list
            }) ).then( insertedKeywords => {
                return Object.assign(
                    {},
                    insertedKeywords.reduce( ( memo, author ) => {
                        memo[ author.name ] = author.id;
                        return memo;
                    }, {} ),
                    existingKeywords
                );
            }).then( keywordResults => {
                return Object.assign( {}, continuation, {
                    keywords: keywordResults,
                });
            });

        // Create the actual study, get the id and pass authors
        }).then( continuation => {

            return db.insert({
                title: title,
                includesFqs: includesFqs ? 1 : 0,
                fulltext: fulltext,
                month: month,
                year: year,
                conclusions: conclusions,
                abstract: abstract
            }).into( 'studies' )
                .returning( 'id' )
                .then( studyRow => {

                    return Object.assign( {}, continuation, {
                        studyId: studyRow[ 0 ],
                    });

                });

        // Populate the keyword-study join table
        }).then( continuation => {

            const kws = continuation.keywords;
            const sids = continuation.studyId;

            return Promise.all( Object.keys( kws ).map( name => {
                return db.insert({
                    study_id: sids,
                    keyword_id: keywords[ name ],
                }).into( 'study_keywords' );
            }) ).then( () => {
                return continuation;
            });

        // Populate the author-study join table
        }).then( continuation => {

            const as = continuation.authors;
            const studyId = continuation.studyId;

            return Promise.all( Object.keys( as ).map( name => {
                return db.insert({
                    study_id: studyId,
                    author_id: authors[ name ],
                }).into( 'study_authors' );
            }) ).then( () => continuation );
        }).then( continuation => {

            return { success: true };

        });

}

export function getAllKeywords( req ) {

    return getKeywordsQuery( '' );

}

export function searchKeywords( req ) {

    const query = ( req.query && req.query.query ) || '';

    return getKeywordsQuery( query ).then( keywords => {
        return {
            query: query,
            suggestions: keywords
        };
    });

}

export function getAllAuthors( req ) {

    return getAuthorsQuery( '' );

}

export function getAuthors( req ) {

    const query = ( req.query && req.query.query ) || '';

    return getAuthorsQuery( query ).then( authors => {
        return {
            query: query,
            suggestions: authors
        };
    });

}

export function checkTitle( req ) {

    const title = req.query && req.query.title;

    return doesStudyExistWithTitle( title ).then( exists => {

        return { existingId: exists };

    });

}

export function getSiteData() {

    return getKeywordsQuery().then( keywords => {
        return { keywords: keywords };
    }).then( continuation => {

        return getAuthors().then( authors => {

            return Object.assign( {}, continuation, {
                authors: authors,
            });

        });

    }).then( continuation => {

        return db( 'studies' ).count( '* as count' ).then( row => {

            return Object.assign( {}, continuation, {
                totalStudies: row[ 0 ].count,
            });

        });

    });

}

export function searchStudies( req ) {

    return searchStudiesQuery( req.query );

}
