import { Request, Response } from 'express';
import DigitalFile from '../models/DigitalFile';
import DigitalItem from '../models/DigitalItem';

// Get all files for a digital item
export const getFilesForItem = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { itemId } = req.params;

    // First verify the item belongs to the user
    const item = await DigitalItem.findOne({
      where: { id: itemId, userId: req.user.id },
    });

    if (!item) {
      res.status(404).json({ error: 'Digital item not found' });
      return;
    }

    const files = await DigitalFile.findAll({
      where: { digitalItemId: itemId },
      order: [
        ['isPrimary', 'DESC'], // Primary file first
        ['createdAt', 'ASC'],
      ],
    });

    res.json({ files });
  } catch (error: any) {
    console.error('Get files error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Add a new file to a digital item
export const addFileToItem = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { itemId } = req.params;
    const { format, filePath, fileSize, version, notes, isPrimary } = req.body;

    // Validate required fields
    if (!format || !filePath) {
      res.status(400).json({
        error: 'Validation error',
        message: 'format and filePath are required',
      });
      return;
    }

    // Verify the item belongs to the user
    const item = await DigitalItem.findOne({
      where: { id: itemId, userId: req.user.id },
    });

    if (!item) {
      res.status(404).json({ error: 'Digital item not found' });
      return;
    }

    // If this file is set as primary, unset other primary files
    if (isPrimary) {
      await DigitalFile.update(
        { isPrimary: false },
        { where: { digitalItemId: itemId } }
      );
    }

    const file = await DigitalFile.create({
      digitalItemId: parseInt(itemId),
      format,
      filePath,
      fileSize: fileSize ? parseInt(fileSize) : undefined,
      version,
      notes,
      isPrimary: isPrimary || false,
    });

    res.status(201).json({ file });
  } catch (error: any) {
    console.error('Add file error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Update a digital file
export const updateFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { fileId } = req.params;
    const { format, filePath, fileSize, version, notes, isPrimary } = req.body;

    // Find the file and verify ownership through the item
    const file = await DigitalFile.findByPk(fileId, {
      include: [
        {
          model: DigitalItem,
          as: 'digitalItem',
          where: { userId: req.user.id },
        },
      ],
    });

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // If this file is being set as primary, unset other primary files
    if (isPrimary && !file.isPrimary) {
      await DigitalFile.update(
        { isPrimary: false },
        { where: { digitalItemId: file.digitalItemId } }
      );
    }

    // Update the file
    await file.update({
      format: format || file.format,
      filePath: filePath || file.filePath,
      fileSize: fileSize !== undefined ? parseInt(fileSize) : file.fileSize,
      version: version !== undefined ? version : file.version,
      notes: notes !== undefined ? notes : file.notes,
      isPrimary: isPrimary !== undefined ? isPrimary : file.isPrimary,
    });

    res.json({ file });
  } catch (error: any) {
    console.error('Update file error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Delete a digital file
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { fileId } = req.params;

    // Find the file and verify ownership through the item
    const file = await DigitalFile.findByPk(fileId, {
      include: [
        {
          model: DigitalItem,
          as: 'digitalItem',
          where: { userId: req.user.id },
        },
      ],
    });

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    await file.destroy();

    res.json({ message: 'File deleted successfully' });
  } catch (error: any) {
    console.error('Delete file error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Set a file as primary
export const setPrimaryFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { fileId } = req.params;

    // Find the file and verify ownership through the item
    const file = await DigitalFile.findByPk(fileId, {
      include: [
        {
          model: DigitalItem,
          as: 'digitalItem',
          where: { userId: req.user.id },
        },
      ],
    });

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    // Unset all primary files for this item
    await DigitalFile.update(
      { isPrimary: false },
      { where: { digitalItemId: file.digitalItemId } }
    );

    // Set this file as primary
    await file.update({ isPrimary: true });

    res.json({ file });
  } catch (error: any) {
    console.error('Set primary file error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};
