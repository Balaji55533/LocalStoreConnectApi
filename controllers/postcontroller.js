
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const DynamicPostData = require('../models/Addpost');
const { default: mongoose } = require('mongoose');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'ap-south-1'
});
const uploadImageToS3 = async (imageData, filename) => {
  const buffer = Buffer.from(imageData.split(',')[1], 'base64'); // Remove base64 prefix
  const params = {
    Bucket:"localstoreconnect",
    Key: `images/${filename}`,
    Body: buffer,
    ContentEncoding: 'base64', // Important for base64 encoding
    ContentType: 'image/webp', // Adjust if needed
    ACL: 'public-read', // Set to allow public access
  };

  const data = await s3.upload(params).promise();
  return data.Location; // S3 URL
};
const AddPost = asyncHandler(async (req, res) => {
  try {
    const { postData, userId } = req.body;

    if (!userId || !postData) {
      return res.status(400).json({
        message: "User ID and post data are required",
      });
    }
   

 
    // Upload images for each node and replace the `images` field with S3 URLs
    if(postData.nodes){
      for (let node of postData.nodes) {
        if (node.data.images && node.data.images.length > 0) {
          const imageUrls = [];
          for (const [index, imageData] of node.data.images.entries()) {
            const filename = `${userId}_${node.id}_${index}.webp`;
            const imageUrl = await uploadImageToS3(imageData, filename);
            imageUrls.push(imageUrl);
          }
          node.data.images = imageUrls; // Replace image data with URLs
        }
      }
    }
    

    // Save post data in the database
    let dynamicPostDataEntry = await DynamicPostData.findOne({ createdBy: mongoose.Types.ObjectId(userId) });

    if (dynamicPostDataEntry) { 
      // Update existing post
      dynamicPostDataEntry.postData = postData;
      const updatedData = await dynamicPostDataEntry.save();
      res.status(200).json({
        message: "Dynamic data updated successfully",
        data: updatedData,
        success: true
      });
    } else {
      // Create a new post entry
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
      const posts = await DynamicPostData.find().lean();
  
  
        res.status(201).json({
          message: 'Dynamic data stored successfully',
          data: posts,
        });
    } catch (error) {
      res.status(500).json({
        message: 'Error storing dynamic data',
        error: error.message,
      });
    }
  });

  const uploadPostImage = asyncHandler(async (req, res) => {
    const { postId } = req.body;
    const files = req.files;
    // Check if postId and file are present
    if (!postId || !files) {
        return res.status(400).json({ message: "Post ID and file are required." });
    }

    try {
        const credentials = await AWS.config.credentials.getPromise();
        
    } catch (credError) {
        return res.status(500).json({ 
            message: "Failed to load AWS credentials",
            error: credError.message
        });
    }

    const uploadedFileUrls = [];

    try {
        // Prepare file for upload
        for (const file of files) {
            const fileContent = file.buffer;
            const fileExtension = file.originalname.split('.').pop();
            const key = `post-files/${postId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

            const params = {
                Bucket: "localstoreconnect",
                Key: key,
                Body: fileContent,
                ContentType: file.mimetype,
                ACL: 'public-read',
            };

            // Upload each file to S3
            const s3Response = await s3.upload(params).promise();
            uploadedFileUrls.push(s3Response.Location); // Store the URL
        }

        // Update the post with the file URL using findByIdAndUpdate
        const updatedPost = await DynamicPostData.findByIdAndUpdate(
            postId,
            {
                $set: {
                    "postData.postImage": uploadedFileUrls,  // Set the new postImage field
                },
            },
            { new: true }  // Return the updated document after the update
        );

        if (!updatedPost) {
            return res.status(404).json({ message: "Post not found." });
        }


        return res.status(200).json({
            message: "File uploaded and post updated successfully.",
            fileUrl: uploadedFileUrls,
        });
    } catch (error) {
        return res.status(500).json({ 
            message: "An error occurred while uploading the file.",
            error: error.message,
            stack: error.stack
        });
    }
});


const deletePostData = asyncHandler(async (req, res) => {
  try {
     const { postId } = req.body;
    // Check if a post by this user already exists
    const posts = await DynamicPostData.findByIdAndDelete(postId);


      res.status(201).json({
        message: 'Post Delete successfully',
        data: posts,
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
    getPostData,
    uploadPostImage,
    deletePostData
}
  