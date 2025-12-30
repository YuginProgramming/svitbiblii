import { sequelize } from './sequelize.js';
import AIResponse from './models/AIResponse.js';

async function syncAIResponsesTable() {
  try {
    console.log('🔄 Syncing AIResponse table...');
    
    // Sync the model with the database
    await AIResponse.sync({ alter: true });
    
    console.log('✅ AIResponse table synced successfully!');
    
    // Test the connection and show table info
    const tableInfo = await sequelize.query(
      "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'ai_responses' ORDER BY ordinal_position;",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n📋 Table Structure:');
    console.table(tableInfo);
    
    // Check if table exists
    const tableExists = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_responses');",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (tableExists[0].exists) {
      console.log('✅ ai_responses table created successfully!');
    } else {
      console.log('❌ Failed to create ai_responses table');
    }
    
  } catch (error) {
    console.error('❌ Error syncing AIResponse table:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the sync
syncAIResponsesTable();



