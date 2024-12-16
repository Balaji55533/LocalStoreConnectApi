
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


// const uploadPostImage = asyncHandler(async (req, res) => {
//   const { postId } = req.body;
//   const files = req.files;

//   // Check if postId and file are present
//   if (!postId || !files) {
//     return res.status(400).json({ message: "Post ID and files are required." });
//   }

//   const uploadedFileUrls = [];
//   const s3Keys = []; // Array to store object keys

//   try {
//     // Iterate through each file and upload to S3
//     for (const file of files) {
//       const objectKey = `post-files/${Date.now()}-${file.originalname}`; // Unique file key

//       const uploadParams = {
//         Bucket: process.env.AWS_BUCKET_NAME, // Replace with your S3 bucket name
//         Key: objectKey,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//         ACL: 'public-read', // Make file publicly readable (optional)
//       };

//       // Upload to S3
//       const uploadResponse = await s3.upload(uploadParams).promise();

//       // Store the uploaded URL and key
//       uploadedFileUrls.push(uploadResponse.Location);
//       s3Keys.push(objectKey); // Add only the S3 object key
//     }

//     // Update the post with the file URLs and S3 keys
//     const updatedPost = await  DynamicPostData.updateOne(
//       { _id: postId }, // Find the document by its ID
//       {
//         $set: {
//           "postData.postImage": uploadedFileUrls, 
//           "s3Keys": s3Keys,
//         },
//       }
//     );


//     if (!updatedPost) {
//       return res.status(404).json({ message: "Post not found." });
//     }

//     // Respond with success
//     return res.status(200).json({
//       message: "Files uploaded to S3 and post updated successfully.",
//       fileUrls: uploadedFileUrls,
//       s3Keys: s3Keys, // Include keys in the response for debugging or reference
//     });
//   } catch (error) {
//     // Handle errors
//     console.error("Error uploading files to S3:", error);
//     return res.status(500).json({
//       message: "An error occurred while uploading files to S3.",
//       error: error.message,
//     });
//   }
// });

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
  const s3Keys = [];
  try {
      // Prepare file for upload
      for (const file of files) {
          const fileContent = file.buffer;
          const fileExtension = file.originalname.split('.').pop();
          const key = `post-files/${postId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

          const params = {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: key,
              Body: fileContent,
              ContentType: file.mimetype,
              ACL: 'public-read',
          };

          // Upload each file to S3
          const s3Response = await s3.upload(params).promise();
          uploadedFileUrls.push(s3Response.Location); // Store the URL
          s3Keys.push(key);
      }

      // Update the post with the file URL using findByIdAndUpdate
      const updatedPost = await DynamicPostData.findByIdAndUpdate(
          postId,
          {
              $set: {
                  "postData.postImage": uploadedFileUrls,  // Set the new postImage field
                  "postData.s3Keys": s3Keys,
              },
          },
          { new: true }  // Return the updated document after the update
      );

      console.log("updatedPost",updatedPost)
      if (!updatedPost) {
          return res.status(404).json({ message: "Post not found." });
      }


      return res.status(200).json({
          message: "File uploaded and post updated successfully.",
          fileUrl: uploadedFileUrls,
      });
  } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ 
          message: "An error occurred while uploading the file.",
          error: error.message,
          stack: error.stack
      });
  }
});

const AddPost = asyncHandler(async (req, res) => {
  try {
    const { postData, userId,category,isSubmit } = req.body;

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
      "postData.category._id": postData?.category?._id,
    });
    
    if (dynamicPostDataEntry) { 
      // Update existing post
      dynamicPostDataEntry.postData = {
        ...dynamicPostDataEntry.postData, // Retain existing fields like postImage and s3Keys
        ...postData, // Overwrite with new fields from postData
      };
      dynamicPostDataEntry.isSubmit = isSubmit;
      
      const updatedData = await dynamicPostDataEntry.save();
      res.status(200).json({
        message: "Dynamic data updated successfully",
        data: updatedData,
        success: true,
      });
    } else {
      // Create a new post entry
      dynamicPostDataEntry = new DynamicPostData({
        createdBy: mongoose.Types.ObjectId(userId),
        category: mongoose.Types.ObjectId(category),
        isSubmit: isSubmit,
        postData,
      });
    
      const savedData = await dynamicPostDataEntry.save(); 
      res.status(201).json({
        message: "Dynamic data stored successfully",
        data: savedData,
        success: true,
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




  const deletePostData = asyncHandler(async (req, res) => {
    try {
      const { postId } = req.body;
  
      // Fetch the document to get S3 file keys
      const posts = await DynamicPostData.find({ _id: postId });
  
      if (posts.length > 0) {
        // Collect S3 keys for deletion (assuming each post has image keys stored in `s3Keys`)
        const s3KeysToDelete = posts.flatMap(post => post.postData.s3Keys || []);
  
  
        // Delete files from S3 bucket
        if (s3KeysToDelete.length > 0) {
          const deleteParams = {
            Bucket: "localbusinessconnect", // Replace with your bucket name
            Delete: {
              Objects: s3KeysToDelete.map(key => ({ Key: key })),
            },
          };

  
          const deleteResponse = await s3.deleteObjects(deleteParams).promise();
  
          // Handle partial failures
          if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
            console.error("S3 Deletion Errors:", deleteResponse.Errors);
            return res.status(500).json({
              message: 'Some files could not be deleted from S3',
              errors: deleteResponse.Errors,
            });
          }
        }
  
        // Delete the database entries
        const deletedCount = await DynamicPostData.deleteMany({ _id: postId });
  
        res.status(200).json({
          message: 'Post and associated S3 images deleted successfully',
          deletedCount: deletedCount.deletedCount, // Number of posts deleted
        });
      } else {
        res.status(404).json({
          message: 'No post found with the specified ID',
        });
      }
    } catch (error) {
      console.error("Error:", error);
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
  