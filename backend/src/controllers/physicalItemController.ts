import { Request, Response } from 'express';
import { Op } from 'sequelize';
import PhysicalItem from '../models/PhysicalItem';
import Author from '../models/Author';
import Publisher from '../models/Publisher';
import Genre from '../models/Genre';

// Get all physical items for the authenticated user
export const getPhysicalItems = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Extract query parameters for filtering and sorting
    const {
      type,
      condition,
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

    if (condition) {
      where.condition = condition;
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
    ];

    // Build order clause
    const validSortFields = ['title', 'createdAt', 'updatedAt', 'rating', 'publishedYear', 'quantity'];
    const orderField = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
    const orderDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const items = await PhysicalItem.findAll({
      where,
      include,
      order: [[orderField as string, orderDirection]],
    });

    res.json({ items, total: items.length });
  } catch (error: any) {
    console.error('Get physical items error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Get a single physical item by ID
export const getPhysicalItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const item = await PhysicalItem.findOne({
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
      ],
    });

    if (!item) {
      res.status(404).json({ error: 'Physical item not found' });
      return;
    }

    res.json({ item });
  } catch (error: any) {
    console.error('Get physical item error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Create a new physical item
export const createPhysicalItem = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { authorIds, genreIds, ...itemData } = req.body;

    const item = await PhysicalItem.create({
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
    const itemWithRelations = await PhysicalItem.findByPk(item.id, {
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
      message: 'Physical item created successfully',
      item: itemWithRelations,
    });
  } catch (error: any) {
    console.error('Create physical item error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Update a physical item
export const updatePhysicalItem = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { authorIds, genreIds, ...itemData } = req.body;

    const item = await PhysicalItem.findOne({
      where: { id, userId: req.user.id },
    });

    if (!item) {
      res.status(404).json({ error: 'Physical item not found' });
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
    const itemWithRelations = await PhysicalItem.findByPk(item.id, {
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
      message: 'Physical item updated successfully',
      item: itemWithRelations,
    });
  } catch (error: any) {
    console.error('Update physical item error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};

// Delete a physical item
export const deletePhysicalItem = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const item = await PhysicalItem.findOne({
      where: { id, userId: req.user.id },
    });

    if (!item) {
      res.status(404).json({ error: 'Physical item not found' });
      return;
    }

    await item.destroy();

    res.json({
      message: 'Physical item deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete physical item error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};
