import { DataTypes } from 'sequelize';
import { sequelize } from '../sequelize.js';

const MailingIteration = sequelize.define('MailingIteration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bookName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Name of the book from which verses were sent'
  },
  chapterIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Chapter index in the EPUB'
  },
  chapterNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Chapter number within the book (1-based)'
  },
  verseNumbers: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false,
    comment: 'Array of verse numbers sent in this mailing'
  },
  verseTexts: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: false,
    comment: 'Array of verse texts sent in this mailing'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When this mailing was sent'
  },
  recipientsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of users who received this mailing'
  },
  successCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of successful deliveries'
  },
  failCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of failed deliveries'
  }
}, {
  tableName: 'mailing_iterations',
  timestamps: true,
  createdAt: 'sentAt',
  updatedAt: false,
  indexes: [
    {
      fields: ['sentAt']
    },
    {
      fields: ['chapterIndex']
    }
  ]
});

export default MailingIteration;









