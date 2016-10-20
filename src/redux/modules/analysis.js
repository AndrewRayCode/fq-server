const LOAD = 'redux-example/analysis/LOAD';
const LOAD_SUCCESS = 'redux-example/analysis/LOAD_SUCCESS';
const LOAD_FAIL = 'redux-example/analysis/LOAD_FAIL';

const SAVE = 'redux-example/analysis/SAVE';
const SAVE_SUCCESS = 'redux-example/analysis/SAVE_SUCCESS';
const SAVE_FAIL = 'redux-example/analysis/SAVE_FAIL';

const initialState = {
    data: {},
};

export default function reducer( state = initialState, action = {} ) {

    switch( action.type ) {
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
                data: {
                    ...state.data,
                    [ action.result.slug ]: action.result
                },
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

export function isLoaded( globalState, slug ) {
  return globalState.analysis && globalState.analysis.data[ slug ];
}

export function load( slug ) {
    return {
        types: [ LOAD, LOAD_SUCCESS, LOAD_FAIL ],
        promise: client => client.get( '/studies/analysis', {
            params: { slug }
        })
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
