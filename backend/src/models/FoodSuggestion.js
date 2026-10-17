const mongoose = require('mongoose');

const foodSuggestionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dishName: { type: String, required: true, trim: true, maxlength: 120 },
  preferredDay: { type: String, default: 'Any day', trim: true },
  notes: { type: String, default: '', maxlength: 1000 },
  status: { type: String, enum: ['Pending', 'Reviewed', 'Accepted', 'Declined'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('FoodSuggestion', foodSuggestionSchema);
