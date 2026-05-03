import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support for large signatures

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper: Generate UUID
const uuid = () => crypto.randomUUID();

// Basic health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ status: 'ok', message: 'Connected to MySQL Database' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: error.message });
  }
});

// Migration endpoint to fix text limits
app.get('/api/migrate', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    let logs = [];
    
    try {
      await connection.query('ALTER TABLE projects MODIFY signature LONGTEXT;');
      await connection.query('ALTER TABLE project_activities MODIFY recipient_signature LONGTEXT;');
      logs.push('Modified signatures to LONGTEXT');
    } catch (e) {
      logs.push('Signatures migration failed or already applied: ' + e.message);
    }

    try {
      await connection.query('ALTER TABLE project_activities ADD COLUMN images LONGTEXT;');
      logs.push('Added images column');
    } catch (e) {
      logs.push('Images column failed or already exists: ' + e.message);
    }

    connection.release();
    res.json({ status: 'ok', logs });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

/* ════════════════════════════════════════════════════════════
   CLIENTS API
   ════════════════════════════════════════════════════════════ */
app.get('/api/clients', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
    // Map snake_case to camelCase
    const clients = rows.map(r => ({ ...r, createdAt: r.created_at }));
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const { id, name, contact, address, phone, email, nit } = req.body;
    const clientId = id || uuid();
    await pool.query(
      `INSERT INTO clients (id, name, contact, address, phone, email, nit) 
       VALUES (?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE name=?, contact=?, address=?, phone=?, email=?, nit=?`,
      [clientId, name, contact, address, phone, email, nit, name, contact, address, phone, email, nit]
    );
    res.json({ id: clientId, message: 'Client saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ message: 'Client deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ════════════════════════════════════════════════════════════
   INVENTORY API
   ════════════════════════════════════════════════════════════ */
app.get('/api/inventory', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM inventory ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const { id, code, category, description, price, stock, unit } = req.body;
    const invId = id || uuid();
    await pool.query(
      `INSERT INTO inventory (id, code, category, description, price, stock, unit) 
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code=?, category=?, description=?, price=?, stock=?, unit=?`,
      [invId, code, category, description, price, stock, unit, code, category, description, price, stock, unit]
    );
    res.json({ id: invId, message: 'Inventory item saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM inventory WHERE id = ?', [req.params.id]);
    res.json({ message: 'Inventory item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ════════════════════════════════════════════════════════════
   PROJECTS API (Quotes, Reports, Invoices)
   ════════════════════════════════════════════════════════════ */
app.get('/api/projects', async (req, res) => {
  try {
    const [projects] = await pool.query(`
      SELECT p.*, c.name as client_name, c.contact as client_contact, c.address as client_address, c.phone as client_phone 
      FROM projects p 
      LEFT JOIN clients c ON p.client_id = c.id 
      ORDER BY p.updated_at DESC
    `);
    
    // We need to fetch items, resources, and activities for each project
    // For a list view, we might not need all deep data, but let's send it to match the local app behavior
    const completeProjects = await Promise.all(projects.map(async (p) => {
      const [items] = await pool.query('SELECT * FROM project_items WHERE project_id = ?', [p.id]);
      const [resources] = await pool.query('SELECT * FROM project_resources WHERE project_id = ?', [p.id]);
      const [activities] = await pool.query('SELECT * FROM project_activities WHERE project_id = ?', [p.id]);
      
      return {
        id: p.id,
        reference: p.reference,
        clientId: p.client_id,
        client: {
          name: p.client_name,
          contact: p.client_contact,
          address: p.client_address,
          phone: p.client_phone
        },
        date: p.date,
        time: p.time,
        status: p.status,
        difficultyConfig: p.difficulty_config ? JSON.parse(p.difficulty_config) : null,
        signature: p.signature,
        total: parseFloat(p.total),
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        // Map child tables back to camelCase
        items: items.map(i => ({ ...i, unitPrice: parseFloat(i.unit_price), difficultyMultiplier: parseFloat(i.difficulty_multiplier), total: parseFloat(i.total) })),
        resources: resources.map(r => ({ ...r, unitPrice: parseFloat(r.unit_price), total: parseFloat(r.total) })),
        activities: activities.map(a => ({ ...a, estimatedHours: parseFloat(a.estimated_hours), price: parseFloat(a.price), authorizedBy: a.authorized_by, recipientName: a.recipient_name, recipientSignature: a.recipient_signature, images: a.images ? JSON.parse(a.images) : [] }))
      };
    }));
    
    res.json(completeProjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id, reference, clientId, date, time, status, difficultyConfig, signature, total, items, resources, activities } = req.body;
    
    // 1. Upsert Project
    await connection.query(
      `INSERT INTO projects (id, reference, client_id, date, time, status, difficulty_config, signature, total) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE reference=?, client_id=?, date=?, time=?, status=?, difficulty_config=?, signature=?, total=?`,
      [id, reference, clientId, date, time, status, JSON.stringify(difficultyConfig), signature, total,
       reference, clientId, date, time, status, JSON.stringify(difficultyConfig), signature, total]
    );

    // 2. Sync Items (Delete old, insert new)
    await connection.query('DELETE FROM project_items WHERE project_id = ?', [id]);
    if (items && items.length > 0) {
      const itemsValues = items.map(i => [i.id || uuid(), id, i.description, i.quantity, i.unitPrice, i.difficultyMultiplier, i.total]);
      await connection.query('INSERT INTO project_items (id, project_id, description, quantity, unit_price, difficulty_multiplier, total) VALUES ?', [itemsValues]);
    }

    // 3. Sync Resources
    await connection.query('DELETE FROM project_resources WHERE project_id = ?', [id]);
    if (resources && resources.length > 0) {
      const resValues = resources.map(r => [r.id || uuid(), id, r.name, r.type, r.quantity, r.unitPrice, r.days || 1, r.total]);
      await connection.query('INSERT INTO project_resources (id, project_id, name, type, quantity, unit_price, days, total) VALUES ?', [resValues]);
    }

    // 4. Sync Activities
    await connection.query('DELETE FROM project_activities WHERE project_id = ?', [id]);
    if (activities && activities.length > 0) {
      const actValues = activities.map(a => [a.id || uuid(), id, a.date, a.time, a.description, a.estimatedHours || 0, a.price || 0, a.authorizedBy, a.recipientName, a.recipientSignature, JSON.stringify(a.images || [])]);
      await connection.query('INSERT INTO project_activities (id, project_id, date, time, description, estimated_hours, price, authorized_by, recipient_name, recipient_signature, images) VALUES ?', [actValues]);
    }

    await connection.commit();
    res.json({ id, message: 'Project saved successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Serve static files from the React frontend (dist folder)
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all route to serve index.html for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Starting server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
