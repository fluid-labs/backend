// AO Service
// Handles direct interaction with the AO network

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { APIError } from '../types';

// Store AO process information
let processBuilderID: string | null = null;
let emailBotID: string | null = null;
let aosProcess: any = null;

interface AOConnectionResult {
  success: boolean;
  processId?: string;
  emailBotId?: string;
  error?: string;
}

interface MessageResult {
  success: boolean;
  target: string;
  action: string;
  output: string;
}

// Initialize AO connection
const initializeAO = async (): Promise<boolean> => {
  try {
    console.log('Initializing AO connection...');
    
    // Create a temporary directory for AO scripts
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ao-'));
    console.log(`Created temporary directory: ${tempDir}`);
    
    // Create a simple AO script to send messages
    const scriptPath = path.join(tempDir, 'send-message.lua');
    fs.writeFileSync(scriptPath, `
      -- AO Message Sender
      local target = arg[1]
      local action = arg[2]
      local data = arg[3]
      
      print("Sending message to: " .. target)
      print("Action: " .. action)
      print("Data: " .. (data or ""))
      
      Send({
        Target = target,
        Action = action,
        Data = data
      })
      
      print("Message sent successfully")
    `);
    
    console.log('AO message script created');
    return true;
  } catch (error) {
    console.error('Failed to initialize AO:', error);
    return false;
  }
};

// Connect to AO process
const connectToAO = async (processId: string, emailBotId: string): Promise<AOConnectionResult> => {
  try {
    processBuilderID = processId;
    emailBotID = emailBotId;
    
    console.log(`Connected to ProcessBuilder: ${processBuilderID}`);
    console.log(`Connected to EmailBot: ${emailBotID}`);
    
    // Initialize AO connection
    await initializeAO();
    
    return {
      success: true,
      processId: processBuilderID,
      emailBotId: emailBotID
    };
  } catch (error) {
    console.error('Failed to connect to AO:', error);
    const err = error as Error;
    return { success: false, error: err.message };
  }
};

// Send a message to an AO process
const sendMessage = async (target: string, action: string, data?: string): Promise<MessageResult> => {
  try {
    console.log(`Sending message to ${target}:`);
    console.log(`  Action: ${action}`);
    console.log(`  Data: ${data || "none"}`);
    
    // Create a temporary script to send the message
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ao-msg-'));
    const scriptPath = path.join(tempDir, 'send-message.lua');
    
    fs.writeFileSync(scriptPath, `
      -- AO Message Sender
      print("Sending message to: ${target}")
      print("Action: ${action}")
      print("Data: ${data || ""}")
      
      Send({
        Target = "${target}",
        Action = "${action}",
        Data = [[${data || ""}]]
      })
      
      print("Message sent successfully")
    `);
    
    // Execute the script with AOS
    return new Promise<MessageResult>((resolve, reject) => {
      const aos = spawn('aos', ['-e', scriptPath]);
      
      let output = '';
      
      aos.stdout.on('data', (data: Buffer) => {
        output += data.toString();
        console.log(`AOS output: ${data.toString()}`);
      });
      
      aos.stderr.on('data', (data: Buffer) => {
        console.error(`AOS error: ${data.toString()}`);
      });
      
      aos.on('close', (code: number | null) => {
        // Clean up the temporary directory
        fs.rmSync(tempDir, { recursive: true, force: true });
        
        if (code === 0) {
          console.log('Message sent successfully');
          resolve({
            success: true,
            target,
            action,
            output
          });
        } else {
          console.error(`AOS process exited with code ${code}`);
          reject(new APIError(`AOS process exited with code ${code}`, 500));
        }
      });
    });
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};

// Get process IDs
const getProcessId = (): string | null => processBuilderID;
const getEmailBotId = (): string | null => emailBotID;

export {
  connectToAO,
  sendMessage,
  getProcessId,
  getEmailBotId
};
