import { sequelize } from './sequelize.js';
import MailingIteration from './models/MailingIteration.js';

async function syncMailingIterationsTable() {
  try {
    console.log('🔄 Syncing MailingIteration table...');
    
    // Sync the model with the database
    await MailingIteration.sync({ alter: true });
    
    console.log('✅ MailingIteration table synced successfully!');
    
    // Test the connection and show table info
    const tableInfo = await sequelize.query(
      "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'mailing_iterations' ORDER BY ordinal_position;",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n📋 Table Structure:');
    console.table(tableInfo);
    
    // Check if table exists
    const tableExists = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'mailing_iterations');",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (tableExists[0].exists) {
      console.log('✅ mailing_iterations table created successfully!');
    } else {
      console.log('❌ Failed to create mailing_iterations table');
    }
    
  } catch (error) {
    console.error('❌ Error syncing MailingIteration table:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the sync
syncMailingIterationsTable();









