const express = require('express');
const router = express.Router();
const multer = require('multer');
const verifyJWT = require('../middleware/verifyJWT');
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
});
const postController = require('../controllers/postcontroller');

router.post('/post/create',verifyJWT, postController.AddPost );
router.post('/post',verifyJWT, postController.getPostData );
router.post('/post/upload-images', verifyJWT,upload.array('file'), postController.uploadPostImage);
router.post('/post/deletepost', verifyJWT, postController.deletePostData);


module.exports = router;  
