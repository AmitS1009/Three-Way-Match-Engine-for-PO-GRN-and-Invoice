const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true },
  description: { type: String },
  quantity: { type: Number, required: true }
});

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  poNumber: { type: String, required: true },
  invoiceDate: { type: Date, required: true },
  items: [itemSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
