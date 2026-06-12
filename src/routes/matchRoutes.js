const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

// Get match result by PO number
router.get('/:poNumber', matchController.getMatchByPoNumber);

module.exports = router;
