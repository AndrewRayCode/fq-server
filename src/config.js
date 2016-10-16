require( 'babel-polyfill' );

const environment = {
    development: {
        isProduction: false
    },
    production: {
        isProduction: true
    }
}[ process.env.NODE_ENV || 'development' ];

module.exports = Object.assign({
    host: process.env.HOST || 'localhost',
    port: process.env.PORT,
    apiHost: process.env.APIHOST || 'localhost',
    apiPort: process.env.APIPORT,
    app: {
        title: 'Fluorquinolone Research',
        description: 'Fluorquinolone Research',
        head: {
            title: 'Fluorquinolone Research',
            defaultTitle: 'Fluorquinolone Research',
            titleTemplate: '%s | Fluorquinolone Research',
            meta: [
                {name: 'description', content: 'Fluorquinolone Research'},
                {charset: 'utf-8'},
                {property: 'og:site_name', content: 'Fluorquinolone Research'},
                {property: 'og:image', content: 'https://react-redux.herokuapp.com/logo.jpg'},
                    {property: 'og:locale', content: 'en_US'},
                {property: 'og:title', content: 'Fluorquinolone Research'},
                {property: 'og:description', content: 'Fluorquinolone Research'},
                {property: 'og:card', content: 'summary'},
                {property: 'og:site', content: '@andrewray'},
                {property: 'og:creator', content: '@andrewray'},
                {property: 'og:image:width', content: '200'},
                {property: 'og:image:height', content: '200'}
            ]
        }
    },

}, environment);
