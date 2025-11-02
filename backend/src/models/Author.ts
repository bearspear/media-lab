import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AuthorAttributes {
  id: number;
  name: string;
  bio?: string;
  website?: string;
  photoUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AuthorCreationAttributes extends Optional<AuthorAttributes, 'id' | 'bio' | 'website' | 'photoUrl' | 'createdAt' | 'updatedAt'> {}

class Author extends Model<AuthorAttributes, AuthorCreationAttributes> implements AuthorAttributes {
  public id!: number;
  public name!: string;
  public bio?: string;
  public website?: string;
  public photoUrl?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Author.init(
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
    bio: {
      type: DataTypes.TEXT,
    },
    website: {
      type: DataTypes.STRING,
    },
    photoUrl: {
      type: DataTypes.STRING,
      field: 'photo_url',
    },
  },
  {
    sequelize,
    tableName: 'authors',
  }
);

export default Author;
