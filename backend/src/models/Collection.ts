import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CollectionAttributes {
  id: number;
  userId: number;
  name: string;
  description?: string;
  coverImage?: string;
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CollectionCreationAttributes extends Optional<CollectionAttributes, 'id' | 'description' | 'coverImage' | 'isPublic' | 'createdAt' | 'updatedAt'> {}

class Collection extends Model<CollectionAttributes, CollectionCreationAttributes> implements CollectionAttributes {
  public id!: number;
  public userId!: number;
  public name!: string;
  public description?: string;
  public coverImage?: string;
  public isPublic!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Collection.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    coverImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'collections',
    timestamps: true,
  }
);

export default Collection;
