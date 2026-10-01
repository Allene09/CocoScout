const express = require('express');
const router = express.Router();
const treeController = require('../controllers/tree.controller');

router.get('/', treeController.getAllTrees);
router.get('/:id', treeController.getTreeById);
router.patch('/:id', treeController.updateTree);

module.exports = router;
