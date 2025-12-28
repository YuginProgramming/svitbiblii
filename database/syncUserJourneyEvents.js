import { sequelize } from './sequelize.js';
import UserJourneyEvent from './models/UserJourneyEvent.js';

async function syncUserJourneyEventsTable() {
  try {
    console.log('🔄 Syncing UserJourneyEvent table...');
    
    // Sync the model with the database
    await UserJourneyEvent.sync({ alter: true });
    
    console.log('✅ UserJourneyEvent table synced successfully!');
    
    // Test the connection and show table info
    const tableInfo = await sequelize.query(
      "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'user_journey_events' ORDER BY ordinal_position;",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n📋 Table Structure:');
    console.table(tableInfo);
    
    // Check if table exists
    const tableExists = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_journey_events');",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (tableExists[0].exists) {
      console.log('✅ user_journey_events table created successfully!');
    } else {
      console.log('❌ Failed to create user_journey_events table');
    }
    
  } catch (error) {
    console.error('❌ Error syncing UserJourneyEvent table:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the sync
syncUserJourneyEventsTable();


