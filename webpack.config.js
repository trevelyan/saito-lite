// Webpack uses this to work with directories
const path = require('path');

// This is main configuration object.
// Here you write different options and tell Webpack what to do
module.exports = {
    node: {
        fs: "empty"
    },

    // Path to your entry point. From this file Webpack will begin his work
    entry: ["babel-polyfill",'./web/src/index.js'],
    //entry: './src/index.js',

    // Path and filename of your result bundle.
    // Webpack will bundle all JavaScript into this file
    output: {
        path: path.resolve(__dirname, './web/dist'),
        filename: 'browser.js'
    },

    // need to keep these seperate
    // externals: {
    //     net: "net",
    //     uws: "uws"
    // },

  // rules that we're governed by
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
        ]
    },


    // Default mode for Webpack is production.
    // Depending on mode Webpack will apply different things
    // on final bundle. For now we don't need production's JavaScript
    // minifying and other thing so let's set mode to development
    mode: 'development'
};
