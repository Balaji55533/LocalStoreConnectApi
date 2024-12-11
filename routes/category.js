const express = require('express');
const router = express.Router();
const multer = require('multer');
const verifyJWT = require('../middleware/verifyJWT');
const categoryController = require('../controllers/category');
const storage = multer.memoryStorage();
const upload = multer({ dest: 'uploads/' });

router.post('/category/create', upload.single('iconUrl'),categoryController.uploadCategory );
router.get('/category', categoryController.getCategory );
router.delete('/category/delete', categoryController.deleteCategory );

module.exports = router;  