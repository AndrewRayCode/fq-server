function formatKeyword( keyword, selected ) {
    return `<button
        class="btn btn-default js-keyword-select"
        type="button"
        data-id="${ keyword.id }"
    >
        ${ keyword.name } <span class="badge">${ keyword.study_count || ''}</span>
    </button>`;
}

function formatKeywordInline( keyword, selected ) {
    return `<span
        class="js-keyword-select"
        data-id="${ keyword.id }"
    >
        ${ keyword.name }
    </span>`;
}


function formatActiveKeyword( keyword, selected ) {
    return `<button
        class="btn btn-primary js-keyword-remove"
        type="button"
        data-id="${ keyword.id }"
        title="Remove this keyword search"
    >
        ${ keyword.name }
        <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
    </button>`;
}

function formatAuthor( author ) {
    return author.name;
}

function formatStudy( study ) {
    return `<li class="study">
        <div class="panel panel-default">
            <div class="panel-body">
                <div class="title">${ study.title }</div>
                <ul class="subTitle">
                    <li>
                        <a href="${ study.fullText }" target="_blank">Full Text</a>
                    </li>
                    <li>
                        <b>Authors:</b> ${ study.authors.map( a => formatAuthor( a ) ).join(', ') }
                    </li>
                </ul>
                <p>
                    <b>Abstract:</b> ${ study.abstract }
                </p>
                <p>
                    <b>Conclusions:</b> ${ study.conclusions.replace( /\n/g, '<br />' ) }
                </p>
                <p>
                    <b>Keywords:</b> ${ study.keywords.map( kw => formatKeywordInline( kw ) ).join(', ') }
                </p>
            </div>
        </div>
    </li>`;
}

function renderKeywords( allKeywords, selectedKeywords ) {

    const activeKeywords = allKeywords.filter( function( kw ) {

        return selectedKeywords.indexOf( kw.id ) > -1;

    });

    const inactiveKeywords = allKeywords.filter( function( kw ) {

        return selectedKeywords.indexOf( kw.id ) === -1;

    });

    $( '#keywords' ).html( inactiveKeywords.map( formatKeyword ).join( '\n' ) );
    $( '#activeKeywords' ).html( activeKeywords.map( formatActiveKeyword ).join( '\n' ) );
    $( '#activeLabel' ).css( 'display', activeKeywords.length > 0 ? 'block' : 'none' );

}

function updateStudies( selectedKeywords ) {

    if( selectedKeywords.length ) {

        $.getJSON( '/studies', { keywords: selectedKeywords }).then( function( studies ) {
            $( '#studies' ).html( studies.map( formatStudy ).join( '\n' ) );
        });

    }

}

$( document ).ready( function() {

    var selectedKeywords = [];

    var $studies = $( '#studies' );
    var allKeywords;

    $.getJSON( '/siteData' ).then( function( siteData ) {

        allKeywords = siteData.keywords;
        var totalStudies = siteData.totalStudies;
        renderKeywords( allKeywords, selectedKeywords );

        $( '#totalStudies' ).html( totalStudies );

    }).fail( function( error ) {
        throw error;
    });

    $( document ).on( 'click', '.js-keyword-select', function( event ) {

        var $button = $( this );
        selectedKeywords.push( $button.data( 'id' ) );
        renderKeywords( allKeywords, selectedKeywords );
        updateStudies( selectedKeywords );

    });

    $( document ).on( 'click', '.js-keyword-remove', function( event ) {

        var $button = $( this );
        var id = $button.data( 'id' );
        selectedKeywords = selectedKeywords.filter( function( search ) { return search !== id; } );
        renderKeywords( allKeywords, selectedKeywords );
        updateStudies( selectedKeywords );

    });

});
