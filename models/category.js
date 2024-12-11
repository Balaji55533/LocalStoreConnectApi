const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Define the schema
const CategorySchema = new mongoose.Schema({
  _id: Number, // Auto-incremented ID
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  neams: {
    type: String,
  },
  s3Keys: { type: [String], default: [] }, 
}, { _id: false }); // Disable default _id as we are using our custom ID

// Apply auto-increment plugin to the schema
CategorySchema.plugin(AutoIncrement, { id: 'category_id_counter', inc_field: '_id' });

// Create the model
const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;
