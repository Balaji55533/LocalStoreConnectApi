const express = require('express');
const router = express.Router();
const multer = require('multer');
const verifyJWT = require('../middleware/verifyJWT');
const storage = multer.memoryStorage();
const upload = multer({ dest: 'uploads/' });
const postController = require('../controllers/postcontroller');

router.post('/post/create',verifyJWT, postController.AddPost );
router.post('/post',verifyJWT, postController.getPostData );
module.exports = router;  
