$( document ).ready( function() {

    const $title = $( 'input[name="title"]' );
    const $existsToast = $( '#existsToast' );
    const $existsMsg = $( '#existsMsg' );
    $title.blur( function() {

        $existsToast.hide();
        const title = $title.val();

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
        console.log( formData );
        
        $.ajax({
            url: '/add',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
        }).then( function() {
            console.log('done');
        }).catch( function( error ) {
            console.error('failure', error);
        });
    });

})
