import express from 'express';
import * as telegramController from '../controllers/telegramController';

const router = express.Router();

// Workflow control routes
router.post('/initialize', telegramController.initializeBot);
router.post('/start', telegramController.startBot);
router.post('/stop', telegramController.stopBot);
router.get('/status', telegramController.getBotStatus);
router.get('/messages/pending', telegramController.getPendingMessages);
router.post('/messages/:messageId/process', telegramController.processPendingMessage);

// Polling endpoint for new uploads
router.get('/files/recent', telegramController.getRecentUploads);

// ArDrive related routes
router.get('/ardrive/balance', telegramController.getArDriveBalance);
router.get('/ardrive/pending', telegramController.getPendingArDriveUploads);
router.get('/ardrive/files/:fileId/cost', telegramController.getUploadCostEstimate);
router.post('/ardrive/files/:fileId/upload', telegramController.uploadFileToArDrive);

// File management routes
router.get('/files', telegramController.getAllFiles);
router.get('/files/:id', telegramController.getFileById);
router.get('/files/:id/download', telegramController.downloadFileById);
router.delete('/files/:id', telegramController.deleteFileById);

export default router; 