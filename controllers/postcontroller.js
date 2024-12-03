
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const DynamicPostData = require('../models/Addpost');
const { default: mongoose } = require('mongoose');
const AWS = require('aws-sdk');
const cloudinary = require('cloudinary');

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
    const { postData, userId,categoryId,isSubmit } = req.body;

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
    let dynamicPostDataEntry = await DynamicPostData.findOne({ 
      createdBy: mongoose.Types.ObjectId(userId), 
      isSubmit:isSubmit,
      "postData.categoryId":postData?.categoryId
    });

    
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
        categoryId: mongoose.Types.ObjectId(categoryId),
        isSubmit:isSubmit,
        postData,
      });
      const savedData = await dynamicPostDataEntry.save();
      res.status(201).json({
        message: "Dynamic data stored successfully",
        data: savedData,
        success: true
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
     const { filterData } = req.body;
      // Check if a post by this user already exists
      const posts = await DynamicPostData.find(filterData).lean();
  
  
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
    const uploadedFileUrls = [];
    cloudinary.config({
      cloud_name:"dxmw5ftsc", // Replace with your Cloudinary Cloud Name
      api_key: "434511147799427",       // Replace with your API Key
      api_secret: "vEVqtYsLIu_zfGumDy7x5QOKfec", // Replace with your API Secret
    });
    try {
      // Iterate through each file and upload to Cloudinary
      for (const file of files) {
          const fileContent = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

          const uploadResponse = await cloudinary.v2.uploader.upload(
            fileContent,
            {
              folder: "post-files", // Optional folder structure on Cloudinary
              width: 150,
              crop: "scale",
            }
          );

          // Store the uploaded URL
          uploadedFileUrls.push(uploadResponse.secure_url);
      }

      // Update the post with the file URLs
      const updatedPost = await DynamicPostData.findByIdAndUpdate(
          postId,
          {
              $set: {
                  "postData.postImage": uploadedFileUrls, // Update the postImage field with the Cloudinary URLs
              },
          },
          { new: true } // Return the updated document
      );

      if (!updatedPost) {
          return res.status(404).json({ message: "Post not found." });
      }

      // Respond with success
      return res.status(200).json({
          message: "Files uploaded to Cloudinary and post updated successfully.",
          fileUrls: uploadedFileUrls,
      });
  } catch (error) {
      // Handle errors
      return res.status(500).json({
          message: "An error occurred while uploading files to Cloudinary.",
          error: error,
          stack: error.stack,
      });
  }
});


const deletePostData = asyncHandler(async (req, res) => {
  try {
    const { postId } = req.body;

    // Fetch the document to get S3 file keys (assuming you have stored the keys)
    const posts = await DynamicPostData.find({ _id: postId }).lean();

    if (posts.length > 0) {
      // Collect S3 keys for deletion (assuming each post has image keys stored in an array `s3Keys`)
      const s3KeysToDelete = posts.flatMap(post => post.s3Keys || []);

      // Delete files from S3 bucket
      if (s3KeysToDelete.length > 0) {
        const deleteParams = {
          Bucket: "localstoreconnect",
          Delete: {
            Objects: s3KeysToDelete.map(key => ({ Key: key })),
            Quiet: false,
          },
        };

        await s3.deleteObjects(deleteParams).promise();
      }

      // Delete the database entry
      await DynamicPostData.deleteMany({ _id: postId });

      res.status(200).json({
        message: 'Post and associated S3 images deleted successfully',
        deletedCount: posts,
      });
    } else {
      res.status(404).json({
        message: 'No post found with the specified ID',
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting post and S3 images',
      error: error.message,
    });
  }
});


const getPostDetailsBtUserId = asyncHandler(async (req, res) => {
  try {
   const  { userId }  = req.params;
    // Check if a post by this user already exists
    const posts = await DynamicPostData.find({createdBy:userId}).lean();


      res.status(201).json({
        message: 'Your Data generated!',
        data: posts,
        success:true
      });
  } catch (error) {
    res.status(500).json({
      message: 'Error storing dynamic data',
      error: error.message,
    });
  }
});

const getPostDetailsByPostId = asyncHandler(async (req, res) => {
  try {
   const  { postId }  = req.params;
    // Check if a post by this user already exists
    const posts = await DynamicPostData.find({_id:postId}).lean();


      res.status(201).json({
        message: 'Your Data generated!',
        data: posts,
        success:true
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
    deletePostData,
    getPostDetailsBtUserId,
    getPostDetailsByPostId
}
  