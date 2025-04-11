# AO Process Builder Backend

This directory contains the Express.js API server for the AO Process Builder.

## Directory Structure

- **src/** - Source code
  - **controllers/** - API controllers
  - **routes/** - API routes
  - **index.js** - Main entry point

## Installation

```bash
# Install dependencies
npm install
```

## Usage

```bash
# Start the server
node src/index.js

# Or with nodemon for development
npm run dev
```

## API Endpoints

### Health Check

```bash
GET /api/health
```

### Connect to AO Process

```bash
POST /api/connect
```

Request body:
```json
{
  "processId": "YOUR_PROCESSBUILDER_ID",
  "emailBotId": "YOUR_EMAILBOT_ID"
}
```

### Get Targets

```bash
GET /api/targets
```

### Create Automation

```bash
POST /api/automations
```

Request body:
```json
{
  "When": "File Uploaded",
  "Then": "Send Email",
  "Target": "YOUR_EMAILBOT_ID",
  "Name": "File Upload Notification",
  "Description": "Sends an email when a file is uploaded"
}
```

### List Automations

```bash
GET /api/automations
```

### Get Automation

```bash
GET /api/automations/:id
```

### Delete Automation

```bash
DELETE /api/automations/:id
```

### Trigger Automation

```bash
POST /api/automations/:id/trigger
```

Request body:
```json
{
  "action": "File Uploaded",
  "data": "important_document.pdf"
}
```
