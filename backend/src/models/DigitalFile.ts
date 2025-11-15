import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum DigitalFileFormat {
  EPUB = 'epub',
  PDF = 'pdf',
  MOBI = 'mobi',
  AZW3 = 'azw3',
  MP3 = 'mp3',
  M4A = 'm4a',
  MP4 = 'mp4',
  MKV = 'mkv',
  AVI = 'avi',
  FLAC = 'flac',
  WAV = 'wav',
  OTHER = 'other',
}

interface DigitalFileAttributes {
  id: number;
  digitalItemId: number;
  format: DigitalFileFormat;
  filePath: string;
  fileSize?: number; // Size in bytes
  version?: string; // e.g., "1.0", "Revised Edition", etc.
  notes?: string; // Notes specific to this file version
  isPrimary: boolean; // Mark one file as the primary/default version
  createdAt?: Date;
  updatedAt?: Date;
}

interface DigitalFileCreationAttributes extends Optional<DigitalFileAttributes, 'id' | 'fileSize' | 'version' | 'notes' | 'isPrimary' | 'createdAt' | 'updatedAt'> {}

class DigitalFile extends Model<DigitalFileAttributes, DigitalFileCreationAttributes> implements DigitalFileAttributes {
  public id!: number;
  public digitalItemId!: number;
  public format!: DigitalFileFormat;
  public filePath!: string;
  public fileSize?: number;
  public version?: string;
  public notes?: string;
  public isPrimary!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DigitalFile.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    digitalItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'digital_items',
        key: 'id',
      },
      onDelete: 'CASCADE',
      field: 'digital_item_id',
    },
    format: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [Object.values(DigitalFileFormat)],
      },
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_path',
    },
    fileSize: {
      type: DataTypes.INTEGER,
      field: 'file_size',
    },
    version: {
      type: DataTypes.STRING,
    },
    notes: {
      type: DataTypes.TEXT,
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_primary',
    },
  },
  {
    sequelize,
    tableName: 'digital_files',
  }
);

export default DigitalFile;
