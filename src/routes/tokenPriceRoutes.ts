// Token price routes
import { Router } from 'express';
import { getArweavePrice, getUpdatedPrice } from '../controllers/tokenPriceController';

const router = Router();

/**
 * @route GET /api/token-price/arweave
 * @desc Get Arweave token price using the Get-Oracle-Price action
 * @access Public
 */
router.get('/arweave', getArweavePrice);

/**
 * @route GET /api/token-price/updated
 * @desc Get updated token price using the Get-Price-For-Token action
 * @access Public
 */
router.get('/updated', getUpdatedPrice);

export default router;
