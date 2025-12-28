import { DataTypes } from 'sequelize';
import { sequelize } from '../sequelize.js';

const AIResponse = sequelize.define('AIResponse', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    comment: 'Foreign key to user_journey_events.id',
    references: {
      model: 'user_journey_events',
      key: 'id'
    }
  },
  responseText: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Full AI response text'
  },
  promptUsed: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'The actual prompt sent to AI'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Status: pending, success, error'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if status is error'
  },
  processingTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Processing time in milliseconds'
  },
  aiModel: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'gemini-pro',
    comment: 'AI model used (e.g., gemini-pro)'
  }
}, {
  tableName: 'ai_responses',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      unique: true,
      fields: ['eventId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['createdAt']
    }
  ]
});

export default AIResponse;


