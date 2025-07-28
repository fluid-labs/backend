// Token price routes
import { Router } from "express";
import {
    getTokenPriceBySymbol,
    getSupportedTokensList,
} from "../controllers/tokenPriceController";

const router: Router = Router();

/**
 * @route GET /api/token-price?token={symbol}
 * @desc Get token price by symbol (AO, AR, ARIO, TRUNK, GAME)
 * @access Public
 * @example /api/token-price?token=AO
 */
router.get("/", getTokenPriceBySymbol);

/**
 * @route GET /api/token-price/supported
 * @desc Get list of supported tokens
 * @access Public
 */
router.get("/supported", getSupportedTokensList);

export default router;
