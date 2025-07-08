// Token price controller
import { Request, Response } from "express";
import {
    getTokenPrice,
    getSupportedTokens,
} from "../services/tokenPriceService";

/**
 * Get token price by symbol via query parameter
 * @param req Express request
 * @param res Express response
 */
export const getTokenPriceBySymbol = async (req: Request, res: Response) => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== "string") {
            return res.status(400).json({
                error: "Missing or invalid token parameter",
                message:
                    "Please provide a valid token symbol as a query parameter",
                supportedTokens: getSupportedTokens(),
                example: "/api/token-price?token=AO",
            });
        }

        const priceInfo = await getTokenPrice(token);
        res.status(200).json(priceInfo);
    } catch (error: any) {
        console.error("Error fetching token price:", error);

        if (error.message.includes("Unsupported token")) {
            return res.status(400).json({
                error: "Unsupported token",
                message: error.message,
                supportedTokens: getSupportedTokens(),
            });
        }

        res.status(500).json({
            error: "Failed to fetch token price",
            message: error.message || "Unknown error",
        });
    }
};

/**
 * Get list of supported tokens
 * @param req Express request
 * @param res Express response
 */
export const getSupportedTokensList = async (req: Request, res: Response) => {
    try {
        const tokens = getSupportedTokens();
        res.status(200).json({
            supportedTokens: tokens,
            count: tokens.length,
            examples: tokens.map((token) => `/api/token-price?token=${token}`),
        });
    } catch (error: any) {
        console.error("Error getting supported tokens:", error);
        res.status(500).json({
            error: "Failed to get supported tokens",
            message: error.message || "Unknown error",
        });
    }
};
