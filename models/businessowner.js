const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Import bcrypt for hashing

// Business Owner Schema
const businessOwnerSchema = new mongoose.Schema({
    email: {
        type: String,
        lowercase: true,
        unique: true,
        match: [/\S+@\S+\.\S+/, 'is invalid'],
        index: true,
        required: function() {
            return !this.phoneNumber;  
        }
    },
    phoneNumber: {
        type: String,
        unique: true,
        match: [/^[0-9]{10}$/, 'is invalid'],
        required: function() {
            return !this.email;  
        }
    },
    OTP: {
        type: String,
        unique: true,
    }
}, {
    timestamps: true
});

// Add unique validator plugin
businessOwnerSchema.plugin(uniqueValidator);

// Hash OTP before saving
businessOwnerSchema.pre('save', async function(next) {
    if (this.isModified('OTP')) {
        try {
            // Hash OTP using bcrypt with a salt round of 10
            const salt = await bcrypt.genSalt(10);
            this.OTP = await bcrypt.hash(this.OTP, salt);
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Method to generate JWT token
businessOwnerSchema.methods.generateJWT = function() {
    const payload = {
        id: this._id, // Include the user's unique ID
        email: this.email || null, // Include email if available
        phoneNumber: this.phoneNumber || null // Include phone number if available
    };

    // Sign and return the token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Use an environment variable for the secret key
    return token;
};

// Verify OTP
businessOwnerSchema.methods.verifyOTP = async function(inputOTP) {
    return bcrypt.compare(inputOTP, this.OTP); // Compare input OTP with hashed OTP
};

// Export the model
module.exports = mongoose.model('BusinessOwner', businessOwnerSchema);
