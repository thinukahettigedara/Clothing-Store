const sql = require('mssql');
require('dotenv').config();

// SQL Server Configuration
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function deleteAllOrders() {
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('Connected to SQL Server');

    // Delete all orders
    const result = await pool.request().query('DELETE FROM Orders');
    console.log(`Deleted ${result.rowsAffected} orders from the database`);
    console.log('All orders deleted successfully!');
  } catch (err) {
    console.error('Error deleting orders:', err);
  } finally {
    if (pool) await pool.close();
  }
}

deleteAllOrders();
