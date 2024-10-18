const fs = require('fs');
const AWS = require('aws-sdk');
const Category = require('../models/category');

// Set up AWS S3
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-south-1'
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
        ACL: 'public-read', // To make the file publicly accessible
      };

      // Upload the file to S3
      const s3UploadResult = await s3.upload(params).promise();

      // Save category details in MongoDB
      const newCategory = new Category({
        name,
        icon: s3UploadResult.Location, // URL of the uploaded icon in S3
        neams,
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
};



module.exports = categoryController;
