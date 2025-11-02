import { Request, Response } from 'express';
import Tag from '../models/Tag';
import DigitalItem from '../models/DigitalItem';
import PhysicalItem from '../models/PhysicalItem';

// Get all tags for a user
export const getTags = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tags = await Tag.findAll({
      where: { userId },
      order: [['name', 'ASC']],
    });

    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
};

// Get a single tag by ID
export const getTagById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tag = await Tag.findOne({
      where: { id, userId },
      include: [
        {
          model: DigitalItem,
          as: 'digitalItems',
          attributes: ['id', 'title', 'coverImage', 'type'],
          through: { attributes: [] },
        },
        {
          model: PhysicalItem,
          as: 'physicalItems',
          attributes: ['id', 'title', 'coverImage', 'type'],
          through: { attributes: [] },
        },
      ],
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(tag);
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
};

// Create a new tag
export const createTag = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, color } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    // Check if tag with same name already exists for this user
    const existingTag = await Tag.findOne({
      where: { userId, name },
    });

    if (existingTag) {
      return res.status(409).json({ error: 'Tag with this name already exists' });
    }

    const tag = await Tag.create({
      userId,
      name,
      color: color || '#3B82F6', // Default blue color
    });

    res.status(201).json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
};

// Update a tag
export const updateTag = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name, color } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tag = await Tag.findOne({
      where: { id, userId },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // If name is being updated, check for duplicates
    if (name && name !== tag.name) {
      const existingTag = await Tag.findOne({
        where: { userId, name },
      });

      if (existingTag) {
        return res.status(409).json({ error: 'Tag with this name already exists' });
      }
    }

    await tag.update({
      name: name !== undefined ? name : tag.name,
      color: color !== undefined ? color : tag.color,
    });

    res.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
};

// Delete a tag
export const deleteTag = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tag = await Tag.findOne({
      where: { id, userId },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await tag.destroy();

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
};

// Add a tag to a digital item
export const addTagToDigitalItem = async (req: Request, res: Response) => {
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

    const tag = await Tag.findOne({
      where: { id, userId },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const digitalItem = await DigitalItem.findOne({
      where: { id: digitalItemId, userId },
    });

    if (!digitalItem) {
      return res.status(404).json({ error: 'Digital item not found' });
    }

    await (tag as any).addDigitalItem(digitalItem);

    res.json({ message: 'Tag added to digital item' });
  } catch (error) {
    console.error('Error adding tag to digital item:', error);
    res.status(500).json({ error: 'Failed to add tag to digital item' });
  }
};

// Add a tag to a physical item
export const addTagToPhysicalItem = async (req: Request, res: Response) => {
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

    const tag = await Tag.findOne({
      where: { id, userId },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const physicalItem = await PhysicalItem.findOne({
      where: { id: physicalItemId, userId },
    });

    if (!physicalItem) {
      return res.status(404).json({ error: 'Physical item not found' });
    }

    await (tag as any).addPhysicalItem(physicalItem);

    res.json({ message: 'Tag added to physical item' });
  } catch (error) {
    console.error('Error adding tag to physical item:', error);
    res.status(500).json({ error: 'Failed to add tag to physical item' });
  }
};

// Remove a tag from a digital item
export const removeTagFromDigitalItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id, digitalItemId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tag = await Tag.findOne({
      where: { id, userId },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const digitalItem = await DigitalItem.findOne({
      where: { id: digitalItemId, userId },
    });

    if (!digitalItem) {
      return res.status(404).json({ error: 'Digital item not found' });
    }

    await (tag as any).removeDigitalItem(digitalItem);

    res.json({ message: 'Tag removed from digital item' });
  } catch (error) {
    console.error('Error removing tag from digital item:', error);
    res.status(500).json({ error: 'Failed to remove tag from digital item' });
  }
};

// Remove a tag from a physical item
export const removeTagFromPhysicalItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id, physicalItemId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tag = await Tag.findOne({
      where: { id, userId },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const physicalItem = await PhysicalItem.findOne({
      where: { id: physicalItemId, userId },
    });

    if (!physicalItem) {
      return res.status(404).json({ error: 'Physical item not found' });
    }

    await (tag as any).removePhysicalItem(physicalItem);

    res.json({ message: 'Tag removed from physical item' });
  } catch (error) {
    console.error('Error removing tag from physical item:', error);
    res.status(500).json({ error: 'Failed to remove tag from physical item' });
  }
};
