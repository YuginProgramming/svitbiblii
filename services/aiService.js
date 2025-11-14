/**
 * AI Service Module
 * Handles AI chat interactions using Gemini AI
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config.js';

class AIService {
  constructor() {
    this.model = null;
    this.userChatHistory = new Map(); // Track chat history per user
    this.initializeAI();
  }

  /**
   * Initialize Gemini AI
   */
  initializeAI() {
    try {
      if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        console.error('❌ GEMINI_API_KEY is not set in .env file!');
        return;
      }

      const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
      this.model = genAI.getGenerativeModel({ model: 'gemini-pro-latest' });
      console.log('✅ AI Service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing AI Service:', error);
    }
  }

  /**
   * Get or create chat history for a user
   * @param {number} userId - User ID
   * @returns {Array} Chat history
   */
  getChatHistory(userId) {
    if (!this.userChatHistory.has(userId)) {
      this.userChatHistory.set(userId, []);
    }
    return this.userChatHistory.get(userId);
  }

  /**
   * Clear chat history for a user
   * @param {number} userId - User ID
   */
  clearChatHistory(userId) {
    this.userChatHistory.delete(userId);
  }

  /**
   * Limit response to half A4 page (14pt font) - approximately 2000 characters
   * @param {string} text - Text to limit
   * @returns {string} Limited text
   */
  limitResponseLength(text) {
    const MAX_LENGTH = 2000; // Half A4 page with 14pt font (~30 lines x 65 chars)
    
    if (text.length <= MAX_LENGTH) {
      return text;
    }

    // Try to cut at the last sentence before the limit
    const truncated = text.substring(0, MAX_LENGTH);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastNewline = truncated.lastIndexOf('\n');
    const cutPoint = Math.max(lastPeriod, lastNewline);
    
    if (cutPoint > MAX_LENGTH * 0.7) {
      // If we found a good cut point (at least 70% into the text), use it
      return truncated.substring(0, cutPoint + 1) + '...';
    }
    
    // Otherwise, just cut at the limit
    return truncated + '...';
  }

  /**
   * Split long message into chunks
   * @param {string} text - Text to split
   * @param {number} maxLength - Maximum length per chunk
   * @returns {Array<string>} Array of text chunks
   */
  splitMessage(text, maxLength = 2000) {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxLength;
      
      if (end >= text.length) {
        // Last chunk
        chunks.push(text.substring(start));
        break;
      }

      // Try to split at sentence boundary
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const cutPoint = Math.max(lastPeriod, lastNewline);

      if (cutPoint > start + maxLength * 0.5) {
        // Found a good cut point (at least 50% into the chunk)
        chunks.push(text.substring(start, cutPoint + 1));
        start = cutPoint + 1;
      } else {
        // No good cut point, force split
        chunks.push(text.substring(start, end));
        start = end;
      }
    }

    return chunks;
  }

  /**
   * Generate AI response
   * @param {number} userId - User ID
   * @param {string} userMessage - User's message
   * @returns {Promise<string>} AI response (limited to half A4 page)
   */
  async generateResponse(userId, userMessage) {
    if (!this.model) {
      throw new Error('AI service is not initialized. Please check GEMINI_API_KEY in .env file.');
    }

    try {
      const chatHistory = this.getChatHistory(userId);
      
      // Add instruction to keep responses concise (half A4 page)
      const systemPrompt = "Будь ласка, давай короткі та лаконічні відповіді. Обмеж свою відповідь до половини сторінки A4 (приблизно 30 рядків тексту).";
      const enhancedMessage = `${systemPrompt}\n\n${userMessage}`;
      
      // Add user message to history
      chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

      // Generate response with retry logic
      let result = null;
      let text = null;
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          // Use chat history for context
          const chat = this.model.startChat({
            history: chatHistory.slice(0, -1), // All except the last message
          });

          result = await chat.sendMessage(enhancedMessage);
          const response = await result.response;
          text = response.text();
          break; // Success, exit retry loop
        } catch (error) {
          retryCount++;
          if (error.message?.includes('503') || error.message?.includes('overloaded')) {
            if (retryCount < maxRetries) {
              const waitTime = retryCount * 2; // 2, 4, 6 seconds
              console.log(`⚠️  AI service overloaded. Retrying in ${waitTime} seconds... (attempt ${retryCount}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
            } else {
              throw error; // Re-throw if all retries failed
            }
          } else {
            throw error; // Re-throw if it's not a 503 error
          }
        }
      }

      // Limit response length to half A4 page
      text = this.limitResponseLength(text);

      // Add AI response to history
      chatHistory.push({ role: 'model', parts: [{ text }] });

      // Limit history size to prevent token overflow (keep last 10 exchanges)
      if (chatHistory.length > 20) {
        chatHistory.splice(0, chatHistory.length - 20);
      }

      return text;
    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
        throw new Error('AI service configuration error. Please contact support.');
      } else if (error.message.includes('429')) {
        throw new Error('AI service is temporarily unavailable due to rate limits. Please try again later.');
      } else {
        throw new Error('Помилка при обробці запиту. Спробуйте ще раз.');
      }
    }
  }

  /**
   * Generate AI response and return as chunks if needed
   * @param {number} userId - User ID
   * @param {string} userMessage - User's message
   * @returns {Promise<Array<string>>} Array of response chunks
   */
  async generateResponseChunks(userId, userMessage) {
    const response = await this.generateResponse(userId, userMessage);
    return this.splitMessage(response, 2000);
  }
}

export default AIService;

