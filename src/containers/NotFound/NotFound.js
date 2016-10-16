import React from 'react';

export default function NotFound() {

    const appStyles = require( '../App/App.scss' );

    return <div className="container">
        <h1 className={ appStyles.pageTitle }>
            This page doesn't exist
            </h1>
            <p>
            This page was not found on the Fluorquinolone Research website.
        </p>
    </div>;

}
