import { Request, Response } from 'express';
import telegramBotService from '../services/telegramBotService';
import { TelegramFile } from '../types';
import * as fs from 'fs';
import ardriveService from '../services/ardriveService';

// Initialize the Telegram bot (but don't start it)
export const initializeBot = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const initialized = await telegramBotService.initialize();
        if (!initialized) {
            return res.status(500).json({
                success: false,
                error: 'Failed to initialize Telegram bot'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Telegram bot initialized successfully',
            status: telegramBotService.getBotStatus()
        });
    } catch (error) {
        console.error('Error initializing Telegram bot:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to initialize Telegram bot'
        });
    }
};

// Start the Telegram bot (for workflow)
export const startBot = async (_req: Request, res: Response): Promise<Response> => {
    try {
        // Get current bot status before starting
        const beforeStatus = telegramBotService.getBotStatus();

        // If already active, just return success
        if (beforeStatus.active) {
            return res.status(200).json({
                success: true,
                message: 'Telegram bot is already active',
                status: beforeStatus
            });
        }

        // Try to start the bot
        const started = await telegramBotService.startBot();
        if (!started) {
            return res.status(500).json({
                success: false,
                error: 'Failed to start Telegram bot'
            });
        }

        // Since we've modified the bot service to start asynchronously,
        // we can just return success immediately if the start method returned true
        return res.status(200).json({
            success: true,
            message: 'Telegram bot start initiated successfully',
            status: telegramBotService.getBotStatus()
        });
    } catch (error) {
        console.error('Error starting Telegram bot:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to start Telegram bot'
        });
    }
};

// Stop the Telegram bot (for workflow)
export const stopBot = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const stopped = await telegramBotService.stopBot();
        if (!stopped) {
            return res.status(500).json({
                success: false,
                error: 'Failed to stop Telegram bot'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Telegram bot stopped successfully',
            status: telegramBotService.getBotStatus()
        });
    } catch (error) {
        console.error('Error stopping Telegram bot:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to stop Telegram bot'
        });
    }
};

// Get the bot status
export const getBotStatus = (_req: Request, res: Response): Response => {
    try {
        const status = telegramBotService.getBotStatus();

        return res.status(200).json({
            success: true,
            status
        });
    } catch (error) {
        console.error('Error getting bot status:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get bot status'
        });
    }
};

// Get pending messages
export const getPendingMessages = (_req: Request, res: Response): Response => {
    try {
        const pendingMessages = telegramBotService.getPendingMessages();

        return res.status(200).json({
            success: true,
            pendingMessages,
            count: pendingMessages.length
        });
    } catch (error) {
        console.error('Error getting pending messages:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get pending messages'
        });
    }
};

// Process a pending message
export const processPendingMessage = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { messageId } = req.params;

        if (!messageId) {
            return res.status(400).json({
                success: false,
                error: 'Message ID is required'
            });
        }

        const processedFile = await telegramBotService.processPendingMessage(messageId);

        if (!processedFile) {
            return res.status(404).json({
                success: false,
                error: 'Failed to process message - message not found or already processed'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Message processed successfully',
            file: {
                id: processedFile.id,
                fileName: processedFile.fileName,
                fileSize: processedFile.fileSize,
                contentType: processedFile.contentType,
                uploadedBy: processedFile.uploadedBy,
                createdAt: processedFile.createdAt,
                arweaveUploadStatus: processedFile.arweaveUploadStatus,
            }
        });
    } catch (error) {
        console.error('Error processing pending message:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to process pending message'
        });
    }
};

// Get ArDrive wallet balance
export const getArDriveBalance = async (_req: Request, res: Response): Promise<Response> => {
    try {
        // Initialize ArDrive service first
        const initialized = await ardriveService.initialize();
        if (!initialized) {
            return res.status(500).json({
                success: false,
                error: 'ArDrive service initialization failed. Check your private key.'
            });
        }

        const balance = await ardriveService.getBalance();
        // const address = await ardriveService.getAddress();

        return res.status(200).json({
            success: true,
            balance: balance.formattedBalance,
            raw_balance: balance.balance,
            // wallet_address: address
        });
    } catch (error) {
        console.error('Error getting ArDrive balance:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get ArDrive balance'
        });
    }
};

// Get upload cost estimate for a file
export const getUploadCostEstimate = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { fileId } = req.params;

        // Get the file from service
        const file = telegramBotService.getFileById(fileId);
        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // Check if file exists locally
        if (!file.localPath || !fs.existsSync(file.localPath)) {
            return res.status(404).json({
                success: false,
                error: 'File not found on disk'
            });
        }

        // Initialize ArDrive service
        const initialized = await ardriveService.initialize();
        if (!initialized) {
            return res.status(500).json({
                success: false,
                error: 'ArDrive service initialization failed. Check your private key.'
            });
        }

        // Get file size
        const fileSize = fs.statSync(file.localPath).size;

        // Get cost estimate from ArDrive service
        const costEstimate = await ardriveService.getUploadCost(fileSize);

        return res.status(200).json({
            success: true,
            file_id: fileId,
            file_name: file.fileName,
            file_size: fileSize,
            cost_estimate: costEstimate
        });
    } catch (error) {
        console.error('Error getting upload cost estimate:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get upload cost estimate'
        });
    }
};

// Upload a file to ArDrive
export const uploadFileToArDrive = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { fileId } = req.params;
        const { customTags = [] } = req.body;

        // Get the file from service
        const file = telegramBotService.getFileById(fileId);
        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // Check if file already uploaded
        if (file.arweaveUploadStatus === 'success' && file.arweaveId) {
            return res.status(200).json({
                success: true,
                message: 'File already uploaded to ArDrive',
                file_id: fileId,
                arweave_id: file.arweaveId,
                arweave_url: file.arweaveUrl
            });
        }

        // Check if file exists locally
        if (!file.localPath || !fs.existsSync(file.localPath)) {
            return res.status(404).json({
                success: false,
                error: 'File not found on disk'
            });
        }

        // Update file status to pending
        telegramBotService.updateFile(fileId, { arweaveUploadStatus: 'pending' });

        // Prepare custom tags
        const defaultCustomTags = [
            {
                name: "File-Original-Name",
                value: file.fileName
            },
            {
                name: "Uploaded-By",
                value: file.uploadedBy
            },
            {
                name: "App-Name",
                value: "Telegram-ArDrive-Bot"
            }
        ];

        // Combine default and user-provided tags
        const allCustomTags = [...defaultCustomTags, ...customTags];

        // Upload file to ArDrive
        const result = await ardriveService.uploadFile(
            file.localPath,
            file.contentType,
            allCustomTags
        );

        if (result.success) {
            // Update file with ArDrive information
            telegramBotService.updateFile(fileId, {
                arweaveId: result.id,
                arweaveUrl: result.url,
                arweaveUploadStatus: 'success'
            });

            return res.status(200).json({
                success: true,
                message: 'File uploaded to ArDrive successfully',
                file_id: fileId,
                arweave_id: result.id,
                arweave_url: result.url,
                arweave_owner: result.owner,
                data_caches: result.dataCaches,
                fast_finality_indexes: result.fastFinalityIndexes
            });
        } else {
            // Update file with error information
            telegramBotService.updateFile(fileId, {
                arweaveUploadStatus: 'failed',
                arweaveUploadError: result.error
            });

            // Check if it's a balance issue
            if (result.url) {
                return res.status(402).json({
                    success: false,
                    error: 'Insufficient balance for upload',
                    message: 'Please top up your wallet and try again',
                    checkout_url: result.url
                });
            } else {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to upload file to ArDrive',
                    message: result.error
                });
            }
        }
    } catch (error) {
        console.error('Error uploading file to ArDrive:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to upload file to ArDrive',
            message: error instanceof Error ? error.message : String(error)
        });
    }
};

// Get all files that need to be uploaded to ArDrive
export const getPendingArDriveUploads = (_req: Request, res: Response): Response => {
    try {
        const files = telegramBotService.getAllFiles();

        // Filter for files that need to be uploaded
        const pendingFiles = files
            .filter(file =>
                // Files marked as pending or failed
                (file.arweaveUploadStatus === 'pending' || file.arweaveUploadStatus === 'failed') &&
                // And have a local path
                file.localPath && fs.existsSync(file.localPath)
            )
            .map(file => ({
                id: file.id,
                fileName: file.fileName,
                fileSize: file.fileSize,
                contentType: file.contentType,
                uploadedBy: file.uploadedBy,
                createdAt: file.createdAt,
                arweaveUploadStatus: file.arweaveUploadStatus,
                arweaveUploadError: file.arweaveUploadError
            }));

        return res.status(200).json({
            success: true,
            pendingFiles,
            count: pendingFiles.length
        });
    } catch (error) {
        console.error('Error getting pending ArDrive uploads:', error);
        return res.status(500).json({ error: 'Failed to get pending ArDrive uploads' });
    }
};

// Get all uploaded files
export const getAllFiles = (_req: Request, res: Response): Response => {
    try {
        const files = telegramBotService.getAllFiles();
        const filesWithoutSensitiveData = files.map(file => ({
            id: file.id,
            fileName: file.fileName,
            fileSize: file.fileSize,
            contentType: file.contentType,
            uploadedBy: file.uploadedBy,
            createdAt: file.createdAt,
            // ArDrive information
            arweaveId: file.arweaveId,
            arweaveUrl: file.arweaveUrl,
            arweaveUploadStatus: file.arweaveUploadStatus
        }));

        return res.status(200).json({
            success: true,
            files: filesWithoutSensitiveData
        });
    } catch (error) {
        console.error('Error getting files:', error);
        return res.status(500).json({ error: 'Failed to get files' });
    }
};

// Get a file by ID
export const getFileById = (req: Request<{ id: string }>, res: Response): Response => {
    try {
        const { id } = req.params;
        const file = telegramBotService.getFileById(id);

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const fileData = {
            id: file.id,
            fileName: file.fileName,
            fileSize: file.fileSize,
            contentType: file.contentType,
            uploadedBy: file.uploadedBy,
            createdAt: file.createdAt,
            // ArDrive information
            arweaveId: file.arweaveId,
            arweaveUrl: file.arweaveUrl,
            arweaveUploadStatus: file.arweaveUploadStatus,
            arweaveUploadError: file.arweaveUploadError
        };

        return res.status(200).json({
            success: true,
            file: fileData
        });
    } catch (error) {
        console.error('Error getting file:', error);
        return res.status(500).json({ error: 'Failed to get file' });
    }
};

// Download a file by ID
export const downloadFileById = (req: Request<{ id: string }>, res: Response): void => {
    try {
        const { id } = req.params;
        const file = telegramBotService.getFileById(id);

        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }

        // Check for local file first
        if (file.localPath && fs.existsSync(file.localPath)) {
            res.setHeader('Content-Type', file.contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);

            // Stream the file to the response
            const fileStream = fs.createReadStream(file.localPath);
            fileStream.pipe(res);
            return;
        }

        // If there's no local file but we have an ArDrive URL, redirect to it
        if (file.arweaveUrl) {
            res.redirect(file.arweaveUrl);
            return;
        }

        // If we have neither, return an error
        res.status(404).json({
            error: 'File content not available',
            message: 'File is not available locally or on ArDrive'
        });
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
};

// Delete a file by ID
export const deleteFileById = (req: Request<{ id: string }>, res: Response): Response => {
    try {
        const { id } = req.params;
        const file = telegramBotService.getFileById(id);

        // Check if file exists
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // If file is on ArDrive, warn that it can't be removed from there
        const ardriveWarning = file.arweaveId ?
            'Note: The file has been permanently stored on ArDrive and cannot be deleted from there.' :
            undefined;

        // Delete the file locally
        const success = telegramBotService.deleteFile(id);

        if (!success) {
            return res.status(500).json({ error: 'Failed to delete file' });
        }

        return res.status(200).json({
            success: true,
            message: 'File deleted successfully from local storage',
            ardriveWarning
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        return res.status(500).json({ error: 'Failed to delete file' });
    }
};

// Get recent file uploads with filtering options
export const getRecentUploads = (req: Request, res: Response): Response => {
    try {
        const { since, type, limit = '10' } = req.query;
        const files = telegramBotService.getAllFiles();

        // Filter by timestamp if 'since' parameter is provided
        let filteredFiles = files;
        if (since) {
            const sinceTimestamp = new Date(since as string).getTime();
            if (!isNaN(sinceTimestamp)) {
                filteredFiles = filteredFiles.filter(file =>
                    file.createdAt.getTime() > sinceTimestamp
                );
            }
        }

        // Filter by content type if 'type' parameter is provided
        if (type) {
            const typeFilter = (type as string).toLowerCase();
            filteredFiles = filteredFiles.filter(file => {
                if (typeFilter === 'image') {
                    return file.contentType.startsWith('image/');
                } else if (typeFilter === 'document') {
                    return !file.contentType.startsWith('image/');
                }
                return file.contentType.includes(typeFilter);
            });
        }

        // Sort by newest first
        filteredFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Limit results
        const limitNum = parseInt(limit as string, 10);
        if (!isNaN(limitNum) && limitNum > 0) {
            filteredFiles = filteredFiles.slice(0, limitNum);
        }

        // Prepare response without sensitive data
        const response = filteredFiles.map(file => ({
            id: file.id,
            fileName: file.fileName,
            fileSize: file.fileSize,
            contentType: file.contentType,
            uploadedBy: file.uploadedBy,
            createdAt: file.createdAt,
            arweaveId: file.arweaveId,
            arweaveUrl: file.arweaveUrl,
            arweaveUploadStatus: file.arweaveUploadStatus
        }));

        return res.status(200).json({
            success: true,
            files: response,
            count: response.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting recent uploads:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get recent uploads'
        });
    }
}; 