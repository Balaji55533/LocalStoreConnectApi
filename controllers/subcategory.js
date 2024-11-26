const fs = require('fs');
const Subcategory = require('../models/subcategory');

const subCategoryController = {
  addSubcategory: async (req, res) => {
    try {
      const { name, categoryId, neams } = req.body;
      // Save category details in MongoDB
      const newSubCategory = new Subcategory({
        name,
        categoryId,
        neams,
      });

      await newSubCategory.save();

      res.status(201).json({ message: 'Sub-Category created successfully!', data: newSubCategory });
    } catch (error) {
      console.error('Error uploading category:', error);
      res.status(500).json({ message: 'An error occurred while creating the subcategory.' });
    }
  },

  getSubCategory: async (req, res) => {
    try {
      var categoryId = req.body.categoryId||null; 
      const newCategory= await Subcategory.find().where('categoryId',categoryId);

      res.status(201).json({ message: 'Sub-Category List!', data: newCategory });
    } catch (error) {
      console.error('Error listing sub-category:', error);
      res.status(500).json({ message: 'An error occurred while creating the category.' });
    }
  },
};



module.exports = subCategoryController;
