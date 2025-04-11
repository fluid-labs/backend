// Automation Routes
// Routes for managing automations

import express from 'express';
import * as automationController from '../controllers/automationController';

const router = express.Router();

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

export default router;
