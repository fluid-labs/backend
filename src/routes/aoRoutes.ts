// AO Routes
// Routes for interacting with the AO platform

import express from 'express';
import * as aoController from '../controllers/aoController';

const router = express.Router();

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

export default router;
