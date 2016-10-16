import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { hasDOMParent, } from 'utils/utils';

export default class Dropdown extends Component {

    constructor( props, context ) {

        super( props );
        this.state = { isOpen: false };

        this.onClick = this.onClick.bind( this );
        this._onBodyClick = this._onBodyClick.bind( this );

    }

    componentDidMount() {

        if( typeof window !== 'undefined' ) {
            window.document.body.addEventListener( 'click', this._onBodyClick );
        }

    }

    componentWillUnmount() {

        if( typeof global.window !== 'undefined' ) {
            window.document.body.removeEventListener( 'click', this._onBodyClick );
        }

    }

    _onBodyClick( event ) {

        const { isOpen, } = this.state;
        const { dropdown, } = this.refs;

        if(
            isOpen &&
            !hasDOMParent( event.target, ReactDOM.findDOMNode( dropdown ) )
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

        const styles = require( './Dropdown.scss' );
        const { isOpen, } = this.state;

        return <span
            className={ styles.dropdown }
            ref="dropdown"
        >
            <span
                className={ styles.trigger }
                onClick={ this.onClick }
            >
                { this.props.children }
            </span>
            { isOpen ? <div className={ styles.list }>
                { this.props.items.map( ( item, index ) => <div
                    key={ index }
                    className={ styles.item }
                >
                    { item }
                </div> ) }
            </div> : null }
        </span>;

    }

}
