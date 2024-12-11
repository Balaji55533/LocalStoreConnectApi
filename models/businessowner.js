const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const jwt = require("jsonwebtoken");

// Sub-schema for City
const citySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String, // Optional code (e.g., postal code or state code)
        default: ""
    }
}, { _id: false }); // Disable _id generation for sub-documents

// Sub-schema for State
const stateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String, // Optional state code
        default: ""
    }
}, { _id: false });

// Sub-schema for Country
const countrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String, // Optional country code (ISO)
        default: ""
    }
}, { _id: false });

// Business Type Schema
const businessTypeSchema = new mongoose.Schema({
    id: { 
        type: mongoose.Schema.Types.ObjectId, 
        default: () => new mongoose.Types.ObjectId(),
    },
    name: {
        type: String,
        required: true,
    },
    code: {
        type: String, // Optional country code (ISO)
        default: ""
    }
}, { _id: false });

// Business Owner Schema
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
        type: citySchema, // Use the citySchema
        required: true
    },
    state: {
        type: stateSchema, // Use the stateSchema
        required: true
    },
    zipCode: {
        type: String,
        required: true
    },
    country: {
        type: countrySchema, // Use the countrySchema
        required: true
    },
    openingTime: {
        type: String,
        required: true 
    },
    closingTime: {
        type: String,
        required: true 
    },
    bookingDuration: {
        type: Number,
        required: true 
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
        type: [String], 
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
  s3Keys: { type: [String], default: [] }, 
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
        { expiresIn: "30d" }
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
