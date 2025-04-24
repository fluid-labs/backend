// Token price controller
import { Request, Response } from 'express';
import { getArweaveTokenPrice, getUpdatedTokenPrice } from '../services/tokenPriceService';

/**
 * Get Arweave token price using the Get-Oracle-Price action
 * @param req Express request
 * @param res Express response
 */
export const getArweavePrice = async (req: Request, res: Response) => {
  try {
    const priceInfo = await getArweaveTokenPrice();
    res.status(200).json(priceInfo);
  } catch (error: any) {
    console.error('Error fetching Arweave price:', error);
    res.status(500).json({
      error: 'Failed to fetch Arweave price',
      message: error.message || 'Unknown error'
    });
  }
};

/**
 * Get updated token price using the Get-Price-For-Token action
 * @param req Express request
 * @param res Express response
 */
export const getUpdatedPrice = async (req: Request, res: Response) => {
  try {
    const priceInfo = await getUpdatedTokenPrice();
    res.status(200).json(priceInfo);
  } catch (error: any) {
    console.error('Error fetching updated token price:', error);
    res.status(500).json({
      error: 'Failed to fetch updated token price',
      message: error.message || 'Unknown error'
    });
  }
};
