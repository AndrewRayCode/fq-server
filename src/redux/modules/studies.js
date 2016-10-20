const LOAD = 'redux-example/studies/LOAD';
const LOAD_SUCCESS = 'redux-example/studies/LOAD_SUCCESS';
const LOAD_FAIL = 'redux-example/studies/LOAD_FAIL';

const TITLE_CHECK = 'redux-example/studies/TITLE_CHECK';
const TITLE_CHECK_SUCCESS = 'redux-example/studies/TITLE_CHECK_SUCCESS';
const TITLE_CHECK_FAIL = 'redux-example/studies/TITLE_CHECK_FAIL';
const CLEAR_TITLE_ERROR = 'redux-example/studies/CLEAR_TITLE_ERROR';

const SAVE = 'redux-example/studies/SAVE';
const SAVE_SUCCESS = 'redux-example/studies/SAVE_SUCCESS';
const SAVE_FAIL = 'redux-example/studies/SAVE_FAIL';

const initialState = {
    loaded: false,
    saveError: null,
    existingStudyId: null,
};

export default function reducer( state = initialState, action = {} ) {

    switch( action.type ) {
        case CLEAR_TITLE_ERROR: {
            return {
                ...state,
                existingStudyId: null,
            };
        }
        case TITLE_CHECK_SUCCESS: {
            return {
                ...state,
                existingStudyId: action.result.existingId,
            };
        }
        case LOAD: {
            return {
                ...state,
                loading: true
            };
        }
        case LOAD_SUCCESS: {
            return {
                ...state,
                loading: false,
                loaded: true,
                data: action.result,
                error: null
            };
        }
        case LOAD_FAIL: {
            return {
                ...state,
                loading: false,
                loaded: false,
                data: null,
                error: action.error
            };
        }
        case SAVE: {
            return state; // 'saving' flag handled by redux-form
        }
        case SAVE_SUCCESS: {
            return {
                ...state,
                saveError: null,
            };
        }
        case SAVE_FAIL: {
            return typeof action.error === 'string' ? {
                ...state,
                saveError: action.error,
            } : state;
        }

        default: {
            return state;
        }
    }

}

export function isLoaded( globalState ) {
  return globalState.studies && globalState.studies.loaded;
}

export function search( params ) {
    return {
        types: [ LOAD, LOAD_SUCCESS, LOAD_FAIL ],
        promise: client => client.get( '/studies/searchStudies', { params } )
    };
}

export function save( study ) {
    return {
        types: [ SAVE, SAVE_SUCCESS, SAVE_FAIL ],
        promise: client => client.post( '/studies/add', {
            data: study
        })
    };
}

export function checkTitle( title ) {
    return {
        types: [ TITLE_CHECK, TITLE_CHECK_SUCCESS, TITLE_CHECK_FAIL ],
        promise: client => client.get( '/studies/checkTitle', { params: { title } } )
    };
}
