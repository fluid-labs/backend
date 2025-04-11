// AO Controller
// Handles interactions with the AO platform

import { Request, Response } from 'express';
import * as aoService from '../services/aoService';
import { APIError } from '../types';

// Connect to the AO platform
export const connectToAO = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { processId, emailBotId } = req.body;

    if (!processId) {
      return res.status(400).json({ error: 'Process ID is required' });
    }

    // Connect to AO using the service
    const result = await aoService.connectToAO(processId, emailBotId);

    if (!result.success) {
      return res
        .status(500)
        .json({ error: 'Failed to connect to AO platform' });
    }

    return res.status(200).json({
      success: true,
      message: 'Connected to AO platform',
      processId: result.processId,
      emailBotId: result.emailBotId,
    });
  } catch (error) {
    console.error('Error connecting to AO:', error);
    return res
      .status(500)
      .json({ error: 'Failed to connect to AO platform' });
  }
};

// Disconnect from the AO platform
export const disconnectFromAO = async (_req: Request, res: Response): Promise<Response> => {
  try {
    // Reset the process IDs (using the service)
    // This is a mock implementation since we don't have a real disconnect method
    
    console.log('Disconnected from AO platform');

    return res.status(200).json({
      success: true,
      message: 'Disconnected from AO platform',
    });
  } catch (error) {
    console.error('Error disconnecting from AO:', error);
    return res
      .status(500)
      .json({ error: 'Failed to disconnect from AO platform' });
  }
};

// Get the status of the AO platform
export const getStatus = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const processBuilderID = aoService.getProcessId();
    const emailBotID = aoService.getEmailBotId();
    
    if (!processBuilderID) {
      return res
        .status(400)
        .json({ error: 'Not connected to AO platform' });
    }

    // In a real implementation, this would query the AO platform for status
    const status = {
      connected: !!processBuilderID,
      processId: processBuilderID,
      emailBotId: emailBotID,
    };

    return res.status(200).json(status);
  } catch (error) {
    console.error('Error getting AO status:', error);
    return res.status(500).json({ error: 'Failed to get AO status' });
  }
};

interface Target {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// Get available targets
export const getTargets = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const processBuilderID = aoService.getProcessId();
    const emailBotID = aoService.getEmailBotId();
    
    if (!processBuilderID) {
      return res
        .status(400)
        .json({ error: 'Not connected to AO platform' });
    }

    // In a real implementation, this would query the AO platform for targets
    const targets: Target[] = [
      {
        id: emailBotID || '',
        name: 'Email Bot',
        description: 'Sends emails and notifications',
        icon: 'bi-envelope',
      },
      {
        id: processBuilderID,
        name: 'Process Builder',
        description: 'Creates and manages automations',
        icon: 'bi-gear',
      },
    ];

    return res.status(200).json(targets);
  } catch (error) {
    console.error('Error getting targets:', error);
    return res.status(500).json({ error: 'Failed to get targets' });
  }
};

interface MessageRequest {
  target: string;
  action: string;
  data?: string;
  tags?: Record<string, string>;
}

// Send a message to an AO process
export const sendMessage = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { target, action, data, tags } = req.body as MessageRequest;

    if (!target) {
      return res.status(400).json({ error: 'Target is required' });
    }

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    console.log(`Sending message to ${target} on AO network:`);
    console.log(`  Action: ${action}`);
    console.log(`  Data: ${data || 'none'}`);
    console.log(`  Tags: ${JSON.stringify(tags || {})}`);

    try {
      // Send the message to the AO network
      const result = await aoService.sendMessage(
        target,
        action,
        data || ''
      );

      console.log(`Message sent to AO network successfully`);
      console.log(`AO response:`, result);

      const response = {
        success: true,
        message: 'Message sent to AO network',
        target,
        action,
        result,
        timestamp: new Date().toISOString(),
      };

      return res.status(200).json(response);
    } catch (aoError) {
      console.error('Error sending message to AO:', aoError);
      
      const error = aoError as Error;
      return res.status(500).json({
        success: false,
        message: 'Failed to send message to AO network',
        target,
        action,
        error: error.message,
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
};

interface Message {
  from: string;
  action: string;
  data: string;
  timestamp: string;
}

// Get messages from an AO process
export const getMessages = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { processId } = req.params;

    if (!processId) {
      return res.status(400).json({ error: 'Process ID is required' });
    }

    // In a real implementation, this would query the AO platform for messages
    const messages: Message[] = [
      {
        from: 'system',
        action: 'ProcessStarted',
        data: 'Process started successfully',
        timestamp: new Date().toISOString(),
      },
    ];

    return res.status(200).json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    return res.status(500).json({ error: 'Failed to get messages' });
  }
};
