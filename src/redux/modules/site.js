const LOAD = 'redux-example/site/LOAD';
const LOAD_SUCCESS = 'redux-example/site/LOAD_SUCCESS';
const LOAD_FAIL = 'redux-example/site/LOAD_FAIL';

const initialState = { data: null };

export default function reducer( state = initialState, action = {} ) {

    switch( action.type ) {

        case LOAD_SUCCESS:
            return {
                ...state,
                data: action.result
            };
        case LOAD_FAIL:
            return {
                ...state,
                error: action.error
            };
        default:
            return state;
    }

}

export function isLoaded( globalState ) {
    return globalState.site && globalState.site.data;
}

export function load() {
    return {
        types: [ LOAD, LOAD_SUCCESS, LOAD_FAIL ],
        promise: client => client.get( '/site/load' )
    };
}
