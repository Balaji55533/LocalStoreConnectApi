
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const DynamicPostData = require('../models/Addpost');
const { default: mongoose } = require('mongoose');
 

const AddPost = asyncHandler(async (req, res) => {
  try {
    const { postData, userId } = req.body;

    if (!userId || !postData) {
      return res.status(400).json({
        message: "User ID and post data are required",
      });
    }

    // Check if a post by this user already exists
    let dynamicPostDataEntry = await DynamicPostData.findOne({ createdBy: mongoose.Types.ObjectId(userId) });

    if (dynamicPostDataEntry) {
      // If the post exists, update it with the new postData
      dynamicPostDataEntry.postData = postData;
      const updatedData = await dynamicPostDataEntry.save();

      res.status(200).json({
        message: "Dynamic data updated successfully",
        data: updatedData,
      });
    } else {
      // If no post exists, create a new one with createdBy field
      dynamicPostDataEntry = new DynamicPostData({
        createdBy: mongoose.Types.ObjectId(userId),
        postData,
      });
      const savedData = await dynamicPostDataEntry.save();

      res.status(201).json({
        message: "Dynamic data stored successfully",
        data: savedData,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error storing dynamic data",
      error: error.message,
    });
  }
});

  const getPostData = asyncHandler(async (req, res) => {
    try {
     
      // Check if a post by this user already exists
      let dynamicPostDataEntry = await DynamicPostData.find({});
  
  
        res.status(201).json({
          message: 'Dynamic data stored successfully',
          data: dynamicPostDataEntry,
        });
    } catch (error) {
      res.status(500).json({
        message: 'Error storing dynamic data',
        error: error.message,
      });
    }
  });
  
module.exports = {
    AddPost,
    getPostData
}
