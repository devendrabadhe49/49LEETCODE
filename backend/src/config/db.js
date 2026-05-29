const mongoose = require('mongoose');

module.exports = async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/day2';
  return mongoose.connect(uri);
};