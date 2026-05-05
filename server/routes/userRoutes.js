const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/auth');
const authController = require('../controllers/authController');

// Public Auth Routes
router.post('/signup', authController.register);
router.post('/login', authController.login);

// Protected Profile Route Example
router.get('/profile', authenticateUser, (req, res) => {
  res.json({
    message: 'Access granted to protected route',
    user: req.user
  });
});

module.exports = router;
