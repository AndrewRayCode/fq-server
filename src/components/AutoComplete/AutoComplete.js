import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { hasDOMParent, } from 'utils/utils';

export default class AutoComplete extends Component {

    componentDidMount() {

        const node = ReactDOM.findDOMNode( this );

        const { serviceUrl, delimiter, } = this.props;

        // do the old-school stuff
        const dialog = $( node ).autocomplete({
            serviceUrl,
            delimiter: delimiter || /\s*,\s*/,
            transformResult: response => {
                const json = JSON.parse( response );
                return {
                    suggestions: json.suggestions.map( item => {
                        return { value: item.name, data: item.id };
                    })
                };
            }
        });

        // start a new React render tree with our node and the children
        // passed in from above, this is the other side of the portal.
        ReactDOM.render( <div>{ this.props.children }</div>, node );

    }

    render() {

        const {
            name, type, placeholder, className,
        } = this.props;

        return <input
            name={ name }
            type={ type }
            placeholder={ placeholder }
            className={ className }
        />;

    }

}
