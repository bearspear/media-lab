import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { Publisher, DigitalItem, PhysicalItem } from '../models';

const router = Router();

// Get all publishers
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const publishers = await Publisher.findAll({
      order: [['name', 'ASC']],
    });
    res.json(publishers);
    return;
  } catch (error) {
    console.error('Error fetching publishers:', error);
    res.status(500).json({ error: 'Failed to fetch publishers' });
    return;
  }
});

// Get publisher by ID with associated items
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const publisher = await Publisher.findByPk(req.params.id, {
      include: [
        {
          model: DigitalItem,
          as: 'digitalItems',
        },
        {
          model: PhysicalItem,
          as: 'physicalItems',
        },
      ],
    });

    if (!publisher) {
      res.status(404).json({ error: 'Publisher not found' });
      return;
    }

    res.json(publisher);
    return;
  } catch (error) {
    console.error('Error fetching publisher:', error);
    res.status(500).json({ error: 'Failed to fetch publisher' });
    return;
  }
});

// Search publishers by name
router.get('/search/:query', async (req: Request, res: Response): Promise<void> => {
  try {
    const publishers = await Publisher.findAll({
      where: {
        name: {
          [Op.like]: `%${req.params.query}%`,
        },
      },
      order: [['name', 'ASC']],
    });
    res.json(publishers);
    return;
  } catch (error) {
    console.error('Error searching publishers:', error);
    res.status(500).json({ error: 'Failed to search publishers' });
    return;
  }
});

// Create new publisher
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if publisher with same name already exists
    const existingPublisher = await Publisher.findOne({
      where: { name: req.body.name },
    });

    if (existingPublisher) {
      res.status(409).json({ error: 'Publisher with this name already exists' });
      return;
    }

    const publisher = await Publisher.create(req.body);
    res.status(201).json(publisher);
    return;
  } catch (error) {
    console.error('Error creating publisher:', error);
    res.status(500).json({ error: 'Failed to create publisher' });
    return;
  }
});

// Update publisher
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const publisher = await Publisher.findByPk(req.params.id);

    if (!publisher) {
      res.status(404).json({ error: 'Publisher not found' });
      return;
    }

    await publisher.update(req.body);
    res.json(publisher);
    return;
  } catch (error) {
    console.error('Error updating publisher:', error);
    res.status(500).json({ error: 'Failed to update publisher' });
    return;
  }
});

// Delete publisher
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const publisher = await Publisher.findByPk(req.params.id);

    if (!publisher) {
      res.status(404).json({ error: 'Publisher not found' });
      return;
    }

    await publisher.destroy();
    res.status(204).send();
    return;
  } catch (error) {
    console.error('Error deleting publisher:', error);
    res.status(500).json({ error: 'Failed to delete publisher' });
    return;
  }
});

export default router;
