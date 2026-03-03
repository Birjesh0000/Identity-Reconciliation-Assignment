const express = require('express');
const router = express.Router();

// Routes placeholder
const identifyRoutes = require('./identify');
router.use('/identify', identifyRoutes);

module.exports = router;
