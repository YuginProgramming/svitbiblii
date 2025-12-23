import { DataTypes } from 'sequelize';
import { sequelize } from '../sequelize.js';

const UserJourneyEvent = sequelize.define('UserJourneyEvent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Foreign key to telegram_users.id',
    references: {
      model: 'telegram_users',
      key: 'id'
    }
  },
  telegramId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'Telegram user ID (for faster queries without joins)'
  },
  eventType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Type of event: command, menu_action, navigation, reading, ai_interaction, mailing_received, mailing_clicked, preference_change, error'
  },
  eventTimestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When the event occurred'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Event-specific data (bookName, chapterIndex, chapterNumber, verseNumbers, navigationDirection, aiFeature, contentType, etc.)'
  },
  mailingIterationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Foreign key to mailing_iterations.id (if event is mailing-related)',
    references: {
      model: 'mailing_iterations',
      key: 'id'
    }
  },
  aiResponseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Foreign key to ai_responses.id (if event has AI response)',
    references: {
      model: 'ai_responses',
      key: 'id'
    }
  }
}, {
  tableName: 'user_journey_events',
  timestamps: true,
  createdAt: 'eventTimestamp',
  updatedAt: false,
  indexes: [
    {
      fields: ['userId', 'eventTimestamp']
    },
    {
      fields: ['telegramId', 'eventTimestamp']
    },
    {
      fields: ['eventType', 'eventTimestamp']
    },
    {
      fields: ['eventTimestamp']
    },
    {
      fields: ['mailingIterationId']
    },
    {
      fields: ['aiResponseId']
    }
  ]
});

export default UserJourneyEvent;

