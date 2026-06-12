const express = require('express');
const router = express.Router();
const multer = require('multer');
const documentController = require('../controllers/documentController');

// Configure multer for memory storage (to pass buffer to Gemini)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload document endpoint
router.post('/upload', upload.single('file'), documentController.uploadDocument);

// Get document by ID
router.get('/:id', documentController.getDocumentById);

module.exports = router;
