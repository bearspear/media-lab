import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ReadingProgressAttributes {
  id: number;
  userId: number;
  digitalItemId: number;
  digitalFileId?: number; // Optional - for items with multiple files
  location: string; // CFI for EPUB, page number for PDF, timestamp for audio/video
  percentage: number; // 0-100
  lastReadAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReadingProgressCreationAttributes
  extends Optional<ReadingProgressAttributes, 'id' | 'digitalFileId' | 'createdAt' | 'updatedAt'> {}

class ReadingProgress
  extends Model<ReadingProgressAttributes, ReadingProgressCreationAttributes>
  implements ReadingProgressAttributes
{
  public id!: number;
  public userId!: number;
  public digitalItemId!: number;
  public digitalFileId?: number;
  public location!: string;
  public percentage!: number;
  public lastReadAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ReadingProgress.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      field: 'user_id',
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
    digitalFileId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'digital_files',
        key: 'id',
      },
      onDelete: 'CASCADE',
      field: 'digital_file_id',
    },
    location: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    lastReadAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'last_read_at',
    },
  },
  {
    sequelize,
    tableName: 'reading_progress',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'digital_item_id', 'digital_file_id'],
        name: 'unique_user_item_file_progress',
      },
      {
        fields: ['user_id', 'last_read_at'],
        name: 'user_last_read_idx',
      },
    ],
  }
);

export default ReadingProgress;
