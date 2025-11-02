import { Router, Request, Response } from 'express';
import { lccnLookupService } from '../services/lccnLookupService';
import { authenticateJWT } from '../middleware/auth';
import PhysicalItem from '../models/PhysicalItem';
import DigitalItem from '../models/DigitalItem';
import { Op } from 'sequelize';

const router = Router();

/**
 * GET /api/lccn/lookup/:lccn
 * Lookup book metadata by LCCN (Library of Congress Control Number)
 *
 * Uses Open Library API to fetch book metadata
 * Returns standardized book metadata
 * PROTECTED - Requires authentication
 */
router.get('/lookup/:lccn', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { lccn } = req.params;

    if (!lccn) {
      res.status(400).json({ error: 'LCCN parameter is required' });
      return;
    }

    // Lookup LCCN
    const bookData = await lccnLookupService.lookupByLCCN(lccn);

    if (!bookData) {
      res.status(404).json({
        found: false,
        error: 'Book not found',
        message: `No book found with LCCN: ${lccn}`,
      });
      return;
    }

    res.json({
      found: true,
      source: 'open-library',
      data: bookData,
    });
    return;
  } catch (error: any) {
    console.error('Error looking up LCCN:', error);

    res.status(500).json({
      error: 'LCCN lookup failed',
      message: 'An error occurred while looking up the LCCN',
    });
    return;
  }
});

/**
 * GET /api/lccn/check-duplicate/:lccn
 * Check if an LCCN already exists in the library
 *
 * Returns whether the LCCN exists in physical or digital items
 * PROTECTED - Requires authentication
 */
router.get('/check-duplicate/:lccn', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { lccn } = req.params;
    const userId = (req.user as any)?.id;

    if (!lccn) {
      res.status(400).json({ error: 'LCCN parameter is required' });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Normalize LCCN for comparison (remove hyphens and spaces)
    const normalizedLCCN = lccn.replace(/[-\s]/g, '').toLowerCase();

    // Search in physical items
    const physicalItem = await PhysicalItem.findOne({
      where: {
        userId,
        lccn: {
          [Op.or]: [
            normalizedLCCN,
            lccn // Also try original format
          ]
        }
      }
    });

    // Search in digital items
    const digitalItem = await DigitalItem.findOne({
      where: {
        userId,
        lccn: {
          [Op.or]: [
            normalizedLCCN,
            lccn // Also try original format
          ]
        }
      }
    });

    const isDuplicate = !!(physicalItem || digitalItem);
    const existingItem = physicalItem || digitalItem;

    res.json({
      isDuplicate,
      itemType: physicalItem ? 'physical' : digitalItem ? 'digital' : null,
      item: existingItem ? {
        id: existingItem.id,
        title: existingItem.title,
        lccn: existingItem.lccn,
        coverImage: existingItem.coverImage
      } : null
    });
    return;
  } catch (error) {
    console.error('Error checking duplicate LCCN:', error);
    res.status(500).json({ error: 'Failed to check for duplicates' });
    return;
  }
});

export default router;
