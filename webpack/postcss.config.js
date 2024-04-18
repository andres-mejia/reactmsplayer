const path = require('path')

module.exports = {
    plugins: {
        'postcss-import': { path: [path.resolve(__dirname, '../src/styles')] },
        'postcss-inline-svg': {

            path: path.resolve(__dirname, '../src/styles/svg_inline'),
            removeFill: false
        },
        'postcss-nesting': {},
        'postcss-nested': {},
        'postcss-svgo': {},
        'postcss-reporter': { throwError: true },
        'postcss-clean': {}
    }
}
