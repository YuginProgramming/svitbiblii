import { DataTypes } from 'sequelize';
import { sequelize } from '../sequelize.js';

const DictionaryIndex = sequelize.define('DictionaryIndex', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'word' // Use word as the primary key field
  },
  word: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Biblical term or word'
  },
  page: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Page number reference'
  }
}, {
  tableName: 'slovnik_index',
  timestamps: false, // No createdAt/updatedAt columns
  indexes: [
    {
      fields: ['word']
    },
    {
      fields: ['page']
    }
  ]
});

export default DictionaryIndex;
