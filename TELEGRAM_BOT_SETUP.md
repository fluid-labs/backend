# Telegram Bot File Upload Setup

This guide explains how to set up and use the Telegram bot file upload feature in this application.

## Prerequisites

1. A Telegram account
2. BotFather access to create a new bot

## Step 1: Create a Telegram Bot

1. Open Telegram and search for "BotFather" (@BotFather)
2. Start a chat with BotFather
3. Send the command `/newbot`
4. Follow the instructions to create a new bot:
   - Provide a name for your bot (e.g., "File Upload Bot")
   - Provide a username for your bot (must end with "bot", e.g., "file_upload_bot")
5. BotFather will provide you with a token for your new bot. It will look something like this:
   ```
   123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
   ```
6. Save this token securely as you will need it in the next step

## Step 2: Configure the Application

1. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```

2. Open the `.env` file and replace `your_telegram_bot_token_here` with the actual token you received from BotFather:
   ```
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
   ```

3. Save the file and restart the application

## Step 3: Verify Bot Initialization

1. After starting the application, check the console logs to verify that the Telegram bot has been initialized successfully:
   ```
   Telegram bot initialized on startup
   Telegram bot is running!
   ```

2. If you don't see these messages, check that:
   - The `.env` file exists and contains the correct token
   - There are no errors in the application logs

## Step 4: Use the Bot

### Send Files to the Bot

1. Find your bot on Telegram by its username (e.g., @file_upload_bot)
2. Start a chat with your bot
3. Send a document, photo, or any file to the bot
4. The bot will respond with a confirmation message and a unique ID for the file

### Bot Commands

The bot supports the following commands:

- `/start` - Welcome message with instructions
- `/help` - Show help information
- `/list` - Show all files you have uploaded
- `/get [file_id]` - Retrieve a specific file by its ID

### API Endpoints

The application exposes the following API endpoints for managing uploaded files:

- `POST /api/telegram/initialize` - Initialize the Telegram bot
- `GET /api/telegram/files` - Get a list of all uploaded files
- `GET /api/telegram/files/:id` - Get metadata for a specific file
- `GET /api/telegram/files/:id/download` - Download a specific file
- `DELETE /api/telegram/files/:id` - Delete a specific file

## Troubleshooting

### Bot Not Responding

If the bot is not responding to messages, check:

1. The application is running
2. The bot token is correct in the `.env` file
3. You're messaging the correct bot (check the username)

### Files Not Being Saved

If files are not being saved when sent to the bot, check:

1. The `uploads` directory exists and is writable
2. There are no errors in the application logs

### API Endpoint Not Working

If the API endpoints are not working, check:

1. The application is running
2. You're using the correct URL for the endpoint
3. You're sending the correct request type (GET, POST, DELETE)

## Security Considerations

Please note:

1. Files are stored in the local `uploads` directory by default
2. There is no authentication on the API endpoints in this basic implementation
3. Consider adding authentication if you're deploying this to a production environment
4. Be cautious about the types of files you allow to be uploaded 