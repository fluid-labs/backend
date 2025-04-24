import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { TelegramFile, TelegramMessage } from '../types';

// In-memory storage for uploaded files
const uploadedFiles = new Map<string, TelegramFile>();

// In-memory storage for pending messages
const pendingMessages = new Map<string, TelegramMessage>();

// File upload directory - ensure it exists
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure the Telegram bot
class TelegramBotService {
    private bot: Telegraf;
    private token: string;
    private isInitialized: boolean = false;
    private isActive: boolean = false;
    private botInfo: any = null;

    constructor() {
        this.token = process.env.TELEGRAM_BOT_TOKEN || '';
        this.bot = new Telegraf(this.token);
    }

    // Initialize the bot without starting to listen for messages
    public async initialize(): Promise<boolean> {
        if (!this.token) {
            console.error('TELEGRAM_BOT_TOKEN is not set. Telegram bot will not work.');
            return false;
        }

        if (this.isInitialized) {
            return true;
        }

        try {
            // Setup message handlers but don't start listening yet
            this.setupHandlers();

            // Get bot info
            this.botInfo = await this.bot.telegram.getMe();

            console.log(`Telegram bot initialized: @${this.botInfo.username}`);
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize Telegram bot:', error);
            return false;
        }
    }

    // Set up message handlers
    private setupHandlers(): void {
        // Handle document/file messages
        this.bot.on(message('document'), async (ctx) => {
            if (!this.isActive) {
                // If bot is not active, store the message for later processing
                const messageId = uuidv4();
                pendingMessages.set(messageId, {
                    id: messageId,
                    type: 'document',
                    context: ctx,
                    receivedAt: new Date()
                });
                console.log(`Document message stored with ID: ${messageId} (bot is inactive)`);
                return;
            }

            // Process the document normally
            await this.handleDocumentMessage(ctx);
        });

        // Handle photo messages
        this.bot.on(message('photo'), async (ctx) => {
            if (!this.isActive) {
                // If bot is not active, store the message for later processing
                const messageId = uuidv4();
                pendingMessages.set(messageId, {
                    id: messageId,
                    type: 'photo',
                    context: ctx,
                    receivedAt: new Date()
                });
                console.log(`Photo message stored with ID: ${messageId} (bot is inactive)`);
                return;
            }

            // Process the photo normally
            await this.handlePhotoMessage(ctx);
        });

        // Handle start command
        this.bot.command('start', (ctx) => {
            ctx.reply('Welcome! I am a workflow-based file processing bot. I will process your files when the workflow is running.');
        });

        // Handle help command
        this.bot.command('help', (ctx) => {
            ctx.reply(
                'I am a workflow-based file processing bot.\n\n' +
                'When the workflow is running, you can send me documents or photos, and I will process them.\n\n' +
                'Available commands:\n' +
                '/start - Welcome message\n' +
                '/help - Show this help information\n' +
                '/status - Check if I am currently active'
            );
        });

        // Handle status command
        this.bot.command('status', (ctx) => {
            if (this.isActive) {
                ctx.reply('I am currently active and processing messages.');
            } else {
                ctx.reply('I am currently inactive. Messages will be queued until the workflow is started.');
            }
        });

        // Handle list command to show all files uploaded by the user
        this.bot.command('list', (ctx) => {
            const username = ctx.message.from.username || ctx.message.from.id.toString();
            const userFiles = Array.from(uploadedFiles.values())
                .filter(file => file.uploadedBy === username);

            if (userFiles.length === 0) {
                return ctx.reply('You have not uploaded any files yet.');
            }

            const fileList = userFiles
                .map(file => {
                    let status = '';
                    if (file.arweaveUploadStatus === 'success') {
                        status = `✅ Stored on ArDrive: ${file.arweaveUrl || 'Link available in web UI'}`;
                    } else if (file.arweaveUploadStatus === 'failed') {
                        status = '❌ ArDrive upload failed';
                    } else {
                        status = '⏳ Ready for permanent storage (use workflow)';
                    }

                    return `- ${file.fileName} (ID: ${file.id}, Size: ${this.formatFileSize(file.fileSize)})\n  ${status}`;
                })
                .join('\n\n');

            ctx.reply(`Your uploaded files:\n\n${fileList}`);
        });

        // Handle get command to retrieve a specific file
        this.bot.command('get', async (ctx) => {
            const args = ctx.message.text.split(' ').slice(1);
            if (args.length === 0) {
                return ctx.reply('Please provide a file ID. Example: /get file_id');
            }

            const fileId = args[0];
            const file = uploadedFiles.get(fileId);

            if (!file) {
                return ctx.reply('File not found. Please check the ID and try again.');
            }

            try {
                // Add file details in the message
                let details = `File: ${file.fileName}\nSize: ${this.formatFileSize(file.fileSize)}\nType: ${file.contentType}\nUploaded: ${file.createdAt.toLocaleString()}`;

                if (file.arweaveUploadStatus === 'success' && file.arweaveUrl) {
                    details += `\n\nPermanent storage: ${file.arweaveUrl}`;
                }

                await ctx.reply(details);

                // Send the file back to the user
                if (file.localPath && fs.existsSync(file.localPath)) {
                    await ctx.replyWithDocument({ source: file.localPath, filename: file.fileName });
                } else if (file.telegramFileId) {
                    await ctx.replyWithDocument(file.telegramFileId);
                } else {
                    ctx.reply('Sorry, the file is not available for download locally.');

                    // If we have an ArDrive URL, suggest that
                    if (file.arweaveUrl) {
                        ctx.reply(`However, you can download it from the permanent storage link: ${file.arweaveUrl}`);
                    }
                }
            } catch (error) {
                console.error('Error sending file:', error);
                ctx.reply('Sorry, there was an error retrieving the file.');
            }
        });

        // Handle graceful shutdown
        process.once('SIGINT', () => this.stopBot());
        process.once('SIGTERM', () => this.stopBot());
    }

    // Start the bot to listen for messages
    public async startBot(): Promise<boolean> {
        if (!this.isInitialized) {
            const initialized = await this.initialize();
            if (!initialized) {
                return false;
            }
        }

        if (this.isActive) {
            console.log('Bot is already active.');
            return true;
        }

        try {
            // Start the bot in a non-blocking way
            // The launch method doesn't actually resolve as it keeps polling
            // so we need to handle this differently
            this.bot.launch().catch(error => {
                console.error('Telegram bot error during operation:', error);
                this.isActive = false;
            });

            // Mark as active immediately
            this.isActive = true;

            // Add a small delay to ensure bot is starting up
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log('Telegram bot is now active and processing messages.');
            return true;
        } catch (error) {
            console.error('Failed to start Telegram bot:', error);
            return false;
        }
    }

    // Stop the bot from listening for new messages
    public async stopBot(): Promise<boolean> {
        if (!this.isActive) {
            console.log('Bot is already inactive.');
            return true;
        }

        try {
            // Stop the bot
            await this.bot.stop();
            this.isActive = false;
            console.log('Telegram bot is now inactive. Messages will be queued.');
            return true;
        } catch (error) {
            console.error('Failed to stop Telegram bot:', error);
            return false;
        }
    }

    // Get bot status
    public getBotStatus(): { initialized: boolean; active: boolean; botInfo: any } {
        return {
            initialized: this.isInitialized,
            active: this.isActive,
            botInfo: this.botInfo
        };
    }

    // Get pending messages
    public getPendingMessages(): TelegramMessage[] {
        return Array.from(pendingMessages.values());
    }

    // Process a pending message
    public async processPendingMessage(messageId: string): Promise<TelegramFile | null> {
        const message = pendingMessages.get(messageId);
        if (!message) {
            return null;
        }

        try {
            let file: TelegramFile | null = null;

            // Process the message based on type
            if (message.type === 'document') {
                file = await this.handleDocumentMessage(message.context);
            } else if (message.type === 'photo') {
                file = await this.handlePhotoMessage(message.context);
            }

            // Remove the message from pending
            pendingMessages.delete(messageId);

            return file;
        } catch (error) {
            console.error(`Error processing pending message ${messageId}:`, error);
            return null;
        }
    }

    // Handle document message and return the file data
    private async handleDocumentMessage(ctx: any): Promise<TelegramFile | null> {
        try {
            const document = ctx.message.document;
            const fileId = document.file_id;
            const fileName = document.file_name || 'unknown_file';
            const mimeType = document.mime_type || 'application/octet-stream';
            const fileSize = document.file_size || 0;

            // Get file link from Telegram
            const fileLink = await ctx.telegram.getFileLink(fileId);

            // Generate a unique ID for the file
            const uniqueId = uuidv4();
            const localFilePath = path.join(UPLOAD_DIR, `${uniqueId}-${fileName}`);

            // Download the file
            const response = await axios({
                method: 'GET',
                url: fileLink.href,
                responseType: 'stream',
            });

            // Save file to disk
            const writer = fs.createWriteStream(localFilePath);
            response.data.pipe(writer);

            await new Promise<void>((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Store file metadata
            const fileData: TelegramFile = {
                id: uniqueId,
                fileName,
                fileSize,
                contentType: mimeType,
                uploadedBy: ctx.message.from.username || ctx.message.from.id.toString(),
                telegramFileId: fileId,
                fileUrl: fileLink.href,
                localPath: localFilePath,
                createdAt: new Date(),
                arweaveUploadStatus: 'pending' // Set to pending for UI to know it's ready for upload
            };

            uploadedFiles.set(uniqueId, fileData);

            console.log(`File uploaded to local storage: ${fileName} (${uniqueId})`);

            return fileData;
        } catch (error) {
            console.error('Error handling file upload:', error);
            await ctx.reply('Sorry, there was an error processing your file.');
            return null;
        }
    }

    // Handle photo message and return the file data
    private async handlePhotoMessage(ctx: any): Promise<TelegramFile | null> {
        try {
            // Get the largest photo (last in the array)
            const photos = ctx.message.photo;
            const photo = photos[photos.length - 1];
            const fileId = photo.file_id;
            const fileSize = photo.file_size || 0;

            // Get caption if available
            const caption = ctx.message.caption || 'photo';
            const fileName = `${caption}.jpg`;

            // Get file link from Telegram
            const fileLink = await ctx.telegram.getFileLink(fileId);

            // Generate a unique ID for the file
            const uniqueId = uuidv4();
            const localFilePath = path.join(UPLOAD_DIR, `${uniqueId}-${fileName}`);

            // Download the file
            const response = await axios({
                method: 'GET',
                url: fileLink.href,
                responseType: 'stream',
            });

            // Save file to disk
            const writer = fs.createWriteStream(localFilePath);
            response.data.pipe(writer);

            await new Promise<void>((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Store file metadata
            const fileData: TelegramFile = {
                id: uniqueId,
                fileName,
                fileSize,
                contentType: 'image/jpeg',
                uploadedBy: ctx.message.from.username || ctx.message.from.id.toString(),
                telegramFileId: fileId,
                fileUrl: fileLink.href,
                localPath: localFilePath,
                createdAt: new Date(),
                arweaveUploadStatus: 'pending' // Set to pending for UI to know it's ready for upload
            };

            uploadedFiles.set(uniqueId, fileData);

            // Send confirmation message
            await ctx.reply(
                `Photo received and processed with ID: ${uniqueId}\n\n` +
                `This photo will be processed by the workflow.`
            );

            console.log(`Photo uploaded to local storage: ${fileName} (${uniqueId})`);

            return fileData;
        } catch (error) {
            console.error('Error handling photo upload:', error);
            await ctx.reply('Sorry, there was an error processing your photo.');
            return null;
        }
    }

    // Format file size in a human-readable format
    private formatFileSize(bytes: number): string {
        if (bytes < 1024) {
            return `${bytes} B`;
        } else if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(2)} KB`;
        } else if (bytes < 1024 * 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        } else {
            return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        }
    }

    // Get all uploaded files
    public getAllFiles(): TelegramFile[] {
        return Array.from(uploadedFiles.values());
    }

    // Get a specific file by ID
    public getFileById(fileId: string): TelegramFile | undefined {
        return uploadedFiles.get(fileId);
    }

    // Update a file's metadata
    public updateFile(fileId: string, updates: Partial<TelegramFile>): boolean {
        const file = uploadedFiles.get(fileId);
        if (!file) {
            return false;
        }

        uploadedFiles.set(fileId, { ...file, ...updates });
        return true;
    }

    // Delete a file by ID
    public deleteFile(fileId: string): boolean {
        const file = uploadedFiles.get(fileId);
        if (!file) {
            return false;
        }

        // Delete from local storage if exists
        if (file.localPath && fs.existsSync(file.localPath)) {
            try {
                fs.unlinkSync(file.localPath);
            } catch (error) {
                console.error(`Failed to delete file ${fileId} from disk:`, error);
            }
        }

        // Remove from in-memory storage
        uploadedFiles.delete(fileId);
        return true;
    }
}

// Create a singleton instance
const telegramBotService = new TelegramBotService();

export default telegramBotService; 