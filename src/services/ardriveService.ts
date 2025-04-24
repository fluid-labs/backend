import { TurboFactory, EthereumSigner } from '@ardrive/turbo-sdk';
import * as fs from 'fs';

// Interface for ArDrive upload result
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

// Interface for ArDrive file metadata
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

// Interface for cost estimate
export interface CostEstimate {
    winc: number;
    ar: string;
    usd?: string;
    sufficient: boolean;
}

// Initialize ArDrive service
class ArDriveService {
    private privateKey: string;
    private isInitialized: boolean = false;
    private turbo: any; // Using any type for now as the SDK types might be complex

    constructor() {
        this.privateKey = process.env.PRIVATE_KEY || '';
    }

    // Initialize the ArDrive service
    public async initialize(): Promise<boolean> {
        if (!this.privateKey) {
            console.error('PRIVATE_KEY is not set. ArDrive upload will not work.');
            return false;
        }

        if (this.isInitialized) {
            return true;
        }

        try {
            // Initialize the ArDrive signer
            const signer = new EthereumSigner(this.privateKey);
            this.turbo = TurboFactory.authenticated({ signer });
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Error initializing ArDrive service:', error);
            return false;
        }
    }

    // Get the upload cost for a given file size
    public async getUploadCost(fileSize: number): Promise<CostEstimate> {
        try {
            if (!this.isInitialized) {
                const initialized = await this.initialize();
                if (!initialized) {
                    return {
                        winc: 0,
                        ar: "0",
                        sufficient: false
                    };
                }
            }

            // Get the current balance
            const { winc: balance } = await this.turbo.getBalance();

            // Get the cost of uploading the file
            const [{ winc: fileSizeCost }] = await this.turbo.getUploadCosts({
                bytes: [fileSize],
            });

            // Convert winc to AR (1 AR = 1000000000000 winston)
            const ar = fileSizeCost / 1000000000000;

            return {
                winc: fileSizeCost,
                ar: ar.toFixed(6),
                sufficient: balance >= fileSizeCost
            };
        } catch (error) {
            console.error('Error getting upload cost:', error);
            return {
                winc: 0,
                ar: "0",
                sufficient: false
            };
        }
    }

    // Upload a file to ArDrive
    public async uploadFile(filePath: string, contentType: string = 'application/octet-stream', customTags: { name: string, value: string }[] = []): Promise<ArDriveUploadResult> {
        try {
            if (!this.isInitialized) {
                const initialized = await this.initialize();
                if (!initialized) {
                    return {
                        success: false,
                        error: 'ArDrive service not initialized'
                    };
                }
            }

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                return {
                    success: false,
                    error: `File not found: ${filePath}`
                };
            }

            // Get file size
            const fileSize = fs.statSync(filePath).size;

            // Get the wallet balance
            const { winc: balance } = await this.turbo.getBalance();

            // Get the cost of uploading the file
            const [{ winc: fileSizeCost }] = await this.turbo.getUploadCosts({
                bytes: [fileSize],
            });

            // Check if balance is sufficient
            if (balance < fileSizeCost) {
                console.warn(`Insufficient balance for upload: ${balance} < ${fileSizeCost}`);

                // Get wallet address
                const owner = await this.turbo.getAddress();

                // Create checkout session (in a real application, you'd handle this differently)
                const { url } = await this.turbo.createCheckoutSession({
                    amount: fileSizeCost,
                    owner,
                });

                return {
                    success: false,
                    error: 'Insufficient balance for upload',
                    url
                };
            }

            // Default content-type tag
            const defaultTags = [
                {
                    name: "Content-Type",
                    value: contentType,
                }
            ];

            // Combine default tags with custom tags
            const tags = [...defaultTags, ...customTags];

            // Upload the file
            const { id, owner, dataCaches, fastFinalityIndexes } = await this.turbo.uploadFile({
                fileStreamFactory: () => fs.createReadStream(filePath),
                fileSizeFactory: () => fileSize,
                dataItemOpts: {
                    tags,
                },
            });

            console.log('Successfully uploaded file to ArDrive:', { id, owner });

            // Get the gateway URL
            const arweaveUrl = `https://arweave.net/${id}`;

            return {
                success: true,
                id,
                owner,
                dataCaches,
                fastFinalityIndexes,
                txId: id,
                url: arweaveUrl
            };
        } catch (error) {
            console.error('Failed to upload file to ArDrive:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    // Get the current wallet balance
    public async getBalance(): Promise<{ balance: number; formattedBalance: string }> {
        try {
            if (!this.isInitialized) {
                const initialized = await this.initialize();
                if (!initialized) {
                    return { balance: 0, formattedBalance: '0 AR' };
                }
            }

            const { winc } = await this.turbo.getBalance();
            // Convert winc to AR (1 AR = 1000000000000 winston)
            const ar = winc / 1000000000000;
            return {
                balance: winc,
                formattedBalance: `${ar.toFixed(6)} AR`
            };
        } catch (error) {
            console.error('Error getting ArDrive balance:', error);
            return { balance: 0, formattedBalance: '0 AR' };
        }
    }

    // Get the wallet address
    public async getAddress(): Promise<string> {
        try {
            if (!this.isInitialized) {
                const initialized = await this.initialize();
                if (!initialized) {
                    return '';
                }
            }

            return await this.turbo.getAddress();
        } catch (error) {
            console.error('Error getting ArDrive address:', error);
            return '';
        }
    }
}

// Create a singleton instance
const ardriveService = new ArDriveService();

export default ardriveService; 