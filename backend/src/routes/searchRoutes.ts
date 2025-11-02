import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { FTSService } from '../services/fts.service';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

/**
 * Search all items (digital and physical)
 * GET /api/search?q=query&limit=50&offset=0
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { q, limit, offset } = req.query;
    const userId = req.user.id;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
      return;
    }

    const searchLimit = limit ? parseInt(limit as string, 10) : 50;
    const searchOffset = offset ? parseInt(offset as string, 10) : 0;

    const result = await FTSService.searchAllItems(q, userId, {
      limit: searchLimit,
      offset: searchOffset
    });

    res.json({
      success: true,
      query: q,
      items: result.items,
      total: result.total,
      limit: searchLimit,
      offset: searchOffset
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform search',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Search digital items only
 * GET /api/search/digital?q=query&limit=50&offset=0
 */
router.get('/digital', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { q, limit, offset } = req.query;
    const userId = req.user.id;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
      return;
    }

    const searchLimit = limit ? parseInt(limit as string, 10) : 50;
    const searchOffset = offset ? parseInt(offset as string, 10) : 0;

    const result = await FTSService.searchDigitalItems(q, userId, {
      limit: searchLimit,
      offset: searchOffset
    });

    res.json({
      success: true,
      query: q,
      items: result.items,
      total: result.total,
      limit: searchLimit,
      offset: searchOffset
    });
  } catch (error) {
    console.error('Digital search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search digital items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Search physical items only
 * GET /api/search/physical?q=query&limit=50&offset=0
 */
router.get('/physical', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { q, limit, offset } = req.query;
    const userId = req.user.id;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
      return;
    }

    const searchLimit = limit ? parseInt(limit as string, 10) : 50;
    const searchOffset = offset ? parseInt(offset as string, 10) : 0;

    const result = await FTSService.searchPhysicalItems(q, userId, {
      limit: searchLimit,
      offset: searchOffset
    });

    res.json({
      success: true,
      query: q,
      items: result.items,
      total: result.total,
      limit: searchLimit,
      offset: searchOffset
    });
  } catch (error) {
    console.error('Physical search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search physical items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
