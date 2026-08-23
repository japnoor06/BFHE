const express = require('express');
const router = express.Router();
const { getTaxConfig, calculateTax, getUserTaxEstimate } = require('../controllers/taxController');
const { protect } = require('../middleware/auth');

// Public or protected route to get config and calculate
router.get('/config', getTaxConfig);
router.post('/calculate', calculateTax);
router.get('/estimate', protect, getUserTaxEstimate);

module.exports = router;
