const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  item:        { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  claimedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message:     { type: String, required: true },   // claimant's proof/description
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote:   { type: String, default: '' },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Claim', claimSchema);
