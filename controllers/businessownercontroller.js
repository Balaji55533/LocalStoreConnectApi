
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const businessowner = require('../models/businessowner');
const registerBusinessOwner = asyncHandler(async (req, res) => {
    const { user } = req.body;

    // Confirm required data
    if (!user || !user.username || !user.password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        // Hash password
        const hashedPwd = await bcrypt.hash(user.password, 10); // salt rounds

        // Build user object, conditionally adding fields
        const userObject = {
            username: user.username,
            password: hashedPwd,
        };

        // Add optional fields if provided
        if (user.email) {
            userObject.email = user.email;
        }

        if (user.phoneNumber) {
            userObject.phoneNumber = user.phoneNumber;
        }

        if (user.address) {
            userObject.address = user.address;
        }

        if (user.gstnNumber) {
            userObject.gstnNumber = user.gstnNumber;
        }

        // Create user
        const createdUser = await businessowner.create(userObject);

        if (createdUser) {
            res.status(201).json({
                user: createdUser.toUserResponse()
            });
        } else {
            res.status(422).json({
                errors: {
                    body: "Unable to register a user"
                }
            });
        }
    } catch (error) {
        // Handle duplicate key error (MongoError code 11000)
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyValue).find(key => error.keyValue[key]);
        
            let errorMessage;
        
            if (duplicateField === 'username') {
                errorMessage = "Username already exists";
            } else if (duplicateField === 'email') {
                errorMessage = "Email already exists";
            } else if (duplicateField === 'phoneNumber') {
                errorMessage = "Phone number already exists";
            } else {
                errorMessage = error.keyValue;
            }
        
            return res.status(409).json({ message: errorMessage });
        }
        
        // Handle other errors
        res.status(500).json({ message: "An error occurred during registration" });
    }
});


const loginBusinessOwner = asyncHandler(async (req, res) => {
    const { usernameOrEmailOrPhone, password } = req.body;

    // Confirm that both username/email/phone and password are provided
    if (!usernameOrEmailOrPhone || !password) {
        return res.status(400).json({ message: "Username/Email/Phone and password are required" });
    }

    try {
        // Find the user by username, email, or phone number
        const user = await businessowner.findOne({
            $or: [
                { username: usernameOrEmailOrPhone },
                { email: usernameOrEmailOrPhone },
                { phoneNumber: usernameOrEmailOrPhone }
            ]
        });

        // Check if the user exists
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Validate the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate a JWT token
        const token = user.generateAccessToken();

        // Return user data along with the token
        res.status(200).json({
            user: user.toUserResponse(),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred during login" });
    }
});



module.exports = {
    registerBusinessOwner, 
    loginBusinessOwner
    
}
 