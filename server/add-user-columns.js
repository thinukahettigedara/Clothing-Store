const sql = require('mssql');
const fs = require('fs');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  database: 'DeepanClothingDB',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function addUserColumns() {
  try {
    console.log('Connecting to SQL Server...');
    const pool = await sql.connect(config);
    console.log('Connected to SQL Server');

    const sqlPath = './add-user-columns.sql';
    const schemaSQL = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing SQL to add Phone and Address columns...');
    
    const batches = schemaSQL.split(/\bGO\b/);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i].trim();
      if (batch) {
        try {
          await pool.request().query(batch);
          console.log(`Executed batch ${i + 1}/${batches.length}`);
        } catch (err) {
          console.error(`Error in batch ${i + 1}:`, err.message);
        }
      }
    }

    console.log('Phone and Address columns added successfully!');
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('Error adding columns:', error);
    process.exit(1);
  }
}

addUserColumns();
