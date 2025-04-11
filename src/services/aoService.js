// AO Service
// Handles direct interaction with the AO network

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Store AO process information
let processBuilderID = null;
let emailBotID = null;
let aosProcess = null;

// Initialize AO connection
const initializeAO = async () => {
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
const connectToAO = async (processId, emailBotId) => {
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
    return { success: false, error: error.message };
  }
};

// Send a message to an AO process
const sendMessage = async (target, action, data) => {
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
    return new Promise((resolve, reject) => {
      const aos = spawn('aos', ['-e', scriptPath]);
      
      let output = '';
      
      aos.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`AOS output: ${data.toString()}`);
      });
      
      aos.stderr.on('data', (data) => {
        console.error(`AOS error: ${data.toString()}`);
      });
      
      aos.on('close', (code) => {
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
          reject(new Error(`AOS process exited with code ${code}`));
        }
      });
    });
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};

// Get process IDs
const getProcessId = () => processBuilderID;
const getEmailBotId = () => emailBotID;

module.exports = {
  connectToAO,
  sendMessage,
  getProcessId,
  getEmailBotId
};
