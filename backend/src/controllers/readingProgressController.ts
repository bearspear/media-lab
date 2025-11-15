import { Request, Response } from 'express';
import ReadingProgress from '../models/ReadingProgress';
import DigitalItem from '../models/DigitalItem';
import DigitalFile from '../models/DigitalFile';

// Get reading progress for a specific item
export const getProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { itemId } = req.params;
    const { fileId } = req.query;

    const where: any = {
      userId: req.user.id,
      digitalItemId: parseInt(itemId),
    };

    if (fileId) {
      where.digitalFileId = parseInt(fileId as string);
    }

    const progress = await ReadingProgress.findOne({
      where,
      include: [
        {
          model: DigitalItem,
          as: 'digitalItem',
          attributes: ['id', 'title'],
        },
        {
          model: DigitalFile,
          as: 'digitalFile',
          attributes: ['id', 'format', 'filePath'],
        },
      ],
      order: [['lastReadAt', 'DESC']],
    });

    if (!progress) {
      res.status(404).json({ error: 'No reading progress found' });
      return;
    }

    res.json({ progress });
  } catch (error: any) {
    console.error('Get reading progress error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Save or update reading progress
export const saveProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { digitalItemId, digitalFileId, location, percentage } = req.body;

    // Validation
    if (!digitalItemId || location === undefined || percentage === undefined) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['digitalItemId', 'location', 'percentage'],
      });
      return;
    }

    // Verify the digital item belongs to the user
    const item = await DigitalItem.findOne({
      where: {
        id: digitalItemId,
        userId: req.user.id,
      },
    });

    if (!item) {
      res.status(404).json({ error: 'Digital item not found' });
      return;
    }

    // Find or create reading progress
    const [progress, created] = await ReadingProgress.upsert(
      {
        userId: req.user.id,
        digitalItemId,
        digitalFileId: digitalFileId || null,
        location,
        percentage: Math.min(100, Math.max(0, parseFloat(percentage))),
        lastReadAt: new Date(),
      },
      {
        conflictFields: ['user_id', 'digital_item_id', 'digital_file_id'],
        returning: true,
      }
    );

    res.json({
      message: created ? 'Reading progress created' : 'Reading progress updated',
      progress,
    });
  } catch (error: any) {
    console.error('Save reading progress error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Get recent reading activity
export const getRecentProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { limit = 10 } = req.query;

    const recentProgress = await ReadingProgress.findAll({
      where: {
        userId: req.user.id,
      },
      include: [
        {
          model: DigitalItem,
          as: 'digitalItem',
          attributes: ['id', 'title', 'coverImage', 'type'],
        },
        {
          model: DigitalFile,
          as: 'digitalFile',
          attributes: ['id', 'format', 'filePath'],
        },
      ],
      order: [['lastReadAt', 'DESC']],
      limit: parseInt(limit as string),
    });

    res.json({ progress: recentProgress, total: recentProgress.length });
  } catch (error: any) {
    console.error('Get recent progress error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Get all reading progress for the user
export const getAllProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const allProgress = await ReadingProgress.findAll({
      where: {
        userId: req.user.id,
      },
      include: [
        {
          model: DigitalItem,
          as: 'digitalItem',
          attributes: ['id', 'title', 'coverImage', 'type'],
        },
        {
          model: DigitalFile,
          as: 'digitalFile',
          attributes: ['id', 'format'],
        },
      ],
      order: [['lastReadAt', 'DESC']],
    });

    res.json({ progress: allProgress, total: allProgress.length });
  } catch (error: any) {
    console.error('Get all progress error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Delete reading progress
export const deleteProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { itemId } = req.params;
    const { fileId } = req.query;

    const where: any = {
      userId: req.user.id,
      digitalItemId: parseInt(itemId),
    };

    if (fileId) {
      where.digitalFileId = parseInt(fileId as string);
    }

    const deleted = await ReadingProgress.destroy({ where });

    if (deleted === 0) {
      res.status(404).json({ error: 'Reading progress not found' });
      return;
    }

    res.json({ message: 'Reading progress deleted successfully' });
  } catch (error: any) {
    console.error('Delete reading progress error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};
