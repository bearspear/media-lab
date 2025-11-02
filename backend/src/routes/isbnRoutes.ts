import { Router, Request, Response } from 'express';
import { isbnLookupService } from '../services/isbnLookupService';
import { authenticateJWT } from '../middleware/auth';
import PhysicalItem from '../models/PhysicalItem';
import DigitalItem from '../models/DigitalItem';
import { Op } from 'sequelize';

const router = Router();

/**
 * GET /api/isbn/lookup/:isbn
 * Lookup book metadata by ISBN
 *
 * Tries Google Books API first, then falls back to Open Library
 * Returns standardized book metadata
 * PROTECTED - Requires authentication
 */
router.get('/lookup/:isbn', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { isbn } = req.params;

    if (!isbn) {
      res.status(400).json({ error: 'ISBN parameter is required' });
      return;
    }

    // Lookup ISBN
    const bookData = await isbnLookupService.lookupByISBN(isbn);

    if (!bookData) {
      res.status(404).json({
        found: false,
        error: 'Book not found',
        message: `No book found with ISBN: ${isbn}`,
      });
      return;
    }

    // Determine which source was used
    const source = bookData.coverImage?.includes('googleapis') ? 'google-books' : 'open-library';

    res.json({
      found: true,
      source,
      data: bookData,
    });
    return;
  } catch (error: any) {
    console.error('Error looking up ISBN:', error);

    // Handle validation errors
    if (error.message === 'Invalid ISBN format') {
      res.status(400).json({
        error: 'Invalid ISBN',
        message: 'The provided ISBN is not in a valid ISBN-10 or ISBN-13 format',
      });
      return;
    }

    res.status(500).json({
      error: 'ISBN lookup failed',
      message: 'An error occurred while looking up the ISBN',
    });
    return;
  }
});

/**
 * GET /api/isbn/check-duplicate/:isbn
 * Check if an ISBN already exists in the library
 *
 * Returns whether the ISBN exists in physical or digital items
 * PROTECTED - Requires authentication
 */
router.get('/check-duplicate/:isbn', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { isbn } = req.params;
    const userId = (req.user as any)?.id;

    if (!isbn) {
      res.status(400).json({ error: 'ISBN parameter is required' });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Normalize ISBN for comparison (remove hyphens and spaces)
    const normalizedISBN = isbn.replace(/[-\s]/g, '').toUpperCase();

    // Search in physical items
    const physicalItem = await PhysicalItem.findOne({
      where: {
        userId,
        isbn: {
          [Op.or]: [
            normalizedISBN,
            isbn // Also try original format
          ]
        }
      }
    });

    // Search in digital items
    const digitalItem = await DigitalItem.findOne({
      where: {
        userId,
        isbn: {
          [Op.or]: [
            normalizedISBN,
            isbn // Also try original format
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
        isbn: existingItem.isbn,
        coverImage: existingItem.coverImage
      } : null
    });
    return;
  } catch (error) {
    console.error('Error checking duplicate ISBN:', error);
    res.status(500).json({ error: 'Failed to check for duplicates' });
    return;
  }
});

/**
 * GET /api/isbn/validate/:isbn
 * Validate ISBN format without doing a lookup
 *
 * Returns whether the ISBN is in valid ISBN-10 or ISBN-13 format
 * PROTECTED - Requires authentication
 */
router.get('/validate/:isbn', authenticateJWT, async (req: Request, res: Response): Promise<void> => {
  try {
    const { isbn } = req.params;

    if (!isbn) {
      res.status(400).json({ error: 'ISBN parameter is required' });
      return;
    }

    // Try to validate
    try {
      const normalizedISBN = isbn.replace(/[-\s]/g, '').toUpperCase();
      const isValid = await isbnLookupService.lookupByISBN(isbn) !== null;

      res.json({
        valid: true, // If we got here, format is valid
        isbn: normalizedISBN,
        format: normalizedISBN.length === 10 ? 'ISBN-10' : normalizedISBN.length === 13 ? 'ISBN-13' : 'Unknown',
      });
      return;
    } catch (error: any) {
      if (error.message === 'Invalid ISBN format') {
        res.json({
          valid: false,
          isbn: isbn,
          error: 'Invalid ISBN format',
        });
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error validating ISBN:', error);
    res.status(500).json({ error: 'Failed to validate ISBN' });
    return;
  }
});

export default router;
