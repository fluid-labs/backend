import express from 'express';
import * as telegramController from '../controllers/telegramController';

const router = express.Router();

// Initialize the bot
router.post('/initialize', telegramController.initializeBot);

// Get all uploaded files
router.get('/files', telegramController.getAllFiles);

// Get a file by ID
router.get('/files/:id', telegramController.getFileById);

// Download a file by ID
router.get('/files/:id/download', telegramController.downloadFileById);

// Delete a file by ID
router.delete('/files/:id', telegramController.deleteFileById);

export default router; 