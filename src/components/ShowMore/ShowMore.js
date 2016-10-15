import React, { Component, } from 'react';

const SHOW_MORE_CHAR_LIMIT = 400;

export default class ShowMore extends Component {

    constructor() {
        super();
        this.state = { open: false };
    }

    render() {

        const { text, } = this.props;
        const { open, } = this.state;

        return open ?
            text :
            <span>
                { text.substring( 0, SHOW_MORE_CHAR_LIMIT ) }&hellip;
                <a href="#" onClick={ e => {
                    e.preventDefault();
                    this.setState({ open: true });
                }}>Show all</a>
            </span>;

    }
}
