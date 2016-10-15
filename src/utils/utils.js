export function uniqueArray( arr ) {
    return arr.filter( ( elem, pos ) => {
        return arr.indexOf( elem ) === pos;
    });
}
