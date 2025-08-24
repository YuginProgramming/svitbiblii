import { sequelize } from './sequelize.js';
import TelegramUser from './models/TelegramUser.js';

async function syncTelegramUsersTable() {
  try {
    console.log('🔄 Syncing TelegramUser table...');
    
    // Sync the model with the database
    await TelegramUser.sync({ alter: true });
    
    console.log('✅ TelegramUser table synced successfully!');
    
    // Test the connection and show table info
    const tableInfo = await sequelize.query(
      "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'telegram_users' ORDER BY ordinal_position;",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n📋 Table Structure:');
    console.table(tableInfo);
    
    // Check if table exists
    const tableExists = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'telegram_users');",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (tableExists[0].exists) {
      console.log('✅ telegram_users table created successfully!');
    } else {
      console.log('❌ Failed to create telegram_users table');
    }
    
  } catch (error) {
    console.error('❌ Error syncing TelegramUser table:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the sync
syncTelegramUsersTable();
