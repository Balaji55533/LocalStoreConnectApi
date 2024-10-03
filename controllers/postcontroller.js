
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const User = require('../models/user');
 

const AdPost = asyncHandler(async (req, res) => {
    const { postData } = req.body;
    // confirm data
    if (!postData || !postData.email || !postData.username || !postData.password) {
        return res.status(400).json({message: "All fields are required"});
    }
    // hash password
    const hashedPwd = await bcrypt.hash(user.password, 10); // salt rounds
    const userObject = {
        "username": user.username,
        "password": hashedPwd,  
        "email": user.email           
    };
    const createdUser = await User.create(userObject);
    if (createdUser) { // user object created successfully
        res.status(201).json({ 
            user: createdUser.toUserResponse() 
        })
    } else {
        res.status(422).json({
            errors: {
                body: "Unable to register a user"
            }
        });
    }
}); 

module.exports = {
    registerUser,
    
}
