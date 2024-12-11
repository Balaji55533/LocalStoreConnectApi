const fs = require('fs');
const AWS = require('aws-sdk');
const Category = require('../models/category');

// Set up AWS S3
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'eu-north-1'
});



const s3 = new AWS.S3();

const categoryController = {
  
  uploadCategory: async (req, res) => {
    try {
      const { name, neams } = req.body;
      const file = req.file;
       
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded.' });
      }

      // Read the uploaded file
      const fileContent = fs.readFileSync(file.path);

      // Set up S3 upload parameters
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `categoryicons/${file.originalname}`,
        Body: fileContent,
        ContentType: file.mimetype,
      };

      // Upload the file to S3
      const s3UploadResult = await s3.upload(params).promise();

      // Save category details in MongoDB
      const newCategory = new Category({
        name,
        icon: s3UploadResult.Location, // URL of the uploaded icon in S3
        neams,
        s3Keys: [s3UploadResult.Key],
      });

      await newCategory.save();

      // Clean up the uploaded file from the local server
      fs.unlinkSync(file.path);

      res.status(201).json({ message: 'Category created successfully!', data: newCategory });
    } catch (error) {
      console.error('Error uploading category:', error);
      res.status(500).json({ message: 'An error occurred while creating the category.' });
    }
  },
  getCategory: async (req, res) => {
    try {

      const newCategory= await Category.find();

      res.status(201).json({ message: 'Category created successfully!', data: newCategory });
    } catch (error) {
      console.error('Error uploading category:', error);
      res.status(500).json({ message: 'An error occurred while creating the category.' });
    }
  },

  deleteCategory: async (req, res) => {
    try {
      const { categoryId } = req.body;
  
      // Fetch the document to get S3 file keys (assuming you have stored the keys)
      const category = await Category.find({ _id: categoryId }).lean();
  
      if (category.length > 0) {
        // Collect S3 keys for deletion (assuming each post has image keys stored in an array `s3Keys`)
        const s3KeysToDelete = category.flatMap(category => category.s3Keys || []);
          
        console.log("s3KeysToDelete",category)
        // Delete files from S3 bucket
        if (s3KeysToDelete.length > 0) {
          const deleteParams = {
            Bucket: "localbusinessconnect",
            Delete: {
              Objects: s3KeysToDelete.map(key => ({ Key: key })),
              Quiet: false,
            },
          };
  
          await s3.deleteObjects(deleteParams).promise();
        }
  
        // Delete the database entry
        await Category.deleteMany({ _id: categoryId });
  
        res.status(200).json({
          message: 'Category and associated S3 images deleted successfully',
          deletedCount: category,
        });
      } else {
        res.status(404).json({
          message: 'No Category found with the specified ID',
        });
      }
    } catch (error) {
      res.status(500).json({
        message: 'Error deleting post and S3 images',
        error: error.message,
      });
    }
  }
};



module.exports = categoryController;
