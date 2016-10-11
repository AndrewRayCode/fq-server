$( document ).ready( function() {
    
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
