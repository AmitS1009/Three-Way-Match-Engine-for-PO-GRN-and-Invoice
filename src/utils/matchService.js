const PO = require('../models/PO');
const GRN = require('../models/GRN');
const Invoice = require('../models/Invoice');

async function getMatchResult(poNumber) {
  try {
    // Find PO
    const po = await PO.findOne({ poNumber });
    if (!po) {
      return {
        poNumber,
        status: 'insufficient_documents',
        mismatchReasons: ['po_not_found'],
        documents: { po: null, grns: [], invoices: [] }
      };
    }

    // Find all GRNs for this PO
    const grns = await GRN.find({ poNumber });
    
    // Find all Invoices for this PO
    const invoices = await Invoice.find({ poNumber });

    // If no GRNs or Invoices, return insufficient documents
    if (grns.length === 0 && invoices.length === 0) {
      return {
        poNumber,
        status: 'insufficient_documents',
        mismatchReasons: [],
        documents: { po, grns: [], invoices: [] }
      };
    }

    // Initialize match status
    let status = 'matched';
    const mismatchReasons = [];
    
    // Create item maps for easier comparison
    const poItems = {};
    po.items.forEach(item => {
      poItems[item.itemCode] = {
        quantity: item.quantity,
        description: item.description
      };
    });

    // Check GRN quantities against PO
    const grnItemQuantities = {};
    grns.forEach(grn => {
      grn.items.forEach(item => {
        if (!grnItemQuantities[item.itemCode]) {
          grnItemQuantities[item.itemCode] = 0;
        }
        grnItemQuantities[item.itemCode] += item.receivedQuantity;
      });
    });

    // Check Invoice quantities against PO and GRN
    const invoiceItemQuantities = {};
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!invoiceItemQuantities[item.itemCode]) {
          invoiceItemQuantities[item.itemCode] = 0;
        }
        invoiceItemQuantities[item.itemCode] += item.quantity;
      });
    });

    // Validate GRN quantities
    Object.keys(grnItemQuantities).forEach(itemCode => {
      const poQuantity = poItems[itemCode] ? poItems[itemCode].quantity : null;
      const grnQuantity = grnItemQuantities[itemCode];
      
      if (!poQuantity && poQuantity !== 0) {
        mismatchReasons.push(`item_missing_in_po:${itemCode}`);
        status = 'mismatch';
      } else if (poQuantity !== null && grnQuantity > poQuantity) {
        mismatchReasons.push(`grn_qty_exceeds_po_qty:${itemCode}`);
        status = 'mismatch';
      }
    });

    // Validate Invoice quantities
    Object.keys(invoiceItemQuantities).forEach(itemCode => {
      const poQuantity = poItems[itemCode] ? poItems[itemCode].quantity : null;
      const grnQuantity = grnItemQuantities[itemCode] || 0;
      const invoiceQuantity = invoiceItemQuantities[itemCode];
      
      if (!poQuantity && poQuantity !== 0) {
        mismatchReasons.push(`item_missing_in_po:${itemCode}`);
        status = 'mismatch';
      } else if (poQuantity !== null && invoiceQuantity > poQuantity) {
        mismatchReasons.push(`invoice_qty_exceeds_po_qty:${itemCode}`);
        status = 'mismatch';
      } else if (invoiceQuantity > grnQuantity) {
        mismatchReasons.push(`invoice_qty_exceeds_grn_qty:${itemCode}`);
        status = 'mismatch';
      }
    });

    // Validate Invoice date against PO date
    invoices.forEach(invoice => {
      if (po.poDate && invoice.invoiceDate > po.poDate) {
        mismatchReasons.push('invoice_date_after_po_date');
        status = 'mismatch';
      }
    });

    // Check for duplicate PO (already handled in upload, but double-check)
    // This would be caught during upload, so we can skip here

    // Determine final status
    if (mismatchReasons.length > 0) {
      status = 'mismatch';
    } else if (
      (grns.length > 0 && Object.keys(poItems).length === Object.keys(grnItemQuantities).length &&
       Object.keys(poItems).every(itemCode => 
         poItems[itemCode].quantity === (grnItemQuantities[itemCode] || 0)
       )) &&
      (invoices.length > 0 && Object.keys(poItems).length === Object.keys(invoiceItemQuantities).length &&
       Object.keys(poItems).every(itemCode => 
         poItems[itemCode].quantity === (invoiceItemQuantities[itemCode] || 0)
       ))
    ) {
      status = 'matched';
    } else {
      status = 'partially_matched';
    }

    return {
      poNumber,
      status,
      mismatchReasons: [...new Set(mismatchReasons)], // Remove duplicates
      documents: {
        po: po.toObject ? po.toObject() : po,
        grns: grns.map(g => g.toObject ? g.toObject() : g),
        invoices: invoices.map(i => i.toObject ? i.toObject() : i)
      }
    };
  } catch (error) {
    console.error('Error in match service:', error);
    throw error;
  }
}

module.exports = { getMatchResult };
