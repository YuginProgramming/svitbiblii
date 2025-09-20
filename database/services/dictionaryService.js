import { sequelize } from '../sequelize.js';
import { Op } from 'sequelize';

class DictionaryService {
  
  /**
   * Get all words from the dictionary
   * @returns {Promise<Array>} Array of all dictionary entries
   */
  async getAllWords() {
    try {
      const results = await sequelize.query(
        'SELECT word, page FROM slovnik_index WHERE word IS NOT NULL ORDER BY word ASC',
        { type: sequelize.QueryTypes.SELECT }
      );
      
      return results;
    } catch (error) {
      console.error('Error getting all dictionary words:', error);
      throw error;
    }
  }
  
  /**
   * Get words with pagination for button display
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Words per page
   * @returns {Promise<Object>} Paginated results
   */
  async getWordsWithPagination(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count using raw query
      const countResult = await sequelize.query(
        'SELECT COUNT(*) as count FROM slovnik_index WHERE word IS NOT NULL',
        { type: sequelize.QueryTypes.SELECT }
      );
      const totalCount = parseInt(countResult[0].count);

      // Get paginated results using raw query
      const words = await sequelize.query(
        'SELECT word, page FROM slovnik_index WHERE word IS NOT NULL ORDER BY word ASC LIMIT :limit OFFSET :offset',
        {
          replacements: { limit, offset },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        words: words,
        totalCount: totalCount,
        currentPage: page,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      };
    } catch (error) {
      console.error('Error getting words with pagination:', error);
      throw error;
    }
  }
  
  /**
   * Get dictionary statistics
   * @returns {Promise<Object>} Dictionary statistics
   */
  async getDictionaryStats() {
    try {
      const result = await sequelize.query(
        'SELECT COUNT(*) as count FROM slovnik_index WHERE word IS NOT NULL',
        { type: sequelize.QueryTypes.SELECT }
      );
      
      return {
        totalWords: parseInt(result[0].count)
      };
    } catch (error) {
      console.error('Error getting dictionary stats:', error);
      throw error;
    }
  }
}

export default new DictionaryService();
