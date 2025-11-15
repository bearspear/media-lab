import sequelize from '../config/database';
import User from './User';
import DigitalItem from './DigitalItem';
import DigitalFile from './DigitalFile';
import PhysicalItem from './PhysicalItem';
import Author from './Author';
import Publisher from './Publisher';
import Genre from './Genre';
import Collection from './Collection';
import Tag from './Tag';
import ReadingProgress from './ReadingProgress';

// Set up associations
User.hasMany(DigitalItem, {
  foreignKey: 'userId',
  as: 'digitalItems',
});

DigitalItem.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// DigitalFile associations
DigitalItem.hasMany(DigitalFile, {
  foreignKey: 'digitalItemId',
  as: 'files',
  onDelete: 'CASCADE',
});

DigitalFile.belongsTo(DigitalItem, {
  foreignKey: 'digitalItemId',
  as: 'digitalItem',
});

User.hasMany(PhysicalItem, {
  foreignKey: 'userId',
  as: 'physicalItems',
});

PhysicalItem.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Publisher associations
Publisher.hasMany(DigitalItem, {
  foreignKey: 'publisherId',
  as: 'digitalItems',
});

DigitalItem.belongsTo(Publisher, {
  foreignKey: 'publisherId',
  as: 'publisherInfo',
});

Publisher.hasMany(PhysicalItem, {
  foreignKey: 'publisherId',
  as: 'physicalItems',
});

PhysicalItem.belongsTo(Publisher, {
  foreignKey: 'publisherId',
  as: 'publisherInfo',
});

// Author associations (many-to-many)
DigitalItem.belongsToMany(Author, {
  through: 'digital_item_authors',
  foreignKey: 'digitalItemId',
  otherKey: 'authorId',
  as: 'authors',
});

Author.belongsToMany(DigitalItem, {
  through: 'digital_item_authors',
  foreignKey: 'authorId',
  otherKey: 'digitalItemId',
  as: 'digitalItems',
});

PhysicalItem.belongsToMany(Author, {
  through: 'physical_item_authors',
  foreignKey: 'physicalItemId',
  otherKey: 'authorId',
  as: 'authors',
});

Author.belongsToMany(PhysicalItem, {
  through: 'physical_item_authors',
  foreignKey: 'authorId',
  otherKey: 'physicalItemId',
  as: 'physicalItems',
});

// Genre associations (many-to-many)
DigitalItem.belongsToMany(Genre, {
  through: 'digital_item_genres',
  foreignKey: 'digitalItemId',
  otherKey: 'genreId',
  as: 'genres',
});

Genre.belongsToMany(DigitalItem, {
  through: 'digital_item_genres',
  foreignKey: 'genreId',
  otherKey: 'digitalItemId',
  as: 'digitalItems',
});

PhysicalItem.belongsToMany(Genre, {
  through: 'physical_item_genres',
  foreignKey: 'physicalItemId',
  otherKey: 'genreId',
  as: 'genres',
});

Genre.belongsToMany(PhysicalItem, {
  through: 'physical_item_genres',
  foreignKey: 'genreId',
  otherKey: 'physicalItemId',
  as: 'physicalItems',
});

// Collection associations
User.hasMany(Collection, {
  foreignKey: 'userId',
  as: 'collections',
});

Collection.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Collection-Item associations (many-to-many)
Collection.belongsToMany(DigitalItem, {
  through: 'collection_digital_items',
  foreignKey: 'collectionId',
  otherKey: 'digitalItemId',
  as: 'digitalItems',
});

DigitalItem.belongsToMany(Collection, {
  through: 'collection_digital_items',
  foreignKey: 'digitalItemId',
  otherKey: 'collectionId',
  as: 'collections',
});

Collection.belongsToMany(PhysicalItem, {
  through: 'collection_physical_items',
  foreignKey: 'collectionId',
  otherKey: 'physicalItemId',
  as: 'physicalItems',
});

PhysicalItem.belongsToMany(Collection, {
  through: 'collection_physical_items',
  foreignKey: 'physicalItemId',
  otherKey: 'collectionId',
  as: 'collections',
});

// Tag associations
User.hasMany(Tag, {
  foreignKey: 'userId',
  as: 'tags',
});

Tag.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Tag-Item associations (many-to-many)
Tag.belongsToMany(DigitalItem, {
  through: 'digital_item_tags',
  foreignKey: 'tagId',
  otherKey: 'digitalItemId',
  as: 'digitalItems',
});

DigitalItem.belongsToMany(Tag, {
  through: 'digital_item_tags',
  foreignKey: 'digitalItemId',
  otherKey: 'tagId',
  as: 'tagList',
});

Tag.belongsToMany(PhysicalItem, {
  through: 'physical_item_tags',
  foreignKey: 'tagId',
  otherKey: 'physicalItemId',
  as: 'physicalItems',
});

PhysicalItem.belongsToMany(Tag, {
  through: 'physical_item_tags',
  foreignKey: 'physicalItemId',
  otherKey: 'tagId',
  as: 'tagList',
});

// ReadingProgress associations
User.hasMany(ReadingProgress, {
  foreignKey: 'userId',
  as: 'readingProgress',
});

ReadingProgress.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

DigitalItem.hasMany(ReadingProgress, {
  foreignKey: 'digitalItemId',
  as: 'readingProgress',
});

ReadingProgress.belongsTo(DigitalItem, {
  foreignKey: 'digitalItemId',
  as: 'digitalItem',
});

DigitalFile.hasMany(ReadingProgress, {
  foreignKey: 'digitalFileId',
  as: 'readingProgress',
});

ReadingProgress.belongsTo(DigitalFile, {
  foreignKey: 'digitalFileId',
  as: 'digitalFile',
});

// Export models
export {
  sequelize,
  User,
  DigitalItem,
  DigitalFile,
  PhysicalItem,
  Author,
  Publisher,
  Genre,
  Collection,
  Tag,
  ReadingProgress,
};

// Export a function to sync all models
export const syncDatabase = async (options?: { force?: boolean; alter?: boolean }) => {
  try {
    await sequelize.sync(options);
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing database:', error);
    throw error;
  }
};

export default {
  sequelize,
  User,
  DigitalItem,
  DigitalFile,
  PhysicalItem,
  Author,
  Publisher,
  Genre,
  Collection,
  Tag,
  ReadingProgress,
  syncDatabase,
};
