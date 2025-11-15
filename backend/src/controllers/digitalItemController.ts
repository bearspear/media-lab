import { Request, Response } from 'express';
import { Op } from 'sequelize';
import DigitalItem from '../models/DigitalItem';
import DigitalFile from '../models/DigitalFile';
import Author from '../models/Author';
import Publisher from '../models/Publisher';
import Genre from '../models/Genre';
import ReadingProgress from '../models/ReadingProgress';

// Get all digital items for the authenticated user
export const getDigitalItems = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Extract query parameters for filtering and sorting
    const {
      type,
      format,
      authorId,
      publisherId,
      genreId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      minRating,
      maxRating,
    } = req.query;

    // Build where clause
    const where: any = { userId: req.user.id };

    if (type) {
      where.type = type;
    }

    if (format) {
      where.format = format;
    }

    if (minRating || maxRating) {
      where.rating = {};
      if (minRating) where.rating[Op.gte] = parseFloat(minRating as string);
      if (maxRating) where.rating[Op.lte] = parseFloat(maxRating as string);
    }

    // Build include clause with optional filtering
    const include: any[] = [
      {
        model: Author,
        as: 'authors',
        attributes: ['id', 'name'],
        through: { attributes: [] },
        ...(authorId && { where: { id: authorId }, required: true }),
      },
      {
        model: Publisher,
        as: 'publisherInfo',
        attributes: ['id', 'name'],
        ...(publisherId && { where: { id: publisherId }, required: true }),
      },
      {
        model: Genre,
        as: 'genres',
        attributes: ['id', 'name'],
        through: { attributes: [] },
        ...(genreId && { where: { id: genreId }, required: true }),
      },
      {
        model: DigitalFile,
        as: 'files',
        attributes: ['id', 'format', 'filePath', 'fileSize', 'version', 'notes', 'isPrimary'],
        required: false,
      },
      {
        model: ReadingProgress,
        as: 'readingProgress',
        attributes: ['id', 'digitalFileId', 'location', 'percentage', 'lastReadAt'],
        required: false,
        where: { userId: req.user.id },
      },
    ];

    // Build order clause
    const validSortFields = ['title', 'createdAt', 'updatedAt', 'rating', 'publishedYear'];
    const orderField = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
    const orderDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const items = await DigitalItem.findAll({
      where,
      include,
      order: [[orderField as string, orderDirection]],
    });

    res.json({ items, total: items.length });
  } catch (error: any) {
    console.error('Get digital items error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Get a single digital item by ID
export const getDigitalItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const item = await DigitalItem.findOne({
      where: { id, userId: req.user.id },
      include: [
        {
          model: Author,
          as: 'authors',
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
        {
          model: Publisher,
          as: 'publisherInfo',
          attributes: ['id', 'name'],
        },
        {
          model: Genre,
          as: 'genres',
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
        {
          model: DigitalFile,
          as: 'files',
          attributes: ['id', 'format', 'filePath', 'fileSize', 'version', 'notes', 'isPrimary'],
        },
      ],
    });

    if (!item) {
      res.status(404).json({ error: 'Digital item not found' });
      return;
    }

    res.json({ item });
  } catch (error: any) {
    console.error('Get digital item error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Create a new digital item
export const createDigitalItem = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { authorIds, genreIds, ...itemData } = req.body;

    const item = await DigitalItem.create({
      ...itemData,
      userId: req.user.id,
    });

    // Set relationships
    if (authorIds && Array.isArray(authorIds)) {
      await (item as any).setAuthors(authorIds);
    }
    if (genreIds && Array.isArray(genreIds)) {
      await (item as any).setGenres(genreIds);
    }

    // Fetch the item with relationships
    const itemWithRelations = await DigitalItem.findByPk(item.id, {
      include: [
        {
          model: Author,
          as: 'authors',
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
        {
          model: Publisher,
          as: 'publisherInfo',
          attributes: ['id', 'name'],
        },
        {
          model: Genre,
          as: 'genres',
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
      ],
    });

    res.status(201).json({
      message: 'Digital item created successfully',
      item: itemWithRelations,
    });
  } catch (error: any) {
    console.error('Create digital item error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Update a digital item
export const updateDigitalItem = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { authorIds, genreIds, ...itemData } = req.body;

    const item = await DigitalItem.findOne({
      where: { id, userId: req.user.id },
    });

    if (!item) {
      res.status(404).json({ error: 'Digital item not found' });
      return;
    }

    await item.update(itemData);

    // Update relationships
    if (authorIds !== undefined && Array.isArray(authorIds)) {
      await (item as any).setAuthors(authorIds);
    }
    if (genreIds !== undefined && Array.isArray(genreIds)) {
      await (item as any).setGenres(genreIds);
    }

    // Fetch the item with relationships
    const itemWithRelations = await DigitalItem.findByPk(item.id, {
      include: [
        {
          model: Author,
          as: 'authors',
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
        {
          model: Publisher,
          as: 'publisherInfo',
          attributes: ['id', 'name'],
        },
        {
          model: Genre,
          as: 'genres',
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
      ],
    });

    res.json({
      message: 'Digital item updated successfully',
      item: itemWithRelations,
    });
  } catch (error: any) {
    console.error('Update digital item error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Delete a digital item
export const deleteDigitalItem = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const item = await DigitalItem.findOne({
      where: { id, userId: req.user.id },
    });

    if (!item) {
      res.status(404).json({ error: 'Digital item not found' });
      return;
    }

    await item.destroy();

    res.json({
      message: 'Digital item deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete digital item error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};
