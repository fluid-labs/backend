import { Request, Response } from 'express';
import telegramBotService from '../services/telegramBotService';
import { TelegramFile } from '../types';
import * as fs from 'fs';

// Initialize the Telegram bot
export const initializeBot = (_req: Request, res: Response): Response => {
    try {
        telegramBotService.initialize();
        return res.status(200).json({
            success: true,
            message: 'Telegram bot initialized successfully'
        });
    } catch (error) {
        console.error('Error initializing Telegram bot:', error);
        return res.status(500).json({ error: 'Failed to initialize Telegram bot' });
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
            createdAt: file.createdAt
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
            createdAt: file.createdAt
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

        if (!file.localPath || !fs.existsSync(file.localPath)) {
            res.status(404).json({ error: 'File content not available' });
            return;
        }

        res.setHeader('Content-Type', file.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);

        // Stream the file to the response
        const fileStream = fs.createReadStream(file.localPath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
};

// Delete a file by ID
export const deleteFileById = (req: Request<{ id: string }>, res: Response): Response => {
    try {
        const { id } = req.params;
        const success = telegramBotService.deleteFile(id);

        if (!success) {
            return res.status(404).json({ error: 'File not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        return res.status(500).json({ error: 'Failed to delete file' });
    }
}; 