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

  /**
   * Get distinct first letters with counts
   * @returns {Promise<Array<{letter: string, count: number}>>}
   */
  async getLetters() {
    try {
      const rows = await sequelize.query(
        "SELECT UPPER(SUBSTR(word,1,1)) AS letter, COUNT(*) AS count FROM slovnik_index WHERE word IS NOT NULL GROUP BY UPPER(SUBSTR(word,1,1)) ORDER BY letter ASC",
        { type: sequelize.QueryTypes.SELECT }
      );
      return rows.map(r => ({ letter: r.letter, count: parseInt(r.count) }));
    } catch (error) {
      console.error('Error getting dictionary letters:', error);
      throw error;
    }
  }

  /**
   * Get words that start with a specific letter (paginated)
   * @param {string} letter - First letter
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Items per page
   */
  async getWordsByLetter(letter, page = 1, limit = 20) {
    try {
      const normalized = (letter || '').toUpperCase();
      const offset = (page - 1) * limit;

      const countResult = await sequelize.query(
        'SELECT COUNT(*) AS count FROM slovnik_index WHERE word IS NOT NULL AND UPPER(SUBSTR(word,1,1)) = :letter',
        {
          replacements: { letter: normalized },
          type: sequelize.QueryTypes.SELECT
        }
      );
      const totalCount = parseInt(countResult[0].count);

      const words = await sequelize.query(
        'SELECT word, page FROM slovnik_index WHERE word IS NOT NULL AND UPPER(SUBSTR(word,1,1)) = :letter ORDER BY word ASC LIMIT :limit OFFSET :offset',
        {
          replacements: { letter: normalized, limit, offset },
          type: sequelize.QueryTypes.SELECT
        }
      );

      const totalPages = Math.ceil(totalCount / limit) || 1;

      return {
        letter: normalized,
        words,
        totalCount,
        currentPage: Math.min(page, totalPages),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      };
    } catch (error) {
      console.error('Error getting words by letter:', error);
      throw error;
    }
  }
}

export default new DictionaryService();
