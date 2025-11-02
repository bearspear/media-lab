import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PublisherAttributes {
  id: number;
  name: string;
  website?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PublisherCreationAttributes extends Optional<PublisherAttributes, 'id' | 'website' | 'description' | 'createdAt' | 'updatedAt'> {}

class Publisher extends Model<PublisherAttributes, PublisherCreationAttributes> implements PublisherAttributes {
  public id!: number;
  public name!: string;
  public website?: string;
  public description?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Publisher.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    website: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    tableName: 'publishers',
  }
);

export default Publisher;
