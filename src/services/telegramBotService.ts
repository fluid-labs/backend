import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { TelegramFile } from '../types';

// In-memory storage for uploaded files
const uploadedFiles = new Map<string, TelegramFile>();

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

    constructor() {
        this.token = process.env.TELEGRAM_BOT_TOKEN || '';
        this.bot = new Telegraf(this.token);
    }

    // Initialize the bot with necessary handlers
    public initialize(): void {
        if (!this.token) {
            console.error('TELEGRAM_BOT_TOKEN is not set. Telegram bot will not work.');
            return;
        }

        if (this.isInitialized) {
            return;
        }

        // Handle document/file messages
        this.bot.on(message('document'), async (ctx) => {
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
                };

                uploadedFiles.set(uniqueId, fileData);

                // Send confirmation message
                await ctx.reply(`File received and stored with ID: ${uniqueId}`);

                console.log(`File uploaded: ${fileName} (${uniqueId})`);
            } catch (error) {
                console.error('Error handling file upload:', error);
                await ctx.reply('Sorry, there was an error processing your file.');
            }
        });

        // Handle photo messages
        this.bot.on(message('photo'), async (ctx) => {
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
                };

                uploadedFiles.set(uniqueId, fileData);

                // Send confirmation message
                await ctx.reply(`Photo received and stored with ID: ${uniqueId}`);

                console.log(`Photo uploaded: ${fileName} (${uniqueId})`);
            } catch (error) {
                console.error('Error handling photo upload:', error);
                await ctx.reply('Sorry, there was an error processing your photo.');
            }
        });

        // Handle start command
        this.bot.command('start', (ctx) => {
            ctx.reply('Welcome! You can send me files, documents, or photos, and I will save them for you.');
        });

        // Handle help command
        this.bot.command('help', (ctx) => {
            ctx.reply('Send me any file, document, or photo, and I will save it and give you an ID for reference.');
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
                .map(file => `- ${file.fileName} (ID: ${file.id}, Type: ${file.contentType}, Size: ${this.formatFileSize(file.fileSize)})`)
                .join('\n');

            ctx.reply(`Your uploaded files:\n${fileList}`);
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
                // Send the file back to the user
                if (file.localPath && fs.existsSync(file.localPath)) {
                    await ctx.replyWithDocument({ source: file.localPath, filename: file.fileName });
                } else if (file.telegramFileId) {
                    await ctx.replyWithDocument(file.telegramFileId);
                } else {
                    ctx.reply('Sorry, the file is not available for download.');
                }
            } catch (error) {
                console.error('Error sending file:', error);
                ctx.reply('Sorry, there was an error retrieving the file.');
            }
        });

        // Start the bot
        this.bot.launch().then(() => {
            console.log('Telegram bot is running!');
            this.isInitialized = true;
        }).catch(err => {
            console.error('Failed to start Telegram bot:', err);
        });

        // Handle graceful shutdown
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
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