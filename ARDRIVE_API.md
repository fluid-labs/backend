# ArDrive Integration API

This document describes the API endpoints for uploading files to ArDrive permanent storage. These endpoints allow you to manage file uploads to ArDrive separately from the Telegram bot's local storage functionality.

## Overview

The Telegram bot now saves files locally when they are uploaded, but doesn't automatically upload them to ArDrive. Instead, you can use the API endpoints described below to:

1. Get a list of files that are ready to be uploaded to ArDrive
2. Get cost estimates for uploading specific files
3. Upload files to ArDrive when needed
4. Check the status of uploaded files

## API Endpoints

### 1. Get ArDrive Wallet Balance

Check the current balance of your ArDrive wallet.

```
GET /api/telegram/ardrive/balance
```

**Response:**

```json
{
  "success": true,
  "balance": "0.123456 AR",
  "raw_balance": 123456000000,
  "wallet_address": "0x123abc..."
}
```

### 2. Get Files Pending ArDrive Upload

Get a list of all files that are ready to be uploaded to ArDrive (either pending or failed previous uploads).

```
GET /api/telegram/ardrive/pending
```

**Response:**

```json
{
  "success": true,
  "pendingFiles": [
    {
      "id": "abc-123",
      "fileName": "document.pdf",
      "fileSize": 1024000,
      "contentType": "application/pdf",
      "uploadedBy": "user123",
      "createdAt": "2023-04-24T10:30:00.000Z",
      "arweaveUploadStatus": "pending"
    },
    {
      "id": "def-456",
      "fileName": "image.jpg",
      "fileSize": 500000,
      "contentType": "image/jpeg",
      "uploadedBy": "user456",
      "createdAt": "2023-04-24T11:45:00.000Z",
      "arweaveUploadStatus": "failed",
      "arweaveUploadError": "Insufficient balance"
    }
  ],
  "count": 2
}
```

### 3. Get Upload Cost Estimate

Get a cost estimate for uploading a specific file to ArDrive.

```
GET /api/telegram/ardrive/files/:fileId/cost
```

**Parameters:**
- `fileId` - The ID of the file to get a cost estimate for

**Response:**

```json
{
  "success": true,
  "file_id": "abc-123",
  "file_name": "document.pdf",
  "file_size": 1024000,
  "cost_estimate": {
    "winc": 123456000000,
    "ar": "0.123456",
    "sufficient": true
  }
}
```

### 4. Upload File to ArDrive

Upload a specific file to ArDrive.

```
POST /api/telegram/ardrive/files/:fileId/upload
```

**Parameters:**
- `fileId` - The ID of the file to upload

**Request Body (optional):**

```json
{
  "customTags": [
    {
      "name": "Category",
      "value": "Documents"
    },
    {
      "name": "Description",
      "value": "Important document"
    }
  ]
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "File uploaded to ArDrive successfully",
  "file_id": "abc-123",
  "arweave_id": "tx_123abc...",
  "arweave_url": "https://arweave.net/tx_123abc...",
  "arweave_owner": "owner_address",
  "data_caches": ["cache1", "cache2"],
  "fast_finality_indexes": [1, 2, 3]
}
```

**Error Response (Insufficient Balance):**

```json
{
  "success": false,
  "error": "Insufficient balance for upload",
  "message": "Please top up your wallet and try again",
  "checkout_url": "https://turbo.arweave.org/checkout/..."
}
```

### 5. Get All Files

Get a list of all files, including their ArDrive upload status.

```
GET /api/telegram/files
```

**Response:**

```json
{
  "success": true,
  "files": [
    {
      "id": "abc-123",
      "fileName": "document.pdf",
      "fileSize": 1024000,
      "contentType": "application/pdf",
      "uploadedBy": "user123",
      "createdAt": "2023-04-24T10:30:00.000Z",
      "arweaveId": "tx_123abc...",
      "arweaveUrl": "https://arweave.net/tx_123abc...",
      "arweaveUploadStatus": "success"
    },
    {
      "id": "def-456",
      "fileName": "image.jpg",
      "fileSize": 500000,
      "contentType": "image/jpeg",
      "uploadedBy": "user456",
      "createdAt": "2023-04-24T11:45:00.000Z",
      "arweaveUploadStatus": "pending"
    }
  ]
}
```

### 6. Get File by ID

Get details for a specific file.

```
GET /api/telegram/files/:id
```

**Parameters:**
- `id` - The ID of the file to get

**Response:**

```json
{
  "success": true,
  "file": {
    "id": "abc-123",
    "fileName": "document.pdf",
    "fileSize": 1024000,
    "contentType": "application/pdf",
    "uploadedBy": "user123",
    "createdAt": "2023-04-24T10:30:00.000Z",
    "arweaveId": "tx_123abc...",
    "arweaveUrl": "https://arweave.net/tx_123abc...",
    "arweaveUploadStatus": "success"
  }
}
```

### 7. Download File

Download a file. If the file is available locally, it will be streamed from the server. If it's only available on ArDrive, you'll be redirected to the ArDrive URL.

```
GET /api/telegram/files/:id/download
```

**Parameters:**
- `id` - The ID of the file to download

### 8. Delete File

Delete a file from local storage. Note that files uploaded to ArDrive cannot be deleted from there, as they are permanently stored.

```
DELETE /api/telegram/files/:id
```

**Parameters:**
- `id` - The ID of the file to delete

**Response:**

```json
{
  "success": true,
  "message": "File deleted successfully from local storage",
  "ardriveWarning": "Note: The file has been permanently stored on ArDrive and cannot be deleted from there."
}
```

## Usage Example

Here's an example workflow for uploading files to ArDrive:

1. A user uploads a file to the Telegram bot
2. The bot saves the file locally and returns a file ID
3. Your application calls `/api/telegram/ardrive/pending` to get a list of files that need to be uploaded
4. For each file, you can call `/api/telegram/ardrive/files/:fileId/cost` to get a cost estimate
5. Based on the cost and available balance, you can decide which files to upload
6. Call `/api/telegram/ardrive/files/:fileId/upload` to upload the file to ArDrive
7. The file's ArDrive status will be updated, and you can track the upload status through the `/api/telegram/files/:id` endpoint

## Error Handling

All API endpoints return appropriate HTTP status codes and error messages:

- `200 OK` - The request was successful
- `400 Bad Request` - The request was malformed
- `402 Payment Required` - Insufficient balance for upload (includes checkout URL)
- `404 Not Found` - The file was not found
- `500 Internal Server Error` - An error occurred on the server

Error responses include a `success: false` flag and an `error` message explaining what went wrong. 