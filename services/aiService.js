/**
 * AI Service Module
 * Handles AI chat interactions using Gemini AI
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config.js';
import userJourneyService from '../database/services/userJourneyService.js';
import AIResponse from '../database/models/AIResponse.js';
import { buildBarclayPrompt } from '../utils/promptBuilder.js';

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
        console.error('   Please set GEMINI_API_KEY in your .env file');
        console.error('   Current value:', config.GEMINI_API_KEY ? `${config.GEMINI_API_KEY.substring(0, 10)}...` : 'undefined');
        this.model = null;
        return;
      }

      console.log('🔧 Initializing AI Service...');
      console.log(`   API Key found: ${config.GEMINI_API_KEY.substring(0, 10)}...${config.GEMINI_API_KEY.substring(config.GEMINI_API_KEY.length - 4)}`);
      
      const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
      this.model = genAI.getGenerativeModel({ model: 'gemini-pro-latest' });
      console.log('✅ AI Service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing AI Service:', error);
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
      this.model = null;
    }
  }
  
  /**
   * Reinitialize AI service (useful after changing API key)
   */
  reinitialize() {
    console.log('🔄 Reinitializing AI Service...');
    this.model = null;
    this.initializeAI();
  }
  
  /**
   * Check if AI service is properly initialized
   */
  isInitialized() {
    return this.model !== null;
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
   * Escape Markdown characters to prevent parsing errors in Telegram
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeMarkdown(text) {
    // Escape special Markdown characters: _ * [ ] ( ) ~ ` > # + - = | { } . !
    return text
      .replace(/\_/g, '\\_')
      .replace(/\*/g, '\\*')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\~/g, '\\~')
      .replace(/\`/g, '\\`')
      .replace(/\>/g, '\\>')
      .replace(/\#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/\-/g, '\\-')
      .replace(/\=/g, '\\=')
      .replace(/\|/g, '\\|')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\./g, '\\.')
      .replace(/\!/g, '\\!');
  }

  /**
   * Format AI response text for Telegram Markdown
   * Removes unnecessary backslashes and preserves * for bold formatting
   * @param {string} text - AI response text to format
   * @returns {string} Formatted text ready for Telegram Markdown
   */
  formatAIResponse(text) {
    // Remove all backslashes that escape characters (like \., \-, \(, \), etc.)
    // But preserve intentional markdown formatting
    let formatted = text
      // Remove escaped periods, dashes, parentheses, etc.
      .replace(/\\([\.\-\(\)\[\]\{\}\+\=\|\#\>\`\~\!])/g, '$1')
      // Remove escaped underscores (but keep them for potential italic)
      .replace(/\\_/g, '_')
      // Keep * for bold formatting (don't escape them)
      // Remove any escaped asterisks
      .replace(/\\\*/g, '*')
      // Convert **text** (standard Markdown bold) to *text* (Telegram Markdown bold)
      .replace(/\*\*([^*]+)\*\*/g, '*$1*')
      // Clean up any double spaces that might result
      .replace(/  +/g, ' ')
      // Trim whitespace
      .trim();

    return formatted;
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
      console.error('❌ AI service is not initialized!');
      console.error('   GEMINI_API_KEY status:', config.GEMINI_API_KEY ? 
        `Found (${config.GEMINI_API_KEY.substring(0, 10)}...)` : 'NOT SET');
      console.error('   Please check your .env file and restart the bot after updating GEMINI_API_KEY');
      throw new Error('AI service is not initialized. Please check GEMINI_API_KEY in .env file and restart the bot.');
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
      // Enhanced error logging for debugging API issues
      console.error('❌ Error generating AI response:');
      console.error(`   Error type: ${error.constructor.name}`);
      console.error(`   Error message: ${error.message || 'No message'}`);
      console.error(`   Error status: ${error.status || error.statusCode || 'N/A'}`);
      if (error.statusText) {
        console.error(`   Status text: ${error.statusText}`);
      }
      if (error.response) {
        console.error(`   Response data:`, JSON.stringify(error.response, null, 2));
      }
      if (error.stack) {
        console.error(`   Stack trace:`, error.stack);
      }
      
      // Check error message and status code
      const errorMessage = error.message || '';
      const errorStatus = error.status || error.statusCode || '';
      
      if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('401') || errorStatus === 401) {
        console.error('   ⚠️ API Key invalid (401)');
        throw new Error('AI service configuration error. Please contact support.');
      } else if (errorMessage.includes('403') || errorMessage.includes('leaked') || errorMessage.includes('Forbidden') || errorStatus === 403) {
        console.error('   ⚠️ API Key issue detected - 403 Forbidden or leaked key');
        throw new Error('AI service configuration error. Please contact support.');
      } else if (errorMessage.includes('429') || errorStatus === 429) {
        console.error('   ⚠️ Rate limit exceeded (429)');
        throw new Error('AI service is temporarily unavailable due to rate limits. Please try again later.');
      } else if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorStatus === 503) {
        console.error('   ⚠️ Service overloaded (503)');
        throw new Error('AI service is temporarily overloaded. Please try again in a few minutes.');
      } else {
        console.error('   ⚠️ Unknown error - generic error message will be shown');
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

  /**
   * Generate Barclay comments response from database event
   * Reads event data from database, constructs prompt, calls AI, stores response
   * Returns response from database (database is the source of truth)
   * @param {number} eventId - UserJourneyEvent ID
   * @returns {Promise<string>} AI response text from database
   */
  async generateBarclayResponse(eventId) {
    if (!this.model) {
      console.error('❌ AI service is not initialized!');
      throw new Error('AI service is not initialized. Please check GEMINI_API_KEY in .env file and restart the bot.');
    }

    const startTime = Date.now();
    let aiResponseRecord = null;

    try {
      // Get event from database
      const event = await userJourneyService.getEventForAI(eventId);
      
      if (!event) {
        throw new Error(`Event ${eventId} not found`);
      }

      // Extract metadata
      const metadata = event.metadata;
      if (!metadata || metadata.aiFeature !== 'barclay_comments') {
        throw new Error(`Event ${eventId} is not a Barclay comments request`);
      }

      // Check if response already exists in database (caching)
      const existingResponse = await AIResponse.findOne({
        where: {
          eventId: eventId,
          status: 'success'
        }
      });

      if (existingResponse && existingResponse.responseText) {
        console.log(`✅ Using cached response from database for event ${eventId}`);
        return existingResponse.responseText;
      }

      // Build prompt from database data
      const prompt = buildBarclayPrompt(metadata);

      // Update event metadata with prompt and status
      await userJourneyService.updateEventMetadata(eventId, prompt, 'processing');

      // Create AIResponse record with pending status
      aiResponseRecord = await AIResponse.create({
        eventId: eventId,
        promptUsed: prompt,
        status: 'pending',
        aiModel: 'gemini-pro-latest'
      });

      console.log(`📝 Created AIResponse record ID: ${aiResponseRecord.id} for event ${eventId}`);

      // Generate response with retry logic
      let result = null;
      let text = null;
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          // Use fresh chat (no history for Barclay comments)
          const chat = this.model.startChat({
            history: []
          });

          // Add instruction to keep responses concise
          const systemPrompt = "Будь ласка, давай короткі та лаконічні відповіді. Обмеж свою відповідь до половини сторінки A4 (приблизно 30 рядків тексту).";
          const enhancedMessage = `${systemPrompt}\n\n${prompt}`;

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

      // Limit response length
      text = this.limitResponseLength(text);

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      // Update AIResponse record with success
      await aiResponseRecord.update({
        responseText: text,
        status: 'success',
        processingTime: processingTime
      });

      // Link AIResponse to event
      await userJourneyService.linkAIResponse(eventId, aiResponseRecord.id);

      // Update event metadata with success status
      await userJourneyService.updateEventMetadata(eventId, prompt, 'success');

      // Reload the record from database to ensure we get the stored version
      await aiResponseRecord.reload();

      // Return response from database (database is the source of truth)
      if (!aiResponseRecord.responseText) {
        throw new Error('Response was not properly stored in database');
      }

      console.log(`✅ Generated and stored Barclay response for event ${eventId} (${processingTime}ms)`);
      return aiResponseRecord.responseText;

    } catch (error) {
      // Calculate processing time even on error
      const processingTime = Date.now() - startTime;

      // Update AIResponse record with error if it was created
      if (aiResponseRecord) {
        try {
          await aiResponseRecord.update({
            status: 'error',
            errorMessage: error.message || 'Unknown error',
            processingTime: processingTime
          });
        } catch (updateError) {
          console.error(`❌ Error updating AIResponse record ${aiResponseRecord.id}:`, updateError);
        }
      } else {
        // Create error record if we didn't get to create one before
        try {
          aiResponseRecord = await AIResponse.create({
            eventId: eventId,
            status: 'error',
            errorMessage: error.message || 'Unknown error',
            processingTime: processingTime
          });
          await userJourneyService.linkAIResponse(eventId, aiResponseRecord.id);
        } catch (createError) {
          console.error(`❌ Error creating error AIResponse record:`, createError);
        }
      }

      // Update event metadata with error status
      try {
        await userJourneyService.updateEventMetadata(eventId, null, 'error');
      } catch (updateError) {
        console.error(`❌ Error updating event metadata:`, updateError);
      }

      // Enhanced error logging
      console.error(`❌ Error generating Barclay response for event ${eventId}:`);
      console.error(`   Error type: ${error.constructor.name}`);
      console.error(`   Error message: ${error.message || 'No message'}`);
      console.error(`   Error status: ${error.status || error.statusCode || 'N/A'}`);

      // Re-throw with appropriate error message
      const errorMessage = error.message || '';
      const errorStatus = error.status || error.statusCode || '';
      
      if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('401') || errorStatus === 401) {
        throw new Error('AI service configuration error. Please contact support.');
      } else if (errorMessage.includes('403') || errorMessage.includes('leaked') || errorMessage.includes('Forbidden') || errorStatus === 403) {
        throw new Error('AI service configuration error. Please contact support.');
      } else if (errorMessage.includes('429') || errorStatus === 429) {
        throw new Error('AI service is temporarily unavailable due to rate limits. Please try again later.');
      } else if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorStatus === 503) {
        throw new Error('AI service is temporarily overloaded. Please try again in a few minutes.');
      } else {
        throw new Error('Помилка при обробці запиту. Спробуйте ще раз.');
      }
    }
  }
}

export default AIService;

