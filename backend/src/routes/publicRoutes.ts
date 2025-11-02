import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

/**
 * GET /public/proxy-image
 * Proxy cover image downloads to bypass CORS restrictions
 * PUBLIC ENDPOINT - No authentication required
 *
 * Accepts a URL parameter and fetches the image server-side,
 * then returns it to the client
 */
router.get('/proxy-image', async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL parameter is required' });
      return;
    }

    console.log('[Public Proxy] Fetching image from:', url);

    // Fetch the image from the external URL
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000, // 10 second timeout
    });

    // Get content type from response headers
    const contentType = response.headers['content-type'] || 'image/jpeg';

    console.log('[Public Proxy] Image fetched successfully, content-type:', contentType);

    // Set appropriate headers and send the image
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(Buffer.from(response.data));
  } catch (error: any) {
    console.error('[Public Proxy] Error fetching image:', error.message);
    res.status(500).json({
      error: 'Failed to fetch image',
      message: error.message,
    });
  }
});

export default router;
