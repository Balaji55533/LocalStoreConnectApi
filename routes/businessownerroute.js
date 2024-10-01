const express = require('express');
const router = express.Router();
const businessOwnerController = require('../controllers/businessownercontroller');
const verifyJWT = require('../middleware/verifyJWT');


router.post('/businessowner/resister', businessOwnerController.registerBusinessOwner);
router.post('/businessowner/login', businessOwnerController.loginBusinessOwner);


module.exports = router; 