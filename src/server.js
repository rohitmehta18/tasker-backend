import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.routes.js';
import relationshipRoutes from './routes/relationship.routes.js';
import taskRoutes from './routes/task.routes.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin, credentials: true }));

app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'Couples Task Manager API 💖' });
});

app.use('/api/auth', authRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/tasks', taskRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/couples_task_manager';

mongoose.connect(MONGO_URI).then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`API running on :${PORT}`));
}).catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
