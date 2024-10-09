const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const jwt = require("jsonwebtoken");

const businessTypeSchema = new mongoose.Schema({
    id: { 
        type: mongoose.Schema.Types.ObjectId, // Unique identifier
        default: () => new mongoose.Types.ObjectId(), // Automatically generate a new ObjectId
    },
    type: {
        type: String,
        required: true,
        enum: ['restaurant', 'retail', 'service', 'other'], // Add other types as necessary
    },
}, { _id: false });

const businessOwnerSchema = new mongoose.Schema({
    username: {    
        type: String, 
        required: true,
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
    // New Fields
    businessName: {
        type: String,
        required: true
    },
    businessType: businessTypeSchema,
    description: {
        type: String,
        default: ""
    },
    address: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    zipCode: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    openingTime: {
        type: String,
        required: true // Assuming this will be stored as a string, e.g., '09:00 AM'
    },
    closingTime: {
        type: String,
        required: true // Assuming this will be stored as a string, e.g., '09:00 PM'
    },
    bookingDuration: {
        type: Number,
        required: true // Duration in minutes
    },
    maxBookings: {
        type: Number,
        required: true
    },
    cancellationPolicy: {
        type: String,
        default: ""
    },
    website: {
        type: String,
        default: ""
    },
    socialMediaLinks: {
        type: [String], // Array of strings for multiple links
        default: []
    },
    profilePicture: {
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

businessOwnerSchema.plugin(uniqueValidator);

// Generate access token for a user
businessOwnerSchema.methods.generateAccessToken = function() {
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
businessOwnerSchema.methods.toUserResponse = function() {
    return {
        username: this.username,
        email: this.email,
        phoneNumber: this.phoneNumber,
        bio: this.bio,
        profilePicture: this.profilePicture,
        token: this.generateAccessToken(),
        address: this.address,
        businessName: this.businessName,
        businessType: this.businessType,
        description: this.description,
        city: this.city,
        state: this.state,
        zipCode: this.zipCode,
        country: this.country,
        openingTime: this.openingTime,
        closingTime: this.closingTime,
        bookingDuration: this.bookingDuration,
        maxBookings: this.maxBookings,
        cancellationPolicy: this.cancellationPolicy,
        website: this.website,
        socialMediaLinks: this.socialMediaLinks,
        _id: this._id
    };
};

// Return user profile JSON
businessOwnerSchema.methods.toProfileJSON = function(user) {
    return {
        username: this.username,
        bio: this.bio,
        profilePicture: this.profilePicture,
        following: user ? user.isFollowing(this._id) : false
    };
};

module.exports = mongoose.model('BusinessOwner', businessOwnerSchema);
