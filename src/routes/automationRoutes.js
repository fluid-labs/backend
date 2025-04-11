// Automation Routes
// Routes for managing automations

const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');

// Create a new automation
router.post('/', automationController.createAutomation);

// Get all automations
router.get('/', automationController.getAutomations);

// Get a specific automation
router.get('/:id', automationController.getAutomation);

// Update an automation
router.put('/:id', automationController.updateAutomation);

// Delete an automation
router.delete('/:id', automationController.deleteAutomation);

// Trigger an automation
router.post('/:id/trigger', automationController.triggerAutomation);

module.exports = router;
