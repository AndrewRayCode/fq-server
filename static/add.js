$( document ).ready( function() {

    const $title = $( 'input[name="title"]' );
    const $authors = $( 'input[name="authors"]' );
    const $existsToast = $( '#existsToast' );
    const $existsMsg = $( '#existsMsg' );
    const $submitErrorToast = $( '#submitErrorToast' );
    const $submitErrorMsg = $( '#submitErrorMsg' );
    const $conclusions = $( 'input[name="conclusions"]' );
    const $abstract = $( 'input[name="abstract"]' );

    $title.blur( function() {

        $existsToast.hide();
        const originalTitle = $title.val();
        const title = originalTitle.trim().replace( /\.$/, '' );

        $title.val( title );

        $.getJSON( '/checkTitle', { title: title }, function( response ) {
            const id = response.existingId;
            if( id ) {
                $existsToast.show();
                $existsMsg.html(
                    `This study exists: <a href="/${ id }">${ id }</a>`
                );
            }
        })
    });

    $( 'input[name="keywords"]' ).autocomplete({
        serviceUrl: '/keywords',
        delimiter: /\s*,\s*/,
        transformResult: function( response ) {
            const json = JSON.parse( response );
            return {
                suggestions: json.suggestions.map( function( item ) {
                    return { value: item.name, data: item.id };
                })
            };
        }
    });

    $conclusions.blur( function() {

        const original = $conclusions.val() || '';
        $conclusions.val( original.trim() );

    });

    $abstract.blur( function() {

        const original = $abstract.val() || '';
        $abstract.val( original.trim() );

    });

    $authors.blur( function() {

        const originalAuthors = (
            $authors.val() || ''
        ).trim().replace( /\.$/, '' );

        $authors.val( originalAuthors.split( ',' ).map( function( a ) {
            return a.trim().replace( /^\d+|\d+$/, '' );
        }).join(', ') );

    });

    $( 'input[name="authors"]' ).autocomplete({
        serviceUrl: '/authors',
        delimiter: /\s*,\s*/,
        transformResult: function( response ) {
            const json = JSON.parse( response );
            return {
                suggestions: json.suggestions.map( function( item ) {
                    return { value: item.name, data: item.id };
                })
            };
    }
    });
    
    var $form = $( 'form' );

    $( 'form' ).submit( function( event ) {
        event.preventDefault();
    
        var formData = new FormData( $form.get( 0 ) );
        $submitErrorToast.hide();
        
        $.ajax({
            url: '/add',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
        }).then( function() {

            $('form').get( 0 ).reset();

        }).catch( function( error ) {
            console.error( error );
            var errorText;
            try {
                var response = JSON.parse( error.responseText );
                errorText = response.error;
            } catch( e ) {
                errorText = response.responseText;
            }
            $submitErrorToast.show();
            $submitErrorMsg.html( errorText || 'Unknown error' );
        });
    });

})
