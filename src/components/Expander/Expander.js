import React, { Component, PropTypes } from 'react';
import { hasDOMParent, } from 'utils/utils';

export default class Expander extends Component {

    constructor( props, context ) {

        super( props );
        this.state = { isOpen: false };

        this.onClick = this.onClick.bind( this );
        this._onBodyClick = this._onBodyClick.bind( this );

    }

    componentDidMount() {

        if( typeof window !== 'undefined' && this.props.bodyClickClose ) {
            window.document.body.addEventListener( 'click', this._onBodyClick );
        }

    }

    componentWillUnmount() {

        if( typeof global.window !== 'undefined' && this.props.bodyClickClose ) {
            window.document.body.removeEventListener( 'click', this._onBodyClick );
        }

    }

    _onBodyClick( event ) {

        const { isOpen, } = this.state;
        const { expander, } = this.refs;

        if(
            isOpen &&
            !hasDOMParent( event.target, React.findDOMNode( expander ) )
        ) {
            this.setState({ isOpen: !isOpen });
        }

    }

    onClick( event ) {

        if( event ) {
            event.preventDefault();
        }

        this.setState({ isOpen: !this.state.isOpen });

    }

    render() {

        const styles = require( './Expander.scss' );
        const { isOpen, } = this.state;

        return <span
                className={ styles.expander }
            >
            <span
                ref="expander"
                className={ styles.trigger }
                onClick={ this.onClick }
            >
                { this.props.children }
            </span>
            { isOpen ? <div className={ styles.expanded }>
                { this.props.expanded }
            </div> : null }
        </span>;

    }

}
