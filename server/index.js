import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT) || 3001;
const authCookie = 'budget_pro_session';
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
const categories = {
  income: new Set(['Salary', 'Freelance', 'Bonus', 'Investment', 'Other']),
  expense: new Set([
    'Housing',
    'Food',
    'Transportation',
    'Utilities',
    'Health',
    'Entertainment',
    'Education',
    'Shopping',
    'Travel',
    'Other',
  ]),
};

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be configured.');
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters.');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function issueSession(res, userId) {
  const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie(authCookie, token, cookieOptions);
}

function requireAuth(req, res, next) {
  const token = req.cookies[authCookie];
  if (!token) {
    return next(httpError(401, 'Please sign in to continue.'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      return next(httpError(401, 'Your session is invalid. Please sign in again.'));
    }
    req.userId = payload.sub;
    return next();
  } catch {
    return next(httpError(401, 'Your session has expired. Please sign in again.'));
  }
}

function parseCredentials(body, requireName = false) {
  body = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (
    (requireName && (!name || name.length > 100)) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    password.length < 8 ||
    password.length > 72
  ) {
    throw httpError(400, 'Enter a valid email and a password between 8 and 72 characters.');
  }

  return { name, email, password };
}

function parseTransaction(body) {
  body = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const { type, category, description, date } = body;
  const amount = Number(body.amount);
  const parsedDate = typeof date === 'string' ? new Date(`${date}T00:00:00.000Z`) : null;

  if (
    (type !== 'income' && type !== 'expense') ||
    typeof category !== 'string' ||
    !categories[type].has(category) ||
    typeof description !== 'string' ||
    !description.trim() ||
    description.trim().length > 200 ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 9999999999.99 ||
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsedDate?.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw httpError(400, 'Enter a valid transaction type, category, description, amount, and date.');
  }

  return { type, category, description: description.trim(), amount, date };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { name, email, password } = parseCredentials(req.body, true);
    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash],
    );
    issueSession(res, rows[0].id);
    res.status(201).json({ user: rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return next(httpError(409, 'An account with this email already exists.'));
    }
    return next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = parseCredentials(req.body);
    const { rows } = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email],
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw httpError(401, 'Incorrect email or password.');
    }

    issueSession(res, user.id);
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(authCookie, { ...cookieOptions, maxAge: undefined });
  res.status(204).end();
});

app.get('/api/auth/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.userId]);
    if (!rows[0]) {
      throw httpError(401, 'Your account is no longer available. Please sign in again.');
    }
    res.json({ user: rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/transactions', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, type, category, description, amount::float8 AS amount,
              transaction_date::text AS date
       FROM transactions
       WHERE user_id = $1
       ORDER BY transaction_date DESC, created_at DESC`,
      [req.userId],
    );
    res.json({ transactions: rows });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/transactions', requireAuth, async (req, res, next) => {
  try {
    const transaction = parseTransaction(req.body);
    const { rows } = await pool.query(
      `INSERT INTO transactions (user_id, type, category, description, amount, transaction_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, type, category, description, amount::float8 AS amount,
                 transaction_date::text AS date`,
      [
        req.userId,
        transaction.type,
        transaction.category,
        transaction.description,
        transaction.amount,
        transaction.date,
      ],
    );
    res.status(201).json({ transaction: rows[0] });
  } catch (error) {
    return next(error);
  }
});

if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.use((error, _req, res, _next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  if (error.status) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error(error);
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});

async function start() {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(schema);
  app.listen(port, () => {
    console.log(`Budget Pro API listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start Budget Pro API:', error);
  process.exitCode = 1;
});
