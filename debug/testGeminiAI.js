import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config.js';

/**
 * Test script to verify Gemini AI token and functionality
 */
async function testGeminiAI() {
  try {
    console.log('🤖 TESTING GEMINI AI TOKEN');
    console.log('==================================\n');

    // Check if API key is configured
    if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.error('❌ GEMINI_API_KEY is not set in .env file!');
      console.log('Please add your Gemini API key to the .env file:');
      console.log('GEMINI_API_KEY=your_actual_api_key_here\n');
      process.exit(1);
    }

    console.log('✅ API Key found in config');
    console.log(`📝 API Key preview: ${config.GEMINI_API_KEY.substring(0, 10)}...\n`);

    // Initialize Gemini AI
    console.log('🔌 Initializing Gemini AI...');
    const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    
    // Use gemini-pro-latest (we know this model exists from previous tests)
    const modelName = 'gemini-pro-latest';
    const model = genAI.getGenerativeModel({ model: modelName });
    
    console.log(`✅ Using model: ${modelName}`);
    console.log('✅ Gemini AI initialized successfully\n');

    // Test query about the Bible
    const prompt = 'What do you know about the Bible? Please provide a brief overview.';
    
    console.log('📤 Sending test query to Gemini AI...');
    console.log(`Query: "${prompt}"\n`);

    // Retry logic for temporary service issues
    let result = null;
    let text = null;
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        break; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        if (error.message?.includes('503') || error.message?.includes('overloaded')) {
          if (retryCount < maxRetries) {
            const waitTime = retryCount * 2; // 2, 4, 6 seconds
            console.log(`⚠️  Service overloaded. Retrying in ${waitTime} seconds... (attempt ${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
          } else {
            throw error; // Re-throw if all retries failed
          }
        } else {
          throw error; // Re-throw if it's not a 503 error
        }
      }
    }

    console.log('📥 Response received from Gemini AI:');
    console.log('==================================');
    console.log(text);
    console.log('==================================\n');

    console.log('✅ Gemini AI test completed successfully!');
    console.log('🎉 Your API token is working correctly!');

  } catch (error) {
    console.error('\n❌ Error testing Gemini AI:');
    console.error('Error message:', error.message);
    
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
      console.error('\n💡 This usually means:');
      console.error('   - Your API key is invalid or expired');
      console.error('   - Check your API key in the .env file');
      console.error('   - Get a new key from: https://aistudio.google.com/');
    } else if (error.message.includes('429')) {
      console.error('\n💡 This usually means:');
      console.error('   - You have exceeded the rate limit');
      console.error('   - Wait a moment and try again');
    } else {
      console.error('\n💡 Full error details:');
      console.error(error);
    }
    
    process.exit(1);
  }
}

testGeminiAI();

