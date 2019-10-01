var path = require('path');

module.exports = {
  node: {
    fs: "empty"
  },
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'saitolib.js'
    // library: 'saitolib'
    //,
    // libraryTarget: 'commonjs2'
  }
};

