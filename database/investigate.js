import { sequelize, testConnection } from './sequelize.js';

/**
 * Database Investigation Script
 * Run with: node database/investigate.js
 */
async function investigateDatabase() {
  try {
    console.log('🔍 DATABASE INVESTIGATION');
    console.log('========================');
    
    // Test connection
    console.log('\n1️⃣ Testing Database Connection...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.log('❌ Cannot proceed without database connection');
      return;
    }
    
    // Get database information
    console.log('\n2️⃣ Database Information...');
    const dbInfo = await sequelize.query("SELECT current_database() as database, current_user as user, version() as version");
    console.log('Database:', dbInfo[0][0].database);
    console.log('User:', dbInfo[0][0].user);
    console.log('Version:', dbInfo[0][0].version.split(',')[0]);
    
    // List all tables
    console.log('\n3️⃣ Existing Tables...');
    const tables = await sequelize.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tables[0].length === 0) {
      console.log('📭 No tables found in the database');
    } else {
      console.log('📋 Found tables:');
      tables[0].forEach(table => {
        console.log(`  - ${table.table_name} (${table.table_type})`);
      });
    }
    
    // Get table details for each table
    if (tables[0].length > 0) {
      console.log('\n4️⃣ Table Details...');
      for (const table of tables[0]) {
        if (table.table_type === 'BASE TABLE') {
          console.log(`\n📊 Table: ${table.table_name}`);
          
          // Get column information
          const columns = await sequelize.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = '${table.table_name}' 
            ORDER BY ordinal_position
          `);
          
          console.log('  Columns:');
          columns[0].forEach(col => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
            console.log(`    - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
          });
          
          // Get row count
          const count = await sequelize.query(`SELECT COUNT(*) as count FROM "${table.table_name}"`);
          console.log(`  Rows: ${count[0][0].count}`);
          
          // Show sample data (first 3 rows)
          if (count[0][0].count > 0) {
            const sample = await sequelize.query(`SELECT * FROM "${table.table_name}" LIMIT 3`);
            console.log('  Sample data:');
            sample[0].forEach((row, index) => {
              console.log(`    Row ${index + 1}:`, JSON.stringify(row, null, 2));
            });
          }
        }
      }
    }
    
    // Check for indexes
    console.log('\n5️⃣ Database Indexes...');
    const indexes = await sequelize.query(`
      SELECT 
        t.table_name,
        i.indexname,
        i.indexdef
      FROM pg_indexes i
      JOIN information_schema.tables t ON i.tablename = t.table_name
      WHERE t.table_schema = 'public'
      ORDER BY t.table_name, i.indexname
    `);
    
    if (indexes[0].length === 0) {
      console.log('📭 No indexes found');
    } else {
      console.log('🔍 Found indexes:');
      indexes[0].forEach(index => {
        console.log(`  - ${index.table_name}.${index.indexname}`);
      });
    }
    
    // Check database size
    console.log('\n6️⃣ Database Size...');
    const size = await sequelize.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as size
    `);
    console.log('Database size:', size[0][0].size);
    
    // Check active connections
    console.log('\n7️⃣ Active Connections...');
    const connections = await sequelize.query(`
      SELECT count(*) as active_connections 
      FROM pg_stat_activity 
      WHERE state = 'active'
    `);
    console.log('Active connections:', connections[0][0].active_connections);
    
    console.log('\n✅ Database investigation completed!');
    
  } catch (error) {
    console.error('❌ Error during database investigation:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the investigation
investigateDatabase();
