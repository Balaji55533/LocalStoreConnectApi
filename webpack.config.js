const path = require('path');

module.exports = {
  entry: './index.js', // Point to your actual main file, wherever it is located
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  target: 'node', // Specify the target as Node.js for server-side apps
  mode: 'production'
};
