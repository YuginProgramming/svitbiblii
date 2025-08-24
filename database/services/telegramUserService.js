import TelegramUser from '../models/TelegramUser.js';
import { sequelize } from '../sequelize.js';
import { Op } from 'sequelize';

class TelegramUserService {
  
  /**
   * Create or update a Telegram user
   * @param {Object} userData - Telegram user data
   * @returns {Promise<TelegramUser>}
   */
  async createOrUpdateUser(userData) {
    try {
      const { id, username, first_name, last_name, language_code, is_bot, is_premium, added_to_attachment_menu, allows_write_to_pm } = userData;
      
      const [user, created] = await TelegramUser.findOrCreate({
        where: { telegramId: id },
        defaults: {
          telegramId: id,
          username: username || null,
          firstName: first_name || null,
          lastName: last_name || null,
          languageCode: language_code || null,
          isBot: is_bot || false,
          isPremium: is_premium || false,
          addedToAttachmentMenu: added_to_attachment_menu || false,
          allowsWriteToPm: allows_write_to_pm !== false, // Default to true
          lastActivity: new Date(),
          totalInteractions: 1,
          isActive: true,
          preferences: {
            language: language_code || 'uk',
            readingMode: 'preview', // preview, full, verse
            versesPerPage: 3
          }
        }
      });
      
      if (!created) {
        // Update existing user
        await user.update({
          username: username || user.username,
          firstName: first_name || user.firstName,
          lastName: last_name || user.lastName,
          languageCode: language_code || user.languageCode,
          isPremium: is_premium || user.isPremium,
          addedToAttachmentMenu: added_to_attachment_menu || user.addedToAttachmentMenu,
          allowsWriteToPm: allows_write_to_pm !== false ? true : false,
          lastActivity: new Date(),
          totalInteractions: user.totalInteractions + 1,
          isActive: true
        });
      }
      
      return user;
    } catch (error) {
      console.error('Error creating/updating Telegram user:', error);
      throw error;
    }
  }
  
  /**
   * Get user by Telegram ID
   * @param {number} telegramId - Telegram user ID
   * @returns {Promise<TelegramUser|null>}
   */
  async getUserByTelegramId(telegramId) {
    try {
      return await TelegramUser.findOne({
        where: { telegramId }
      });
    } catch (error) {
      console.error('Error getting user by Telegram ID:', error);
      throw error;
    }
  }
  
  /**
   * Update user activity
   * @param {number} telegramId - Telegram user ID
   * @returns {Promise<void>}
   */
  async updateUserActivity(telegramId) {
    try {
      const user = await TelegramUser.findOne({ where: { telegramId } });
      if (user) {
        await user.update({
          lastActivity: new Date(),
          totalInteractions: user.totalInteractions + 1
        });
      }
    } catch (error) {
      console.error('Error updating user activity:', error);
      throw error;
    }
  }
  
  /**
   * Update user preferences
   * @param {number} telegramId - Telegram user ID
   * @param {Object} preferences - User preferences
   * @returns {Promise<void>}
   */
  async updateUserPreferences(telegramId, preferences) {
    try {
      await TelegramUser.update(
        {
          preferences: sequelize.fn('jsonb_set', 
            sequelize.col('preferences'), 
            '{}', 
            JSON.stringify(preferences)
          )
        },
        {
          where: { telegramId }
        }
      );
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }
  
  /**
   * Get all active users
   * @returns {Promise<TelegramUser[]>}
   */
  async getActiveUsers() {
    try {
      return await TelegramUser.findAll({
        where: { isActive: true },
        order: [['lastActivity', 'DESC']]
      });
    } catch (error) {
      console.error('Error getting active users:', error);
      throw error;
    }
  }
  
  /**
   * Get user statistics
   * @returns {Promise<Object>}
   */
  async getUserStatistics() {
    try {
      const totalUsers = await TelegramUser.count();
      const activeUsers = await TelegramUser.count({ where: { isActive: true } });
      const premiumUsers = await TelegramUser.count({ where: { isPremium: true } });
      const todayUsers = await TelegramUser.count({
        where: {
          lastActivity: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });
      
      return {
        totalUsers,
        activeUsers,
        premiumUsers,
        todayUsers
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw error;
    }
  }
  
  /**
   * Deactivate user
   * @param {number} telegramId - Telegram user ID
   * @returns {Promise<void>}
   */
  async deactivateUser(telegramId) {
    try {
      await TelegramUser.update(
        { isActive: false },
        { where: { telegramId } }
      );
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }
}

export default new TelegramUserService();
