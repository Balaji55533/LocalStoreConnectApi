const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const jwt = require("jsonwebtoken");

const businessOwner = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        lowercase: true,
        unique: true,
        match: [/\S+@\S+\.\S+/, 'is invalid'],
        index: true,
        required: function() {
            return !this.phoneNumber;  // If email is not provided, phoneNumber is required
        }
    },
    phoneNumber: {
        type: String,
        unique: true,
        match: [/^[0-9]{10}$/, 'is invalid'],  // Assuming a 10-digit phone number
        required: function() {
            return !this.email;  // If phoneNumber is not provided, email is required
        }
    },
    address: {
        type: String,
        default: ""
    },
    gstnNumber: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        default: ""
    },
   
}, {
    timestamps: true
});

businessOwner.plugin(uniqueValidator);

// Generate access token for a user
businessOwner.methods.generateAccessToken = function() {
    const accessToken = jwt.sign({
            "user": {
                "id": this._id,
                "email": this.email,
                "phoneNumber": this.phoneNumber
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1d" }
    );
    return accessToken;
}

// Return user response for API
businessOwner.methods.toUserResponse = function() {
    return {
        username: this.username,
        email: this.email,
        phoneNumber: this.phoneNumber,
        bio: this.bio,
        image: this.image,
        token: this.generateAccessToken(),
        address:this.address
    };
};

// Return user profile JSON
businessOwner.methods.toProfileJSON = function(user) {
    return {
        username: this.username,
        bio: this.bio,
        image: this.image,
        following: user ? user.isFollowing(this._id) : false
    };
};





module.exports = mongoose.model('BusinessOwner', businessOwner);
