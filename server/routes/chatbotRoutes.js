const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

router.post('/message', chatbotController.handleChatMessage);
router.post('/', chatbotController.handleChatMessage);
router.get('/starters', chatbotController.getChatStarters);

module.exports = router;
