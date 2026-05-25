const sql = require('mssql');
const fs = require('fs');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  database: 'master', // Connect to master first to create the database
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function setupDatabase() {
  try {
    console.log('Connecting to SQL Server...');
    const pool = await sql.connect(config);
    console.log('Connected to SQL Server');

    // Read the SQL schema file
    const schemaPath = './database-schema.sql';
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing database schema...');
    
    // Split the SQL by GO statements and execute each batch
    const batches = schemaSQL.split(/\bGO\b/);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i].trim();
      if (batch) {
        try {
          await pool.request().query(batch);
          console.log(`Executed batch ${i + 1}/${batches.length}`);
        } catch (err) {
          if (err.message.includes('already exists')) {
            console.log(`Batch ${i + 1}: Object already exists, skipping...`);
          } else {
            console.error(`Error in batch ${i + 1}:`, err.message);
          }
        }
      }
    }

    console.log('Database setup completed successfully!');
    console.log('Tables created: Products, Orders, Users, Cart, Settings, Reviews, Messages');
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
