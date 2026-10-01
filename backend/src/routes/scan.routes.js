const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scan.controller');
const upload = require('../middleware/upload');
const { optionalAuth } = require('../middleware/auth');

// Allow single photo or multiple drone photos (up to 10 at once)
router.post('/', optionalAuth, upload.array('photos', 10), scanController.processUpload);
router.get('/:id', scanController.getScanById);

module.exports = router;
