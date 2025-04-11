// AO Routes
// Routes for interacting with the AO platform

const express = require('express');
const router = express.Router();
const aoController = require('../controllers/aoController');

// Connect to the AO platform
router.post('/connect', aoController.connectToAO);

// Disconnect from the AO platform
router.post('/disconnect', aoController.disconnectFromAO);

// Get the status of the AO platform
router.get('/status', aoController.getStatus);

// Get available targets
router.get('/targets', aoController.getTargets);

// Send a message to an AO process
router.post('/send', aoController.sendMessage);

// Get messages from an AO process
router.get('/messages/:processId', aoController.getMessages);

module.exports = router;
