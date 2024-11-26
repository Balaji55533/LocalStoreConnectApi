const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Define the schema
const SubCategorySchema = new mongoose.Schema({
  _id: Number, // Auto-incremented ID
  name: {
    type: String,
    required: true,
  },
  categoryId: {
    type: Number,
    required: true,
  },
  neams: {
    type: String,
  },
}, { _id: false }); // Disable default _id as we are using our custom ID

// Apply auto-increment plugin to the schema
SubCategorySchema.plugin(AutoIncrement, { id: 'sub_category_id_counter', inc_field: '_id' });

// Create the model
const Subcategory = mongoose.model('Subcategory', SubCategorySchema);

module.exports = Subcategory;
