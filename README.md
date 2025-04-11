# AO Process Builder Backend

This directory contains the TypeScript Express.js API server for the AO Process Builder.

## Directory Structure

-   **src/** - Source code
    -   **controllers/** - API controllers
    -   **routes/** - API routes
    -   **services/** - Service layer for external interactions
    -   **types/** - TypeScript type definitions
    -   **index.ts** - Main entry point
-   **dist/** - Compiled JavaScript output

## Detailed Deployment Guide

### Prerequisites

1. Make sure you have Node.js (v14 or higher) installed on your system
2. Ensure you have npm (v6 or higher) installed
3. Make sure the AO platform is installed and running
4. Ensure you have deployed the core AO Process Builder components (see the core README.md)
5. Have the Process IDs for the ProcessBuilder and EmailBot ready

### Step 1: Install Dependencies

First, install all the required dependencies:

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install
```

This will install all the necessary packages defined in package.json, including Express, TypeScript, and other dependencies.

### Step 2: Build the TypeScript Code

Compile the TypeScript code to JavaScript:

```bash
# Build the TypeScript code
npm run build
```

This will compile all the TypeScript files in the `src/` directory and output the JavaScript files to the `dist/` directory.

### Step 3: Configure Environment Variables (Optional)

You can configure the server port and other settings using environment variables:

```bash
# Create a .env file
touch .env

# Add environment variables
echo "PORT=3001" >> .env
```

### Step 4: Start the Server

Start the Express server:

```bash
# Start the server
npm start
```

Alternatively, you can use the start-server.sh script:

```bash
# Make the script executable
chmod +x start-server.sh

# Run the script
./start-server.sh
```

For development with auto-reload:

```bash
# Start the server in development mode
npm run dev
```

### Step 5: Verify the Server is Running

Check that the server is running by accessing the health check endpoint:

```bash
# Using curl
curl http://localhost:3001/api/health

# Expected response
{"status":"ok","timestamp":"2023-06-01T12:00:00.000Z"}
```

### Step 6: Connect to the AO Process Builder

Before you can use the API, you need to connect to the AO Process Builder:

```bash
# Using curl
curl -X POST -H "Content-Type: application/json" -d '{"processId":"YOUR_PROCESSBUILDER_ID","emailBotId":"YOUR_EMAILBOT_ID"}' http://localhost:3001/api/connect

# Replace YOUR_PROCESSBUILDER_ID and YOUR_EMAILBOT_ID with the actual Process IDs
# from the core deployment
```

You should receive a response confirming the connection:

```json
{
    "success": true,
    "message": "Connected to AO platform",
    "processId": "YOUR_PROCESSBUILDER_ID",
    "emailBotId": "YOUR_EMAILBOT_ID"
}
```

### Step 7: Verify the Connection

Check that the connection is working by getting the available targets:

```bash
# Using curl
curl http://localhost:3001/api/targets
```

You should see a response with the available targets, including the ProcessBuilder and EmailBot.

### Production Deployment

For production deployment, consider the following additional steps:

1. **Use a Process Manager**: Use PM2 or a similar tool to keep the server running:

```bash
# Install PM2
npm install -g pm2

# Start the server with PM2
pm2 start dist/index.js --name "ao-process-builder-api"

# Configure PM2 to start on system boot
pm2 startup
```

2. **Set Up a Reverse Proxy**: Use Nginx or Apache as a reverse proxy:

```bash
# Example Nginx configuration
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Enable HTTPS**: Use Let's Encrypt to enable HTTPS:

```bash
# Install Certbot
apt-get install certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-domain.com
```

4. **Set Up Monitoring**: Use a monitoring service to keep track of the server status.

5. **Configure Logging**: Set up proper logging for production:

```bash
# Install Winston for logging
npm install winston

# Configure logging in your application
```

## Detailed API Documentation

This section provides comprehensive documentation for all API endpoints, including request/response formats, authentication requirements, and example usage.

### Authentication

Currently, the API does not require authentication. In a production environment, you should implement proper authentication using JWT, API keys, or another secure method.

### Base URL

All API endpoints are relative to the base URL:

```
http://localhost:3001/api
```

For production, replace with your domain.

### Response Format

All API responses follow a standard format:

```json
{
    "success": true/false,
    "message": "Human-readable message",
    "data": { /* Response data */ },
    "error": "Error message (if applicable)"
}
```

### Error Handling

Errors return appropriate HTTP status codes:

-   400: Bad Request (client error)
-   404: Not Found
-   500: Server Error

### API Endpoints

#### 1. Health Check

Check if the API server is running.

```
GET /health
```

**Example Request:**

```bash
curl http://localhost:3001/api/health
```

**Example Response:**

```json
{
    "status": "ok",
    "timestamp": "2023-06-01T12:00:00.000Z"
}
```

#### 2. Connect to AO Process

Connect to the AO Process Builder and EmailBot.

```
POST /connect
```

**Request Body:**

```json
{
    "processId": "YOUR_PROCESSBUILDER_ID",
    "emailBotId": "YOUR_EMAILBOT_ID"
}
```

**Example Request:**

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"processId":"YOUR_PROCESSBUILDER_ID","emailBotId":"YOUR_EMAILBOT_ID"}' \
  http://localhost:3001/api/connect
```

**Example Response:**

```json
{
    "success": true,
    "message": "Connected to AO platform",
    "processId": "YOUR_PROCESSBUILDER_ID",
    "emailBotId": "YOUR_EMAILBOT_ID"
}
```

#### 3. Disconnect from AO Process

Disconnect from the AO platform.

```
POST /disconnect
```

**Example Request:**

```bash
curl -X POST http://localhost:3001/api/disconnect
```

**Example Response:**

```json
{
    "success": true,
    "message": "Disconnected from AO platform"
}
```

#### 4. Get AO Status

Get the current connection status to the AO platform.

```
GET /status
```

**Example Request:**

```bash
curl http://localhost:3001/api/status
```

**Example Response:**

```json
{
    "connected": true,
    "processId": "YOUR_PROCESSBUILDER_ID",
    "emailBotId": "YOUR_EMAILBOT_ID"
}
```

#### 5. Get Available Targets

Get a list of available targets (processes) on the AO platform.

```
GET /targets
```

**Example Request:**

```bash
curl http://localhost:3001/api/targets
```

**Example Response:**

```json
[
    {
        "id": "YOUR_EMAILBOT_ID",
        "name": "Email Bot",
        "description": "Sends emails and notifications",
        "icon": "bi-envelope"
    },
    {
        "id": "YOUR_PROCESSBUILDER_ID",
        "name": "Process Builder",
        "description": "Creates and manages automations",
        "icon": "bi-gear"
    }
]
```

#### 6. Send Message to AO Process

Send a message to a specific AO process.

```
POST /send
```

**Request Body:**

```json
{
    "target": "YOUR_PROCESS_ID",
    "action": "ActionName",
    "data": "Optional data string",
    "tags": { "key": "value" }
}
```

**Example Request:**

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"target":"YOUR_EMAILBOT_ID","action":"SendEmail","data":"recipient@example.com"}' \
  http://localhost:3001/api/send
```

**Example Response:**

```json
{
    "success": true,
    "message": "Message sent to AO network",
    "target": "YOUR_EMAILBOT_ID",
    "action": "SendEmail",
    "result": {
        "success": true,
        "target": "YOUR_EMAILBOT_ID",
        "action": "SendEmail",
        "output": "Message sent successfully"
    },
    "timestamp": "2023-06-01T12:00:00.000Z"
}
```

#### 7. Get Messages from AO Process

Get messages from a specific AO process.

```
GET /messages/:processId
```

**Example Request:**

```bash
curl http://localhost:3001/api/messages/YOUR_PROCESSBUILDER_ID
```

**Example Response:**

```json
[
    {
        "from": "system",
        "action": "ProcessStarted",
        "data": "Process started successfully",
        "timestamp": "2023-06-01T12:00:00.000Z"
    }
]
```

#### 8. Create Automation

Create a new automation.

```
POST /automations
```

**Request Body:**

```json
{
    "When": "File Uploaded",
    "Then": "Send Email",
    "Target": "YOUR_EMAILBOT_ID",
    "Name": "File Upload Notification",
    "Description": "Sends an email when a file is uploaded"
}
```

**Example Request:**

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"When":"File Uploaded","Then":"Send Email","Target":"YOUR_EMAILBOT_ID","Name":"File Upload Notification","Description":"Sends an email when a file is uploaded"}' \
  http://localhost:3001/api/automations
```

**Example Response:**

```json
{
    "success": true,
    "message": "Automation created successfully",
    "id": "auto-1685620800000-123",
    "config": {
        "When": "File Uploaded",
        "Then": "Send Email",
        "Target": "YOUR_EMAILBOT_ID",
        "Name": "File Upload Notification",
        "Description": "Sends an email when a file is uploaded"
    }
}
```

#### 9. List Automations

Get a list of all automations.

```
GET /automations
```

**Example Request:**

```bash
curl http://localhost:3001/api/automations
```

**Example Response:**

```json
[
    {
        "id": "auto-1685620800000-123",
        "name": "File Upload Notification",
        "description": "Sends an email when a file is uploaded",
        "when": "File Uploaded",
        "then": "Send Email",
        "target": "YOUR_EMAILBOT_ID",
        "createdAt": "2023-06-01T12:00:00.000Z",
        "status": "active"
    }
]
```

#### 10. Get Automation

Get details of a specific automation.

```
GET /automations/:id
```

**Example Request:**

```bash
curl http://localhost:3001/api/automations/auto-1685620800000-123
```

**Example Response:**

```json
{
    "id": "auto-1685620800000-123",
    "name": "File Upload Notification",
    "description": "Sends an email when a file is uploaded",
    "when": "File Uploaded",
    "then": "Send Email",
    "target": "YOUR_EMAILBOT_ID",
    "createdAt": "2023-06-01T12:00:00.000Z",
    "status": "active"
}
```

#### 11. Update Automation

Update an existing automation.

```
PUT /automations/:id
```

**Request Body:**

```json
{
    "Name": "Updated Notification Name",
    "Description": "Updated description",
    "When": "File Uploaded",
    "Then": "Send Email",
    "Target": "YOUR_EMAILBOT_ID"
}
```

**Example Request:**

```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"Name":"Updated Notification Name","Description":"Updated description"}' \
  http://localhost:3001/api/automations/auto-1685620800000-123
```

**Example Response:**

```json
{
    "id": "auto-1685620800000-123",
    "name": "Updated Notification Name",
    "description": "Updated description",
    "when": "File Uploaded",
    "then": "Send Email",
    "target": "YOUR_EMAILBOT_ID",
    "createdAt": "2023-06-01T12:00:00.000Z",
    "updatedAt": "2023-06-01T13:00:00.000Z",
    "status": "active"
}
```

#### 12. Delete Automation

Delete an automation.

```
DELETE /automations/:id
```

**Example Request:**

```bash
curl -X DELETE http://localhost:3001/api/automations/auto-1685620800000-123
```

**Example Response:**

```json
{
    "id": "auto-1685620800000-123",
    "name": "Updated Notification Name",
    "description": "Updated description",
    "when": "File Uploaded",
    "then": "Send Email",
    "target": "YOUR_EMAILBOT_ID",
    "createdAt": "2023-06-01T12:00:00.000Z",
    "updatedAt": "2023-06-01T13:00:00.000Z",
    "status": "active"
}
```

#### 13. Trigger Automation

Trigger a specific automation.

```
POST /automations/:id/trigger
```

**Request Body:**

```json
{
    "action": "File Uploaded",
    "data": "important_document.pdf"
}
```

**Example Request:**

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"action":"File Uploaded","data":"important_document.pdf"}' \
  http://localhost:3001/api/automations/auto-1685620800000-123/trigger
```

**Example Response:**

```json
{
    "success": true,
    "message": "Automation triggered successfully",
    "id": "auto-1685620800000-123",
    "action": "File Uploaded",
    "result": {
        "success": true,
        "target": "auto-1685620800000-123",
        "action": "File Uploaded",
        "output": "Automation executed successfully"
    }
}
```

### Common Error Responses

#### Not Connected to AO Platform

```json
{
    "error": "Not connected to AO platform"
}
```

#### Automation Not Found

```json
{
    "error": "Automation not found"
}
```

#### Invalid Request

```json
{
    "error": "When, Then, and Target are required"
}
```

#### Server Error

```json
{
    "error": true,
    "message": "An unexpected error occurred",
    "stack": "Error stack trace (in development mode only)"
}
```

### Integration with Frontend

The API server also serves the React frontend application. Any route not matching the API routes will serve the React app:

```
GET /*
```

This allows you to deploy both the frontend and backend as a single application.
