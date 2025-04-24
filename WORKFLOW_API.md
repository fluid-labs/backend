# Workflow-Based Telegram Bot API

This document describes the API endpoints for controlling the Telegram bot as part of a workflow system. These endpoints allow your Zapier-like workflow builder to start/stop the bot and process messages.

## Overview

The Telegram bot is designed to work with a workflow system where:

1. The bot is initialized at application startup but remains inactive
2. When a workflow is started, the bot is activated and begins processing messages
3. When the workflow is stopped, the bot becomes inactive but queues messages for later processing
4. Messages received while inactive can be processed when the workflow runs

## Workflow Control API Endpoints

### 1. Initialize the Bot

Initialize the Telegram bot (but don't start listening for messages).

```
POST /api/telegram/initialize
```

**Response:**

```json
{
  "success": true,
  "message": "Telegram bot initialized successfully",
  "status": {
    "initialized": true,
    "active": false,
    "botInfo": {
      "id": 123456789,
      "is_bot": true,
      "first_name": "Your Bot",
      "username": "your_bot_username",
      "can_join_groups": true,
      "can_read_all_group_messages": false,
      "supports_inline_queries": false
    }
  }
}
```

### 2. Start the Bot (Activate Workflow)

Start the Telegram bot to actively listen for messages.

```
POST /api/telegram/start
```

**Response:**

```json
{
  "success": true,
  "message": "Telegram bot started successfully",
  "status": {
    "initialized": true,
    "active": true,
    "botInfo": {
      "id": 123456789,
      "username": "your_bot_username"
    }
  }
}
```

### 3. Stop the Bot (Deactivate Workflow)

Stop the Telegram bot from actively listening for messages.

```
POST /api/telegram/stop
```

**Response:**

```json
{
  "success": true,
  "message": "Telegram bot stopped successfully",
  "status": {
    "initialized": true,
    "active": false,
    "botInfo": {
      "id": 123456789,
      "username": "your_bot_username"
    }
  }
}
```

### 4. Get Bot Status

Check the current status of the Telegram bot.

```
GET /api/telegram/status
```

**Response:**

```json
{
  "success": true,
  "status": {
    "initialized": true,
    "active": true,
    "botInfo": {
      "id": 123456789,
      "username": "your_bot_username"
    }
  }
}
```

### 5. Get Pending Messages

Get a list of messages received while the bot was inactive.

```
GET /api/telegram/messages/pending
```

**Response:**

```json
{
  "success": true,
  "pendingMessages": [
    {
      "id": "abc-123",
      "type": "document",
      "context": { /* Telegram message context object */ },
      "receivedAt": "2023-04-24T10:30:00.000Z"
    },
    {
      "id": "def-456",
      "type": "photo",
      "context": { /* Telegram message context object */ },
      "receivedAt": "2023-04-24T11:45:00.000Z"
    }
  ],
  "count": 2
}
```

### 6. Process a Pending Message

Process a specific pending message.

```
POST /api/telegram/messages/:messageId/process
```

**Parameters:**
- `messageId` - The ID of the message to process

**Response:**

```json
{
  "success": true,
  "message": "Message processed successfully",
  "file": {
    "id": "file-123",
    "fileName": "document.pdf",
    "fileSize": 1024000,
    "contentType": "application/pdf",
    "uploadedBy": "user123",
    "createdAt": "2023-04-24T10:30:00.000Z",
    "arweaveUploadStatus": "pending"
  }
}
```

### 7. Poll for Recent File Uploads

Poll for recently uploaded files with optional filtering for image types.

```
GET /api/telegram/files/recent
```

**Query Parameters:**
- `since` (optional) - Timestamp in ISO format to get files uploaded after this time
- `type` (optional) - Filter by content type. Use "image" for photos only, "document" for non-images
- `limit` (optional) - Maximum number of files to return (default: 10)

**Response:**

```json
{
  "success": true,
  "files": [
    {
      "id": "file-123",
      "fileName": "photo.jpg",
      "fileSize": 524288,
      "contentType": "image/jpeg",
      "uploadedBy": "user123",
      "createdAt": "2023-04-24T12:30:00.000Z",
      "arweaveUploadStatus": "pending"
    },
    {
      "id": "file-456",
      "fileName": "screenshot.png",
      "fileSize": 262144,
      "contentType": "image/png",
      "uploadedBy": "user456",
      "createdAt": "2023-04-24T12:15:00.000Z",
      "arweaveUploadStatus": "pending"
    }
  ],
  "count": 2,
  "timestamp": "2023-04-24T12:45:00.000Z"
}
```

## File Management API

These endpoints for managing files remain the same as in the ArDrive API documentation:

- `GET /api/telegram/files` - Get all files
- `GET /api/telegram/files/:id` - Get file details
- `GET /api/telegram/files/:id/download` - Download a file
- `DELETE /api/telegram/files/:id` - Delete a file

## ArDrive Integration API

The ArDrive integration endpoints also remain the same:

- `GET /api/telegram/ardrive/balance` - Get wallet balance
- `GET /api/telegram/ardrive/pending` - Get files pending upload
- `GET /api/telegram/ardrive/files/:fileId/cost` - Get upload cost estimate
- `POST /api/telegram/ardrive/files/:fileId/upload` - Upload a file to ArDrive

## Workflow Example

Here's an example workflow using these endpoints:

### Receive Telegram Node:

1. When the node is activated:
   - Call `POST /api/telegram/start` to start the bot
   - Periodically call `GET /api/telegram/messages/pending` to check for new messages
   - When a new message is received, call `POST /api/telegram/messages/:messageId/process` to process it
   - The processed message will result in a file that can be passed to the next node

2. When the node is deactivated:
   - Call `POST /api/telegram/stop` to stop the bot
   - Messages received while inactive will be queued for processing the next time the node is activated

### ArDrive Node:

1. When the node receives a file from the Telegram node:
   - Call `GET /api/telegram/ardrive/files/:fileId/cost` to get the upload cost
   - Call `POST /api/telegram/ardrive/files/:fileId/upload` to upload the file to ArDrive
   - The file will be permanently stored, and the node can pass the ArDrive details to the next node

## Error Handling

All API endpoints return appropriate HTTP status codes and error messages:

- `200 OK` - The request was successful
- `400 Bad Request` - The request was malformed
- `404 Not Found` - The resource was not found
- `500 Internal Server Error` - An error occurred on the server

Error responses include a `success: false` flag and an `error` message explaining what went wrong. 