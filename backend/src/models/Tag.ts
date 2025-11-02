import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TagAttributes {
  id: number;
  userId: number;
  name: string;
  color?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TagCreationAttributes extends Optional<TagAttributes, 'id' | 'color' | 'createdAt' | 'updatedAt'> {}

class Tag extends Model<TagAttributes, TagCreationAttributes> implements TagAttributes {
  public id!: number;
  public userId!: number;
  public name!: string;
  public color?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Tag.init(
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
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING(7), // Hex color code #RRGGBB
      allowNull: true,
      defaultValue: '#3B82F6', // Default blue color
    },
  },
  {
    sequelize,
    tableName: 'tags',
    timestamps: true,
  }
);

export default Tag;
