import { sequelize, testConnection } from './sequelize.js';

/**
 * Simple Database Connection Test
 * Run with: node database/testConnection.js
 */
async function testDatabaseConnection() {
  try {
    console.log('🔌 Testing Database Connection...');
    console.log('===============================');
    
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('\n✅ SUCCESS: Database connection established!');
      
      // Get basic database info
      const dbInfo = await sequelize.query("SELECT current_database() as database, current_user as user");
      console.log(`📊 Database: ${dbInfo[0][0].database}`);
      console.log(`👤 User: ${dbInfo[0][0].user}`);
      
      // Test a simple query
      const result = await sequelize.query("SELECT NOW() as current_time");
      console.log(`⏰ Current time: ${result[0][0].current_time}`);
      
    } else {
      console.log('\n❌ FAILED: Could not connect to database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Connection closed');
  }
}

testDatabaseConnection();
