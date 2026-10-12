const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');

router.get('/nearby', hospitalController.getNearbyHospitals);
router.get('/compare', hospitalController.getNearbyHospitals);

module.exports = router;
