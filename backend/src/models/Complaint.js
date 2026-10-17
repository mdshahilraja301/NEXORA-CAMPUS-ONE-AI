const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true, enum: ['Electrical', 'Water Leakage', 'Wi-Fi', 'Cleanliness', 'Broken Furniture', 'Mess', 'Other'] },
  location: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
  adminNote: { type: String, default: '', maxlength: 1000 }
}, { timestamps: true });

complaintSchema.pre('validate', function(next) {
  if (!this.complaintId) this.complaintId = `NC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
