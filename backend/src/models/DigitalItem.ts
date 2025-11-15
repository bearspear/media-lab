import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum DigitalItemType {
  EBOOK = 'ebook',
  AUDIOBOOK = 'audiobook',
  PDF = 'pdf',
  VIDEO = 'video',
  MUSIC = 'music',
  OTHER = 'other',
}

export enum DigitalItemFormat {
  EPUB = 'epub',
  PDF = 'pdf',
  MOBI = 'mobi',
  AZW3 = 'azw3',
  MP3 = 'mp3',
  M4A = 'm4a',
  MP4 = 'mp4',
  MKV = 'mkv',
  OTHER = 'other',
}

export enum ReadingStatus {
  TO_READ = 'to_read',
  READING = 'reading',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  DROPPED = 'dropped',
}

interface DigitalItemAttributes {
  id: number;
  title: string;
  type: DigitalItemType;
  format?: DigitalItemFormat; // DEPRECATED: Use DigitalFile model instead
  description?: string;
  isbn?: string;
  lccn?: string; // Library of Congress Control Number
  publisher?: string; // Legacy field, keep for backward compatibility
  publisherId?: number; // New foreign key to Publisher
  publishedYear?: number;
  language?: string;
  fileSize?: number; // DEPRECATED: Use DigitalFile model instead
  filePath?: string; // DEPRECATED: Use DigitalFile model instead
  coverImage?: string;
  rating?: number;
  tags?: string[];
  readingStatus?: ReadingStatus;
  isFavorite: boolean;
  notes?: string;
  review?: string;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DigitalItemCreationAttributes extends Optional<DigitalItemAttributes, 'id' | 'format' | 'description' | 'isbn' | 'lccn' | 'publisher' | 'publisherId' | 'publishedYear' | 'language' | 'fileSize' | 'filePath' | 'coverImage' | 'rating' | 'tags' | 'readingStatus' | 'isFavorite' | 'notes' | 'review' | 'createdAt' | 'updatedAt'> {}

class DigitalItem extends Model<DigitalItemAttributes, DigitalItemCreationAttributes> implements DigitalItemAttributes {
  public id!: number;
  public title!: string;
  public type!: DigitalItemType;
  public format?: DigitalItemFormat; // DEPRECATED: Use DigitalFile model instead
  public description?: string;
  public isbn?: string;
  public lccn?: string;
  public publisher?: string;
  public publisherId?: number;
  public publishedYear?: number;
  public language?: string;
  public fileSize?: number; // DEPRECATED: Use DigitalFile model instead
  public filePath?: string; // DEPRECATED: Use DigitalFile model instead
  public coverImage?: string;
  public rating?: number;
  public tags?: string[];
  public readingStatus?: ReadingStatus;
  public isFavorite!: boolean;
  public notes?: string;
  public review?: string;
  public userId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DigitalItem.init(
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
        isIn: [Object.values(DigitalItemType)],
      },
    },
    format: {
      type: DataTypes.STRING,
      validate: {
        isIn: [Object.values(DigitalItemFormat)],
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
    fileSize: {
      type: DataTypes.INTEGER, // Size in bytes
    },
    filePath: {
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
    tableName: 'digital_items',
  }
);

export default DigitalItem;
