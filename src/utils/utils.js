export function uniqueArray( arr ) {
    return arr.filter( ( elem, pos ) => {
        return arr.indexOf( elem ) === pos;
    });
}

function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

export function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

export function hasDOMParent( child, parent ) {
    let node = child.parentNode;
    while( node !== null ) {
        if( node === parent ) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}
