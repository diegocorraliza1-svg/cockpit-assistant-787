// server.js - Backend completo para Railway, robusto
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const AWS = require('aws-sdk');
const multer = require('multer');
const OpenAI = require('openai');
const pdf = require('pdf-parse');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// -------- Seguridad / Middlewares base
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

// CORS: permite FRONTEND_URL (Vercel o localhost). Puedes añadir más con coma.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // Permite tools/curl o misma máquina (sin origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origen no permitido por CORS: ' + origin), false);
    },
    credentials: true,
  })
);

// -------- /health SIEMPRE disponible (no requiere DB)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// -------- PostgreSQL (no romper si falta DATABASE_URL)
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
} else {
  console.warn('⚠️  DATABASE_URL no definida; las rutas que usan DB responderán 500.');
}

// --- INIT DB (crea tablas y admin si no existen) ---
async function initDb() {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS vector;

      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'pilot',
        license TEXT,
        active BOOLEAN NOT NULL DEFAULT true,
        last_login TIMESTAMP,
        query_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS documents (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        aircraft_type TEXT NOT NULL,
        version TEXT,
        notes TEXT,
        s3_key TEXT NOT NULL,
        page_count INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'ready',
        query_count INTEGER NOT NULL DEFAULT 0,
        upload_date TIMESTAMP NOT NULL DEFAULT NOW(),
        uploaded_by BIGINT REFERENCES users(id)
      );
      CREATE INDEX IF NOT EXISTS documents_status_idx ON documents(status);
      CREATE INDEX IF NOT EXISTS documents_querycount_idx ON documents(query_count DESC);

      CREATE TABLE IF NOT EXISTS document_chunks (
        id BIGSERIAL PRIMARY KEY,
        document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        embedding vector(3072) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS document_chunks_embedding_ivfflat
        ON document_chunks USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

      CREATE TABLE IF NOT EXISTS conversations (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT REFERENCES users(id),
        title TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS messages (
        id BIGSERIAL PRIMARY KEY,
        conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS messages_conversation_idx
        ON messages(conversation_id, created_at);
    `);

    // crear admin si no existe
    const adminEmail = 'admin@local';
    const { rows } = await pool.query('SELECT id FROM users WHERE email=$1', [adminEmail]);
    if (rows.length === 0) {
      const passwordHash = await bcrypt.hash('Admin123!', 10); // cámbiala luego
      await pool.query(
        'INSERT INTO users (name,email,password_hash,role,license,active) VALUES ($1,$2,$3,$4,$5,$6)',
        ['Admin', adminEmail, passwordHash, 'admin', 'ATPL', true]
      );
      console.log('✅ Admin creado: admin@local / Admin123! (cámbialo después)');
    } else {
      console.log('ℹ️ Admin ya existe');
    }

    console.log('✅ DB init completa');
  } catch (e) {
    console.error('❌ Error initDb:', e);
  }
}

// Lanza la inicialización nada más arrancar si hay pool
initDb();


// Middleware para exigir DB en rutas /api/*
function requireDB(req, res, next) {
  if (!pool) return res.status(500).json({ error: 'DB no configurada' });
  next();
}

// -------- AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

// -------- OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// -------- Multer (solo PDF)
const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Solo se permiten archivos PDF'));
  },
});

// -------- JWT
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } catch (e) {
    return res.sendStatus(401);
  }
};

// A partir de aquí, todas las rutas /api/* requieren DB
app.use('/api', requireDB);

// ============ AUTH ROUTES ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'change_me',
      { expiresIn: '24h' }
    );
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, license: user.license },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.post('/api/auth/register', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'No autorizado' });

    const { name, email, password, role, license } = req.body;
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) return res.status(400).json({ error: 'El email ya está registrado' });

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, license) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, license',
      [name, email, passwordHash, role, license]
    );
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============ DOCUMENTS ROUTES ============
app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    const { type, aircraft, search, sort } = req.query;
    let query = 'SELECT * FROM documents WHERE status != $1';
    const params = ['deleted'];
    let paramCount = 2;

    if (type && type !== 'all') {
      query += ` AND type = $${paramCount++}`;
      params.push(type);
    }
    if (aircraft && aircraft !== 'all') {
      query += ` AND aircraft_type = $${paramCount++}`;
      params.push(aircraft);
    }
    if (search) {
      query += ` AND name ILIKE $${paramCount++}`;
      params.push(`%${search}%`);
    }

    if (sort === 'name') query += ' ORDER BY name ASC';
    else if (sort === 'queries') query += ' ORDER BY query_count DESC';
    else query += ' ORDER BY upload_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
});

app.post('/api/documents/upload', authenticateToken, multerUpload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'No autorizado' });

    const { name, type, aircraftType, version, notes } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No se proporcionó archivo' });

    const s3Key = `documents/${Date.now()}-${file.originalname}`;
    await s3
      .upload({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Body: file.buffer,
        ContentType: 'application/pdf',
      })
      .promise();

    const pdfData = await pdf(file.buffer);
    const pageCount = pdfData.numpages;
    const textContent = pdfData.text;

    const result = await pool.query(
      'INSERT INTO documents (name, type, aircraft_type, version, notes, s3_key, page_count, status, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [name, type, aircraftType, version, notes, s3Key, pageCount, 'ready', req.user.id]
    );

    const chunks = chunkText(textContent, 1000);
for (let i = 0; i < chunks.length; i++) {
  const chunkEmbedding = await openai.embeddings.create({
  model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  input: chunks[i],
});

  const emb = chunkEmbedding.data[0].embedding;
  const embLit = `[${emb.join(',')}]`; // convierte a literal vector
  await pool.query(
    'INSERT INTO document_chunks (document_id, chunk_index, content, embedding) VALUES ($1, $2, $3, $4::vector)',
    [result.rows[0].id, i, chunks[i], embLit]
  );
}

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error al subir documento' });
  }
});

app.delete('/api/documents/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'No autorizado' });
    await pool.query('UPDATE documents SET status = $1, deleted_at = NOW() WHERE id = $2', [
      'deleted',
      req.params.id,
    ]);
    res.json({ message: 'Documento movido a papelera' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
});

app.post('/api/documents/:id/restore', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'No autorizado' });
    await pool.query('UPDATE documents SET status = $1, deleted_at = NULL WHERE id = $2', [
      'ready',
      req.params.id,
    ]);
    res.json({ message: 'Documento restaurado' });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Error al restaurar documento' });
  }
});

// ============ CHAT ROUTES ============
app.post('/api/chat/query', authenticateToken, async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    const queryEmbedding = await openai.embeddings.create({
  model: 'text-embedding-3-large',
  input: message,
});

const q = queryEmbedding.data[0].embedding;
const qlit = `[${q.join(',')}]`;

const relevantChunks = await pool.query(
  `SELECT dc.content, d.name, d.type, d.aircraft_type, d.id as doc_id
   FROM document_chunks dc
   JOIN documents d ON dc.document_id = d.id
   WHERE d.status = 'ready'
   ORDER BY dc.embedding <-> $1::vector
   LIMIT 5`,
  [qlit]
);

    const context = relevantChunks.rows
      .map((chunk) => `[${chunk.name} - ${chunk.type}]\n${chunk.content}`)
      .join('\n\n---\n\n');

    let chatHistory = [];
    if (conversationId) {
      const historyResult = await pool.query(
        'SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 10',
        [conversationId]
      );
      chatHistory = historyResult.rows;
    }

    const completion = await openai.chat.completions.create({
      model: process.env.GPT_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Eres Cockpit Assistant, asistente especializado en documentación del Boeing 787.

REGLAS ANTI-ALUCINACIÓN:
1. SOLO responde con información EXPLÍCITA del contexto
2. Si NO está en el contexto: "No encuentro esa información en los documentos disponibles"
3. NUNCA inventes procedimientos o datos técnicos
4. SIEMPRE cita documento y sección específica
5. Para temas críticos, sé extra conservador

CONTEXTO:
${context}

Si el contexto está vacío, di que no tienes información disponible.`,
        },
        ...chatHistory.map((msg) => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: message },
      ],
      temperature: parseFloat(process.env.GPT_TEMPERATURE) || 0.1,
      max_tokens: parseInt(process.env.GPT_MAX_TOKENS) || 1500,
    });

    const response = completion.choices[0].message.content;

    let convId = conversationId;
    if (!convId) {
      const newConv = await pool.query(
        'INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING id',
        [req.user.id, message.substring(0, 50)]
      );
      convId = newConv.rows[0].id;
    }

    await pool.query('INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)', [
      convId,
      'user',
      message,
    ]);
    await pool.query('INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)', [
      convId,
      'assistant',
      response,
    ]);
    await pool.query('UPDATE users SET query_count = query_count + 1 WHERE id = $1', [req.user.id]);

    if (relevantChunks.rows.length > 0) {
      await pool.query('UPDATE documents SET query_count = query_count + 1 WHERE id = ANY($1)', [
        relevantChunks.rows.map((r) => r.doc_id),
      ]);
    }

    res.json({
      response,
      conversationId: convId,
      sources: relevantChunks.rows.map((chunk) => ({
        document: chunk.name,
        type: chunk.type,
        aircraft: chunk.aircraft_type,
      })),
    });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Error al procesar consulta' });
  }
});

app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM conversations WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
});

app.get('/api/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// ============ ANALYTICS ============
app.get('/api/analytics/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'No autorizado' });
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM messages WHERE DATE(created_at) = CURRENT_DATE) as today_queries,
        (SELECT COUNT(*) FROM messages WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_queries,
        (SELECT COUNT(*) FROM messages WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as month_queries,
        (SELECT COUNT(*) FROM documents WHERE status = 'ready') as total_documents,
        (SELECT SUM(page_count) FROM documents WHERE status = 'ready') as total_pages
    `);
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ============ USERS ============
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'No autorizado' });
    const result = await pool.query(
      'SELECT id, name, email, role, license, active, last_login, query_count FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.patch('/api/users/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'No autorizado' });
    const { active } = req.body;
    await pool.query('UPDATE users SET active = $1 WHERE id = $2', [active, req.params.id]);
    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// -------- Utilidad
function chunkText(text, chunkSize) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}

// -------- Manejador global de errores (ultimo middleware)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// -------- Arranque compatible Railway
const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
});

// -------- Capturas de errores no controlados
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
