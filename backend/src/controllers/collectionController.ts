import { Request, Response } from 'express';
import Collection from '../models/Collection';
import DigitalItem from '../models/DigitalItem';
import PhysicalItem from '../models/PhysicalItem';

// Get all collections for a user
export const getCollections = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const collections = await Collection.findAll({
      where: { userId },
      include: [
        {
          model: DigitalItem,
          as: 'digitalItems',
          attributes: ['id', 'title', 'coverImage'],
          through: { attributes: [] },
        },
        {
          model: PhysicalItem,
          as: 'physicalItems',
          attributes: ['id', 'title', 'coverImage'],
          through: { attributes: [] },
        },
      ],
      order: [['updatedAt', 'DESC']],
    });

    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
};

// Get a single collection by ID
export const getCollectionById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const collection = await Collection.findOne({
      where: { id, userId },
      include: [
        {
          model: DigitalItem,
          as: 'digitalItems',
          attributes: ['id', 'title', 'coverImage', 'type', 'rating'],
          through: { attributes: [] },
        },
        {
          model: PhysicalItem,
          as: 'physicalItems',
          attributes: ['id', 'title', 'coverImage', 'type', 'rating'],
          through: { attributes: [] },
        },
      ],
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
};

// Create a new collection
export const createCollection = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, description, coverImage, isPublic } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    const collection = await Collection.create({
      userId,
      name,
      description,
      coverImage,
      isPublic: isPublic || false,
    });

    res.status(201).json(collection);
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
};

// Update a collection
export const updateCollection = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name, description, coverImage, isPublic } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const collection = await Collection.findOne({
      where: { id, userId },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    await collection.update({
      name: name !== undefined ? name : collection.name,
      description: description !== undefined ? description : collection.description,
      coverImage: coverImage !== undefined ? coverImage : collection.coverImage,
      isPublic: isPublic !== undefined ? isPublic : collection.isPublic,
    });

    res.json(collection);
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
};

// Delete a collection
export const deleteCollection = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const collection = await Collection.findOne({
      where: { id, userId },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    await collection.destroy();

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
};

// Add a digital item to a collection
export const addDigitalItemToCollection = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { digitalItemId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!digitalItemId) {
      return res.status(400).json({ error: 'Digital item ID is required' });
    }

    const collection = await Collection.findOne({
      where: { id, userId },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const digitalItem = await DigitalItem.findOne({
      where: { id: digitalItemId, userId },
    });

    if (!digitalItem) {
      return res.status(404).json({ error: 'Digital item not found' });
    }

    await (collection as any).addDigitalItem(digitalItem);

    res.json({ message: 'Digital item added to collection' });
  } catch (error) {
    console.error('Error adding digital item to collection:', error);
    res.status(500).json({ error: 'Failed to add digital item to collection' });
  }
};

// Add a physical item to a collection
export const addPhysicalItemToCollection = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { physicalItemId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!physicalItemId) {
      return res.status(400).json({ error: 'Physical item ID is required' });
    }

    const collection = await Collection.findOne({
      where: { id, userId },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const physicalItem = await PhysicalItem.findOne({
      where: { id: physicalItemId, userId },
    });

    if (!physicalItem) {
      return res.status(404).json({ error: 'Physical item not found' });
    }

    await (collection as any).addPhysicalItem(physicalItem);

    res.json({ message: 'Physical item added to collection' });
  } catch (error) {
    console.error('Error adding physical item to collection:', error);
    res.status(500).json({ error: 'Failed to add physical item to collection' });
  }
};

// Remove a digital item from a collection
export const removeDigitalItemFromCollection = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id, digitalItemId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const collection = await Collection.findOne({
      where: { id, userId },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const digitalItem = await DigitalItem.findOne({
      where: { id: digitalItemId, userId },
    });

    if (!digitalItem) {
      return res.status(404).json({ error: 'Digital item not found' });
    }

    await (collection as any).removeDigitalItem(digitalItem);

    res.json({ message: 'Digital item removed from collection' });
  } catch (error) {
    console.error('Error removing digital item from collection:', error);
    res.status(500).json({ error: 'Failed to remove digital item from collection' });
  }
};

// Remove a physical item from a collection
export const removePhysicalItemFromCollection = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id, physicalItemId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const collection = await Collection.findOne({
      where: { id, userId },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const physicalItem = await PhysicalItem.findOne({
      where: { id: physicalItemId, userId },
    });

    if (!physicalItem) {
      return res.status(404).json({ error: 'Physical item not found' });
    }

    await (collection as any).removePhysicalItem(physicalItem);

    res.json({ message: 'Physical item removed from collection' });
  } catch (error) {
    console.error('Error removing physical item from collection:', error);
    res.status(500).json({ error: 'Failed to remove physical item from collection' });
  }
};
