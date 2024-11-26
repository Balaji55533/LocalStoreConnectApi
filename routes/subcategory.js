const express = require('express');
const router = express.Router();   
const subCategoryController = require('../controllers/subcategory'); 

router.post('/subcategory/create',subCategoryController.addSubcategory );
router.get('/subcategory', subCategoryController.getSubCategory );
module.exports = router;  