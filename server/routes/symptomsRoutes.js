const express = require('express');
const router = express.Router();
const symptomsController = require('../controllers/symptomsController');

// Symptom analysis route (open for triage assistance)
router.post('/', symptomsController.analyzeSymptoms);

module.exports = router;
