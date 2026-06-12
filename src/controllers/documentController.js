const PO = require('../models/PO');
const GRN = require('../models/GRN');
const Invoice = require('../models/Invoice');
const { parseDocument } = require('../utils/geminiService');
const mongoose = require('mongoose');

async function uploadDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { documentType } = req.body;
    if (!documentType || !['po', 'grn', 'invoice'].includes(documentType)) {
      return res.status(400).json({ error: 'Invalid or missing document type' });
    }

    // Parse document using Gemini
    const parsedData = await parseDocument(
      req.file.buffer,
      req.file.mimetype,
      documentType
    );

    // Store parsed data in appropriate collection
    let document;
    switch (documentType) {
      case 'po':
        // Check if PO already exists
        const existingPO = await PO.findOne({ poNumber: parsedData.poNumber });
        if (existingPO) {
          return res.status(409).json({ error: 'PO with this number already exists' });
        }
        document = new PO(parsedData);
        break;
        
      case 'grn':
        // Check if GRN already exists
        const existingGRN = await GRN.findOne({ grnNumber: parsedData.grnNumber });
        if (existingGRN) {
          return res.status(409).json({ error: 'GRN with this number already exists' });
        }
        document = new GRN(parsedData);
        break;
        
      case 'invoice':
        // Check if Invoice already exists
        const existingInvoice = await Invoice.findOne({ invoiceNumber: parsedData.invoiceNumber });
        if (existingInvoice) {
          return res.status(409).json({ error: 'Invoice with this number already exists' });
        }
        document = new Invoice(parsedData);
        break;
    }

    await document.save();

    // Trigger matching logic (we'll implement this in match service)
    // For now, we'll just return the saved document
    
    res.status(201).json({
      message: `${documentType.toUpperCase()} uploaded and parsed successfully`,
      documentId: document._id,
      parsedData: parsedData
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

async function getDocumentById(req, res) {
  try {
    const { id } = req.params;
    
    // Try to find document in any of the collections
    let document = await PO.findById(id);
    if (!document) document = await GRN.findById(id);
    if (!document) document = await Invoice.findById(id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.status(200).json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  uploadDocument,
  getDocumentById
};
