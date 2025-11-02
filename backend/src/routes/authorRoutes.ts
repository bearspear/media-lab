import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { Author, DigitalItem, PhysicalItem } from '../models';

const router = Router();

// Get all authors
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const authors = await Author.findAll({
      order: [['name', 'ASC']],
    });
    res.json(authors);
    return;
  } catch (error) {
    console.error('Error fetching authors:', error);
    res.status(500).json({ error: 'Failed to fetch authors' });
    return;
  }
});

// Get author by ID with associated items
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const author = await Author.findByPk(req.params.id, {
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

    if (!author) {
      res.status(404).json({ error: 'Author not found' });
      return;
    }

    res.json(author);
    return;
  } catch (error) {
    console.error('Error fetching author:', error);
    res.status(500).json({ error: 'Failed to fetch author' });
    return;
  }
});

// Search authors by name
router.get('/search/:query', async (req: Request, res: Response): Promise<void> => {
  try {
    const authors = await Author.findAll({
      where: {
        name: {
          [Op.like]: `%${req.params.query}%`,
        },
      },
      order: [['name', 'ASC']],
    });
    res.json(authors);
    return;
  } catch (error) {
    console.error('Error searching authors:', error);
    res.status(500).json({ error: 'Failed to search authors' });
    return;
  }
});

// Create new author
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if author with same name already exists
    const existingAuthor = await Author.findOne({
      where: { name: req.body.name },
    });

    if (existingAuthor) {
      res.status(409).json({ error: 'Author with this name already exists' });
      return;
    }

    const author = await Author.create(req.body);
    res.status(201).json(author);
    return;
  } catch (error) {
    console.error('Error creating author:', error);
    res.status(500).json({ error: 'Failed to create author' });
    return;
  }
});

// Update author
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const author = await Author.findByPk(req.params.id);

    if (!author) {
      res.status(404).json({ error: 'Author not found' });
      return;
    }

    await author.update(req.body);
    res.json(author);
    return;
  } catch (error) {
    console.error('Error updating author:', error);
    res.status(500).json({ error: 'Failed to update author' });
    return;
  }
});

// Delete author
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const author = await Author.findByPk(req.params.id);

    if (!author) {
      res.status(404).json({ error: 'Author not found' });
      return;
    }

    await author.destroy();
    res.status(204).send();
    return;
  } catch (error) {
    console.error('Error deleting author:', error);
    res.status(500).json({ error: 'Failed to delete author' });
    return;
  }
});

export default router;
