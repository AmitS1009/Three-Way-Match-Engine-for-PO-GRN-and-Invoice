const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true },
  description: { type: String },
  receivedQuantity: { type: Number, required: true }
});

const GRNschema = new mongoose.Schema({
  grnNumber: { type: String, required: true, unique: true },
  poNumber: { type: String, required: true },
  grnDate: { type: Date, required: true },
  items: [itemSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GRN', GRNschema);
