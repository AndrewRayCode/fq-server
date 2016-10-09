$.fn.serializeObject = function() {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

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
