const express = require('express');
const router = express.Router();
const multer = require('multer');
const businessOwnerController = require('../controllers/businessownercontroller');
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

router.post('/businessowner/resister', businessOwnerController.registerBusinessOwner);
router.post('/businessowner/login', businessOwnerController.loginBusinessOwner);
router.post('/businessowner/upload-file', upload.single('file'), businessOwnerController.uploadUserFile);

module.exports = router; 