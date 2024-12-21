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
    },
    isAdmin: { 
        type: Boolean,
        default: true 
    },
    token: {
        type: String,
    },
}, {
    timestamps: true
});

// Add unique validator plugin
businessOwnerSchema.plugin(uniqueValidator);


// Method to generate JWT token
businessOwnerSchema.methods.generateJWT = function() {
    const accessToken = jwt.sign({
        "user": {
            "id": this._id,
            "email": this.email,
            "phoneNumber": this.phoneNumber
        }
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "30d" }
);
return accessToken;
};


 
// Export the model
module.exports = mongoose.model('BusinessOwner', businessOwnerSchema);
