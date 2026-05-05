const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  type:        { type: String, enum: ['lost', 'found'], required: true },
  name:        { type: String, required: true, trim: true },
  category:    { type: String, required: true, enum: ['Electronics', 'Clothing', 'Bag / Backpack', 'ID / Card', 'Keys', 'Jewelry', 'Books / Notes', 'Sports Equipment', 'Other'] },
  color:       { type: String, trim: true },
  description: { type: String, required: true },
  location:    { type: String, required: true, trim: true },
  dateLostFound: { type: Date, required: true },
  image:       { type: String, default: null },   // filename stored in /public/uploads
  status:      { type: String, enum: ['active', 'claimed', 'resolved'], default: 'active' },
  reportedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contactEmail:{ type: String, trim: true },
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', itemSchema);
