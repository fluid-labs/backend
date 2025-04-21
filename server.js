// server.js
// Backend API server for email and document services

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// In-memory storage for documents
const documents = new Map();

// Create a test email transporter (for development only)
const emailTransporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: 'ethereal.user@ethereal.email',
    pass: 'ethereal.password'
  }
});

// Email API routes
const emailRouter = express.Router();

emailRouter.post('/send', async (req, res) => {
  try {
    const { to, subject, body, from } = req.body;
    
    // Validate required fields
    if (!to) {
      return res.status(400).json({ error: 'Recipient (to) is required' });
    }
    
    if (!body) {
      return res.status(400).json({ error: 'Email body is required' });
    }
    
    console.log(`Sending email to: ${to}`);
    console.log(`Subject: ${subject || 'No Subject'}`);
    
    // In a real application, you would send the email here
    // For development, we'll just log it
    console.log('Email details:');
    console.log(`From: ${from || 'noreply@example.com'}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject || 'No Subject'}`);
    console.log(`Body: ${body}`);
    
    // Simulate sending email
    /*
    const info = await emailTransporter.sendMail({
      from: from || 'noreply@example.com',
      to,
      subject: subject || 'No Subject',
      text: body
    });
    */
    
    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      // messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

// Document API routes
const documentRouter = express.Router();

documentRouter.post('/', (req, res) => {
  try {
    const { fileName, fileSize, contentType, content, uploadedBy, department } = req.body;
    
    // Validate required fields
    if (!fileName) {
      return res.status(400).json({ error: 'File name is required' });
    }
    
    // Generate a document ID
    const documentId = `doc-${uuidv4()}`;
    
    // Create the document
    const document = {
      id: documentId,
      fileName,
      fileSize: fileSize || 0,
      contentType: contentType || 'application/octet-stream',
      content: content || '',
      uploadedBy: uploadedBy || 'anonymous',
      department: department || 'general',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store the document
    documents.set(documentId, document);
    
    console.log(`Document created: ${documentId}`);
    console.log(`File name: ${fileName}`);
    
    return res.status(201).json({
      success: true,
      message: 'Document created successfully',
      document: {
        ...document,
        content: document.content.length > 100 ? document.content.substring(0, 100) + '...' : document.content
      }
    });
  } catch (error) {
    console.error('Error creating document:', error);
    return res.status(500).json({ error: 'Failed to create document' });
  }
});

documentRouter.get('/', (req, res) => {
  try {
    // Convert the Map to an array of documents
    const documentList = Array.from(documents.values()).map(doc => ({
      ...doc,
      content: doc.content.length > 100 ? doc.content.substring(0, 100) + '...' : doc.content
    }));
    
    return res.status(200).json({
      success: true,
      documents: documentList
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    return res.status(500).json({ error: 'Failed to list documents' });
  }
});

documentRouter.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the document exists
    if (!documents.has(id)) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Get the document
    const document = documents.get(id);
    
    return res.status(200).json({
      success: true,
      document: {
        ...document,
        content: document.content.length > 100 ? document.content.substring(0, 100) + '...' : document.content
      }
    });
  } catch (error) {
    console.error('Error getting document:', error);
    return res.status(500).json({ error: 'Failed to get document' });
  }
});

documentRouter.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { fileName, fileSize, contentType, content, uploadedBy, department } = req.body;
    
    // Check if the document exists
    if (!documents.has(id)) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Get the document
    const document = documents.get(id);
    
    // Update the document
    const updatedDocument = {
      ...document,
      fileName: fileName || document.fileName,
      fileSize: fileSize !== undefined ? fileSize : document.fileSize,
      contentType: contentType || document.contentType,
      content: content !== undefined ? content : document.content,
      uploadedBy: uploadedBy || document.uploadedBy,
      department: department || document.department,
      updatedAt: new Date().toISOString()
    };
    
    // Store the updated document
    documents.set(id, updatedDocument);
    
    console.log(`Document updated: ${id}`);
    
    return res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      document: {
        ...updatedDocument,
        content: updatedDocument.content.length > 100 ? updatedDocument.content.substring(0, 100) + '...' : updatedDocument.content
      }
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return res.status(500).json({ error: 'Failed to update document' });
  }
});

documentRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the document exists
    if (!documents.has(id)) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Delete the document
    documents.delete(id);
    
    console.log(`Document deleted: ${id}`);
    
    return res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Register routes
app.use('/api/email', emailRouter);
app.use('/api/documents', documentRouter);

// Start the servers
const EMAIL_PORT = 3001;
const DOCUMENT_PORT = 3002;

// Start the email server
const emailServer = app.listen(EMAIL_PORT, () => {
  console.log(`Email API server running on port ${EMAIL_PORT}`);
});

// Create a separate instance for the document server
const documentApp = express();
documentApp.use(cors());
documentApp.use(express.json());
documentApp.use(morgan('dev'));
documentApp.use('/api/documents', documentRouter);

// Start the document server
const documentServer = documentApp.listen(DOCUMENT_PORT, () => {
  console.log(`Document API server running on port ${DOCUMENT_PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP servers');
  emailServer.close(() => {
    console.log('Email API server closed');
  });
  documentServer.close(() => {
    console.log('Document API server closed');
  });
});
