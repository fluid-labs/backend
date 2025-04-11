// Automation Controller
// Handles automation-related operations

import { Request, Response } from 'express';
import * as aoService from '../services/aoService';
import { Automation, AutomationCreateRequest } from '../types';

// Store automations
const automations: Record<string, Automation> = {};

// Create a new automation
export const createAutomation = async (req: Request, res: Response): Promise<Response> => {
  try {
    const processBuilderID = aoService.getProcessId();

    if (!processBuilderID) {
      return res
        .status(400)
        .json({ error: 'Not connected to AO platform' });
    }

    const { When, Then, Target, Name, Description } = req.body as AutomationCreateRequest & {
      When: string;
      Then: string;
      Target: string;
      Name?: string;
      Description?: string;
    };

    if (!When || !Then || !Target) {
      return res
        .status(400)
        .json({ error: 'When, Then, and Target are required' });
    }

    // Generate a unique ID for the automation
    const automationId = `auto-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    // Store the automation
    automations[automationId] = {
      id: automationId,
      name: Name || 'Unnamed Automation',
      description: Description || '',
      when: When,
      then: Then,
      target: Target,
      createdAt: new Date(),
      status: 'active'
    };

    // Send a message to the ProcessBuilder to create the automation
    const config = {
      When,
      Then,
      Target,
      Name: Name || 'Unnamed Automation',
      Description: Description || '',
    };

    try {
      // Send the message to the AO network
      const result = await aoService.sendMessage(
        processBuilderID,
        'CreateAutomation',
        JSON.stringify(config)
      );

      console.log(`Created automation on AO network: ${automationId}`);
      console.log(`AO response:`, result);

      return res.status(201).json({
        success: true,
        message: 'Automation created successfully',
        id: automationId,
        config,
      });
    } catch (aoError) {
      console.error('Error sending message to AO:', aoError);
      
      const error = aoError as Error;
      // Even if AO communication fails, we still return success since we stored the automation locally
      return res.status(201).json({
        success: true,
        message:
          'Automation created locally but AO communication failed',
        id: automationId,
        config,
        aoError: error.message,
      });
    }
  } catch (error) {
    console.error('Error creating automation:', error);
    return res.status(500).json({ error: 'Failed to create automation' });
  }
};

// Get all automations
export const getAutomations = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const processBuilderID = aoService.getProcessId();

    if (!processBuilderID) {
      return res
        .status(400)
        .json({ error: 'Not connected to AO platform' });
    }

    // Convert automations object to array
    const automationsList = Object.values(automations);

    return res.status(200).json(automationsList);
  } catch (error) {
    console.error('Error getting automations:', error);
    return res.status(500).json({ error: 'Failed to get automations' });
  }
};

// Get a specific automation
export const getAutomation = async (req: Request, res: Response): Promise<Response> => {
  try {
    const processBuilderID = aoService.getProcessId();

    if (!processBuilderID) {
      return res
        .status(400)
        .json({ error: 'Not connected to AO platform' });
    }

    const { id } = req.params;

    if (!automations[id]) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    return res.status(200).json(automations[id]);
  } catch (error) {
    console.error('Error getting automation:', error);
    return res.status(500).json({ error: 'Failed to get automation' });
  }
};

// Update an automation
export const updateAutomation = async (req: Request, res: Response): Promise<Response> => {
  try {
    const processBuilderID = aoService.getProcessId();

    if (!processBuilderID) {
      return res
        .status(400)
        .json({ error: 'Not connected to AO platform' });
    }

    const { id } = req.params;

    if (!automations[id]) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    const { When, Then, Target, Name, Description } = req.body as {
      When?: string;
      Then?: string;
      Target?: string;
      Name?: string;
      Description?: string;
    };

    // Update the automation
    automations[id] = {
      ...automations[id],
      name: Name || automations[id].name,
      description: Description || automations[id].description,
      when: When || automations[id].when,
      then: Then || automations[id].then,
      target: Target || automations[id].target,
      updatedAt: new Date(),
    };

    console.log(`Updated automation: ${id}`);

    return res.status(200).json(automations[id]);
  } catch (error) {
    console.error('Error updating automation:', error);
    return res.status(500).json({ error: 'Failed to update automation' });
  }
};

// Delete an automation
export const deleteAutomation = async (req: Request, res: Response): Promise<Response> => {
  try {
    const processBuilderID = aoService.getProcessId();

    if (!processBuilderID) {
      return res
        .status(400)
        .json({ error: 'Not connected to AO platform' });
    }

    const { id } = req.params;

    if (!automations[id]) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    // Store the automation for the response
    const deletedAutomation = automations[id];

    // Delete the automation
    delete automations[id];

    console.log(`Deleted automation: ${id}`);

    return res.status(200).json(deletedAutomation);
  } catch (error) {
    console.error('Error deleting automation:', error);
    return res.status(500).json({ error: 'Failed to delete automation' });
  }
};

interface TriggerRequest {
  action: string;
  data?: string;
}

// Trigger an automation
export const triggerAutomation = async (req: Request, res: Response): Promise<Response> => {
  try {
    const processBuilderID = aoService.getProcessId();

    if (!processBuilderID) {
      return res
        .status(400)
        .json({ error: 'Not connected to AO platform' });
    }

    const { id } = req.params;

    if (!automations[id]) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    const { action, data } = req.body as TriggerRequest;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    // Check if the action matches the automation's trigger
    if (action !== automations[id].when) {
      return res.status(400).json({
        error: `Action does not match automation trigger. Expected: ${automations[id].when}, Got: ${action}`,
      });
    }

    console.log(`Triggering automation on AO network: ${id}`);
    console.log(`  Action: ${action}`);
    console.log(`  Data: ${data || 'none'}`);

    try {
      // Send the message to the AO network
      const result = await aoService.sendMessage(
        id, // Send directly to the automation process
        action,
        data || ''
      );

      console.log(`Automation triggered on AO network: ${id}`);
      console.log(`AO response:`, result);

      const response = {
        success: true,
        message: 'Automation triggered successfully',
        id,
        action,
        result,
      };

      return res.status(200).json(response);
    } catch (aoError) {
      console.error('Error sending message to AO:', aoError);
      
      const error = aoError as Error;
      return res.status(500).json({
        success: false,
        message: 'Failed to trigger automation on AO network',
        id,
        action,
        error: error.message,
      });
    }
  } catch (error) {
    console.error('Error triggering automation:', error);
    return res.status(500).json({ error: 'Failed to trigger automation' });
  }
};
