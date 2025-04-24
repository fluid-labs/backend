// Common type definitions for the application

export interface Automation {
  id: string;
  name: string;
  description?: string;
  when: string;
  then: string;
  target?: string;
  createdAt: Date;
  updatedAt?: Date;
  status: 'active' | 'inactive' | 'error';
  processId?: string;
}

export interface AutomationCreateRequest {
  name: string;
  description?: string;
  when: string;
  then: string;
  target?: string;
}

export interface AutomationUpdateRequest {
  name?: string;
  description?: string;
  when?: string;
  then?: string;
  target?: string;
  status?: 'active' | 'inactive';
}

export interface AOProcess {
  id: string;
  name?: string;
  type: string;
  status: 'running' | 'stopped' | 'error';
  createdAt: Date;
}

export interface ErrorResponse {
  error: boolean;
  message: string;
  stack?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

// Custom error class for API errors
export class APIError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}

// Global application types

// Health response for health check endpoint
export interface HealthResponse {
  status: string;
  timestamp: string;
}

// Error response for API errors
export interface ErrorResponse {
  error: boolean;
  message: string;
  stack?: string;
}

// Telegram file interface
export interface TelegramFile {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedBy: string;
  telegramFileId: string;
  fileUrl?: string;
  localPath?: string;
  createdAt: Date;
  // ArDrive properties
  arweaveId?: string;
  arweaveUrl?: string;
  arweaveUploadStatus?: 'pending' | 'success' | 'failed';
  arweaveUploadError?: string;
}

// Telegram message interface for storing pending messages
export interface TelegramMessage {
  id: string;
  type: 'document' | 'photo' | 'text';
  context: any; // The Telegram context object
  receivedAt: Date;
  processed?: boolean;
}

// Workflow interface
export interface Workflow {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  nodes: WorkflowNode[];
  createdAt: Date;
  updatedAt?: Date;
}

// Workflow node interface
export interface WorkflowNode {
  id: string;
  type: 'telegram_receive' | 'ardrive_upload' | 'other';
  config: any;
  position: { x: number; y: number };
}

// AO Connection interfaces
export interface AOConnectionRequest {
  processId: string;
  emailBotId?: string;
}

export interface AOConnectionResult {
  connected: boolean;
  processId: string;
  emailBotId?: string;
  error?: string;
}

// Target interface
export interface Target {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// ArDrive interfaces
export interface ArDriveUploadResult {
  success: boolean;
  id?: string;
  owner?: string;
  dataCaches?: string[];
  fastFinalityIndexes?: number[];
  error?: string;
  txId?: string;
  url?: string;
}

export interface ArDriveFile {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedBy: string;
  arweaveId?: string;
  arweaveUrl?: string;
  uploadedAt: Date;
}
