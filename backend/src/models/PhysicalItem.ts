import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ReadingStatus } from './DigitalItem';

export enum PhysicalItemType {
  BOOK = 'book',
  DVD = 'dvd',
  BLURAY = 'bluray',
  CD = 'cd',
  VINYL = 'vinyl',
  MAGAZINE = 'magazine',
  COMIC = 'comic',
  OTHER = 'other',
}

export enum PhysicalItemCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  VERY_GOOD = 'very_good',
  GOOD = 'good',
  ACCEPTABLE = 'acceptable',
  POOR = 'poor',
}

interface PhysicalItemAttributes {
  id: number;
  title: string;
  type: PhysicalItemType;
  condition?: PhysicalItemCondition;
  description?: string;
  isbn?: string;
  lccn?: string; // Library of Congress Control Number
  barcode?: string;
  publisher?: string; // Legacy field, keep for backward compatibility
  publisherId?: number; // New foreign key to Publisher
  publishedYear?: number;
  language?: string;
  location?: string;
  coverImage?: string;
  rating?: number;
  tags?: string[];
  readingStatus?: ReadingStatus;
  isFavorite: boolean;
  notes?: string;
  review?: string;
  quantity?: number;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PhysicalItemCreationAttributes extends Optional<PhysicalItemAttributes, 'id' | 'condition' | 'description' | 'isbn' | 'lccn' | 'barcode' | 'publisher' | 'publisherId' | 'publishedYear' | 'language' | 'location' | 'coverImage' | 'rating' | 'tags' | 'readingStatus' | 'isFavorite' | 'notes' | 'review' | 'quantity' | 'createdAt' | 'updatedAt'> {}

class PhysicalItem extends Model<PhysicalItemAttributes, PhysicalItemCreationAttributes> implements PhysicalItemAttributes {
  public id!: number;
  public title!: string;
  public type!: PhysicalItemType;
  public condition?: PhysicalItemCondition;
  public description?: string;
  public isbn?: string;
  public lccn?: string;
  public barcode?: string;
  public publisher?: string;
  public publisherId?: number;
  public publishedYear?: number;
  public language?: string;
  public location?: string;
  public coverImage?: string;
  public rating?: number;
  public tags?: string[];
  public readingStatus?: ReadingStatus;
  public isFavorite!: boolean;
  public notes?: string;
  public review?: string;
  public quantity?: number;
  public userId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PhysicalItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [Object.values(PhysicalItemType)],
      },
    },
    condition: {
      type: DataTypes.STRING,
      validate: {
        isIn: [Object.values(PhysicalItemCondition)],
      },
    },
    description: {
      type: DataTypes.TEXT,
    },
    isbn: {
      type: DataTypes.STRING,
    },
    lccn: {
      type: DataTypes.STRING,
    },
    barcode: {
      type: DataTypes.STRING,
      unique: true,
    },
    publisher: {
      type: DataTypes.STRING,
    },
    publisherId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'publishers',
        key: 'id',
      },
    },
    publishedYear: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1000,
        max: new Date().getFullYear() + 1,
      },
    },
    language: {
      type: DataTypes.STRING,
    },
    location: {
      type: DataTypes.STRING,
    },
    coverImage: {
      type: DataTypes.STRING,
      field: 'cover_image',
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      validate: {
        min: 0,
        max: 5,
      },
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    readingStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [Object.values(ReadingStatus)],
      },
    },
    isFavorite: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    review: {
      type: DataTypes.TEXT,
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: 0,
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'physical_items',
  }
);

export default PhysicalItem;
