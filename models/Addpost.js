// models/DynamicData.js
const mongoose = require('mongoose');

const AddPost = new mongoose.Schema({
  postData: { type: mongoose.Schema.Types.Mixed, required: true }, // Flexible field for dynamic data
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const DynamicPostData = mongoose.model('postData', AddPost);

module.exports = DynamicPostData;
