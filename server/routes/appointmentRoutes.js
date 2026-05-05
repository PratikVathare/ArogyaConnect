const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/auth');
const appointmentController = require('../controllers/appointmentController');

router.get('/my-appointments', authenticateUser, appointmentController.getMyAppointments);
router.post('/book', authenticateUser, appointmentController.bookAppointment);

module.exports = router;
