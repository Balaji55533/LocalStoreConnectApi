
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const businessowner = require('../models/businessowner');
const NodeCache = require("node-cache");
const AWS = require('aws-sdk');
const myCache = new NodeCache();
myCache.flushAll();
// Create a cache instance with a default TTL of 10 minutes
const userCache = new NodeCache({ stdTTL: 600 });
const multer = require('multer');


function checkAWSCredentials() {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('AWS credentials are not set in environment variables');
    }
}

// Check credentials before configuring AWS
checkAWSCredentials();
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'ap-south-1'
});

const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    signatureVersion: 'v4'
});


const registerBusinessOwner = asyncHandler(async (req, res) => {
    const { user } = req.body;

    // Confirm required data
    if (!user || !user.username || !user.password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    try {
        // Hash password
        const hashedPwd = await bcrypt.hash(user.password, 10); // salt rounds

        // Build user object with optional fields
        const userObject = {
            username: user.username,
            password: hashedPwd,
            ...user.email && { email: user.email },
            ...user.phoneNumber && { phoneNumber: user.phoneNumber },
            ...user.address && { address: user.address },
            ...user.gstnNumber && { gstnNumber: user.gstnNumber },
            ...user.businessName && { businessName: user.businessName },
            ...user.businessType && { 
                businessType: { 
                    name: user.businessType.name,
                    code: user.businessType.code,
                } 
            },
            ...user.description && { description: user.description },
            ...user.city && {
                city: {
                    name: user.city.name,
                    zipCode: user.city.zipCode // if you want to include zipCode as part of city
                }
            },
            ...user.state && {
                state: {
                    name: user.state.name,
                    code: user.state.code // you can include a state code if required
                }
            },
            ...user.country && {
                country: {
                    name: user.country.name,
                    code: user.country.code // you can include a country code if required
                }
            },
            ...user.zipCode && { zipCode: user.zipCode },
            ...user.openingTime && { openingTime: user.openingTime },
            ...user.closingTime && { closingTime: user.closingTime },
            ...user.bookingDuration && { bookingDuration: user.bookingDuration },
            ...user.maxBookings && { maxBookings: user.maxBookings },
            ...user.cancellationPolicy && { cancellationPolicy: user.cancellationPolicy },
            ...user.website && { website: user.website },
            ...user.socialMediaLinks && { socialMediaLinks: user.socialMediaLinks },
        };
        

     
 
        // Create user
        const createdUser = await businessowner.create(userObject);

        if (createdUser) {
            // Check if createdUser is valid and has the method
            return res.status(201).json({
                user: createdUser.toUserResponse ? createdUser.toUserResponse() : createdUser,
                message: "User registered successfully."
            });
        }

    } catch (error) {
        // Handle validation error
        if (error.name === 'ValidationError') {
            const errors = Object.keys(error.errors).map(key => ({
                field: key,
                message: error.errors[key].message
            }));
            return res.status(400).json({
                message: "Validation errors occurred.",
                errors
            });
        }

        // Handle duplicate key error (MongoError code 11000)
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyValue).find(key => error.keyValue[key]);
            const errorMessage = {
                username: "Username already exists",
                email: "Email already exists",
                phoneNumber: "Phone number already exists",
            }[duplicateField] || "Duplicate key error";

            return res.status(409).json({ message: errorMessage });
        }

        // Handle other errors
        return res.status(500).json({ message: "An error occurred during registration", error });
    }
});

const loginBusinessOwner = asyncHandler(async (req, res) => {
    const { usernameOrEmailOrPhone, password } = req.body;

    // Confirm that both username/email/phone and password are provided
    if (!usernameOrEmailOrPhone || !password) {
        return res.status(400).json({ message: "Username/Email/Phone and password are required" });
    }

    try {
        // Check the cache for the user
        const cachedUser = userCache.get(usernameOrEmailOrPhone);
        
        // If the user is in the cache, use it
        let user;
        if (cachedUser) {
            user = cachedUser;
        } else {
            // Find the user by username, email, or phone number
            user = await businessowner.findOne({
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

            // Cache the user for future requests (Mongoose document)
            userCache.set(usernameOrEmailOrPhone, user);
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
            token // Include the token in the response
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred during login" });
    }
});

const uploadUserFile = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const file = req.file;
    // Check if userId and file are present
    if (!userId || !file) {
        return res.status(400).json({ message: "User ID and file are required." });
    }

    try {
        const credentials = await AWS.config.credentials.getPromise();
        console.log("AWS Credentials loaded successfully");
        console.log("AWS Region:", AWS.config.region);
    } catch (credError) {
        console.error("Error loading AWS credentials:", credError);
        return res.status(500).json({ 
            message: "Failed to load AWS credentials",
            error: credError.message
        });
    }

    try {
        // Find the user in the database
        const user = await businessowner.findById(userId);
        if (!user) {
            console.log("User not found:", userId);
            return res.status(404).json({ message: "User not found." });
        }

        // Prepare file for upload
        const fileContent = file.buffer;
        const fileExtension = file.originalname.split('.').pop();
        const key = `user-files/${userId}-${Date.now()}.${fileExtension}`;
        
        const params = {
            Bucket: "localstoreconnect",
            Key: key,
            Body: fileContent,
            ContentType: file.mimetype,
            ACL: 'public-read', 
        };

       

        // Upload to S3
        const s3Response = await s3.upload(params).promise();

        // Update the user with the file URL
        user.profilePicture = s3Response.Location;
        await user.save();

        return res.status(200).json({
            message: "File uploaded successfully.",
            fileUrl: s3Response.Location
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return res.status(500).json({ 
            message: "An error occurred while uploading the file.",
            error: error.message,
            stack: error.stack
        });
    }
});


const businessOwnerList = asyncHandler(async (req, res) => {
    try {
      // Check if a post by this user already exists
      const user = await businessowner.find({}).lean();
  
        res.status(201).json({
          message: 'Your Data generated!',
          data: user,
          success:true
        });
    } catch (error) {
      res.status(500).json({
        message: 'Error storing dynamic data',
        error: error.message,
      });
    }
  });
module.exports = {
    registerBusinessOwner, 
    loginBusinessOwner,
    uploadUserFile,
    businessOwnerList
    
}
 