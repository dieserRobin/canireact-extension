const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development', // oder 'production', je nach Bedarf
    entry: {
        background: './src/background.ts',
        content: './src/content/index.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js'
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: 'ts-loader'
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'manifest.json', to: 'manifest.json' },
                { from: 'src/extension-styles.css', to: 'extension-styles.css' },
                { from: 'src/images', to: 'images' },
                { from: 'src/languages', to: 'languages', globOptions: { ignore: ['**/*.js'] } } // Kopiere nur JSON-Dateien
            ]
        })
    ]
};
