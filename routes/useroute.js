const express = require('express');
const router = express.Router();
const userController = require('../controllers/usercontroller');
const businessOwnerController = require('../controllers/businessownercontroller');
const verifyJWT = require('../middleware/verifyJWT');

// Authentication
// router.post('/users/login', userController.userLogin);
// Registration
router.post('/users', userController.registerUser);
router.get('/', (req, res) => {
    res.send('Hello World!');
  });

// Get Current User
// router.get('/user', verifyJWT, userController.getCurrentUser);

// Update User
// router.put('/user', verifyJWT, userController.updateUser);

module.exports = router;