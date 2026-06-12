const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true },
  description: { type: String },
  quantity: { type: Number, required: true }
});

const poSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true },
  vendorName: { type: String, required: true },
  poDate: { type: Date, required: true },
  items: [itemSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PO', poSchema);
