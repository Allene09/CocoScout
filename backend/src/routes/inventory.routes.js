const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');

router.get('/summary', inventoryController.getInventorySummary);
router.get('/harvest-ready', inventoryController.getHarvestReadyTrees);

module.exports = router;
