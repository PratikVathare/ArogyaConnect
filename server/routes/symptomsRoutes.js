const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/auth');
const symptomsController = require('../controllers/symptomsController');

// Protected route
router.post('/', authenticateUser, symptomsController.analyzeSymptoms);

module.exports = router;
