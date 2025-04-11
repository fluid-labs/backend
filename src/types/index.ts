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
