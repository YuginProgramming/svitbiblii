import UserJourneyEvent from '../models/UserJourneyEvent.js';
import TelegramUser from '../models/TelegramUser.js';
import { Op } from 'sequelize';

class UserJourneyService {
  
  /**
   * Log Barclay AI request event
   * @param {number} telegramId - Telegram user ID
   * @param {Object} contextData - Context data for the request
   * @param {string} contextData.source - Source: 'mailing' or 'chapter'
   * @param {string} contextData.bookName - Book name in Ukrainian
   * @param {number} contextData.chapterIndex - Chapter index in EPUB
   * @param {number} contextData.chapterNumber - Chapter number within book
   * @param {Array<number>} contextData.verseNumbers - Array of verse numbers
   * @param {Array<string>} contextData.verseTexts - Array of verse texts
   * @param {number|null} contextData.mailingIterationId - Mailing iteration ID if from mailing
   * @returns {Promise<UserJourneyEvent>} Created event
   */
  async logBarclayRequest(telegramId, contextData) {
    try {
      // Get user from database
      const user = await TelegramUser.findOne({
        where: { telegramId }
      });

      if (!user) {
        throw new Error(`User with telegramId ${telegramId} not found`);
      }

      // Prepare metadata
      const metadata = {
        aiFeature: 'barclay_comments',
        source: contextData.source, // 'mailing' or 'chapter'
        bookName: contextData.bookName,
        chapterIndex: contextData.chapterIndex,
        chapterNumber: contextData.chapterNumber,
        verseNumbers: contextData.verseNumbers,
        verseTexts: contextData.verseTexts,
        promptTemplate: 'barclay_comments',
        status: 'pending'
      };

      // Create event
      const event = await UserJourneyEvent.create({
        userId: user.id,
        telegramId: telegramId,
        eventType: 'ai_interaction',
        metadata: metadata,
        mailingIterationId: contextData.mailingIterationId || null
      });

      console.log(`✅ Logged Barclay request event ID: ${event.id} for user ${telegramId}`);
      return event;
    } catch (error) {
      console.error('Error logging Barclay request:', error);
      throw error;
    }
  }

  /**
   * Get event by ID for AI processing
   * @param {number} eventId - Event ID
   * @returns {Promise<UserJourneyEvent|null>} Event with metadata
   */
  async getEventForAI(eventId) {
    try {
      const event = await UserJourneyEvent.findByPk(eventId);
      
      if (!event) {
        return null;
      }

      // Validate event type
      if (event.eventType !== 'ai_interaction') {
        throw new Error(`Event ${eventId} is not an AI interaction event`);
      }

      // Validate metadata structure
      if (!event.metadata || event.metadata.aiFeature !== 'barclay_comments') {
        throw new Error(`Event ${eventId} is not a Barclay comments request`);
      }

      return event;
    } catch (error) {
      console.error(`Error getting event ${eventId} for AI:`, error);
      throw error;
    }
  }

  /**
   * Update event metadata with prompt and status
   * @param {number} eventId - Event ID
   * @param {string} promptSent - Prompt that was sent to AI
   * @param {string} status - Status: 'pending', 'processing', 'success', 'error'
   * @returns {Promise<void>}
   */
  async updateEventMetadata(eventId, promptSent, status) {
    try {
      const event = await UserJourneyEvent.findByPk(eventId);
      if (!event) {
        throw new Error(`Event ${eventId} not found`);
      }

      const updatedMetadata = {
        ...event.metadata,
        promptSent: promptSent,
        status: status
      };

      await event.update({
        metadata: updatedMetadata
      });
    } catch (error) {
      console.error(`Error updating event ${eventId} metadata:`, error);
      throw error;
    }
  }

  /**
   * Link AI response to event
   * @param {number} eventId - Event ID
   * @param {number} aiResponseId - AI Response ID
   * @returns {Promise<void>}
   */
  async linkAIResponse(eventId, aiResponseId) {
    try {
      const event = await UserJourneyEvent.findByPk(eventId);
      if (!event) {
        throw new Error(`Event ${eventId} not found`);
      }

      await event.update({
        aiResponseId: aiResponseId
      });
    } catch (error) {
      console.error(`Error linking AI response to event ${eventId}:`, error);
      throw error;
    }
  }
}

export default new UserJourneyService();



