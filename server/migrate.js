import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function migrate() {
  try {
    console.log('Starting migration...');
    
    // 1. Alter projects.signature to LONGTEXT
    await pool.query('ALTER TABLE projects MODIFY signature LONGTEXT;');
    console.log('Modified projects.signature to LONGTEXT');

    // 2. Alter project_activities.recipient_signature to LONGTEXT
    await pool.query('ALTER TABLE project_activities MODIFY recipient_signature LONGTEXT;');
    console.log('Modified project_activities.recipient_signature to LONGTEXT');

    // 3. Add images column to project_activities
    try {
        await pool.query('ALTER TABLE project_activities ADD COLUMN images LONGTEXT;');
        console.log('Added images column to project_activities');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Column images already exists.');
        } else {
            throw e;
        }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
