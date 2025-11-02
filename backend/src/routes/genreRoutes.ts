import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { Genre, DigitalItem, PhysicalItem } from '../models';

const router = Router();

// Get all genres
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const genres = await Genre.findAll({
      order: [['name', 'ASC']],
    });
    res.json(genres);
    return;
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ error: 'Failed to fetch genres' });
    return;
  }
});

// Get genre by ID with associated items
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const genre = await Genre.findByPk(req.params.id, {
      include: [
        {
          model: DigitalItem,
          as: 'digitalItems',
          through: { attributes: [] },
        },
        {
          model: PhysicalItem,
          as: 'physicalItems',
          through: { attributes: [] },
        },
      ],
    });

    if (!genre) {
      res.status(404).json({ error: 'Genre not found' });
      return;
    }

    res.json(genre);
    return;
  } catch (error) {
    console.error('Error fetching genre:', error);
    res.status(500).json({ error: 'Failed to fetch genre' });
    return;
  }
});

// Search genres by name
router.get('/search/:query', async (req: Request, res: Response): Promise<void> => {
  try {
    const genres = await Genre.findAll({
      where: {
        name: {
          [Op.like]: `%${req.params.query}%`,
        },
      },
      order: [['name', 'ASC']],
    });
    res.json(genres);
    return;
  } catch (error) {
    console.error('Error searching genres:', error);
    res.status(500).json({ error: 'Failed to search genres' });
    return;
  }
});

// Create new genre
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if genre with same name already exists
    const existingGenre = await Genre.findOne({
      where: { name: req.body.name },
    });

    if (existingGenre) {
      res.status(409).json({ error: 'Genre with this name already exists' });
      return;
    }

    const genre = await Genre.create(req.body);
    res.status(201).json(genre);
    return;
  } catch (error) {
    console.error('Error creating genre:', error);
    res.status(500).json({ error: 'Failed to create genre' });
    return;
  }
});

// Update genre
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const genre = await Genre.findByPk(req.params.id);

    if (!genre) {
      res.status(404).json({ error: 'Genre not found' });
      return;
    }

    await genre.update(req.body);
    res.json(genre);
    return;
  } catch (error) {
    console.error('Error updating genre:', error);
    res.status(500).json({ error: 'Failed to update genre' });
    return;
  }
});

// Delete genre
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const genre = await Genre.findByPk(req.params.id);

    if (!genre) {
      res.status(404).json({ error: 'Genre not found' });
      return;
    }

    await genre.destroy();
    res.status(204).send();
    return;
  } catch (error) {
    console.error('Error deleting genre:', error);
    res.status(500).json({ error: 'Failed to delete genre' });
    return;
  }
});

export default router;
