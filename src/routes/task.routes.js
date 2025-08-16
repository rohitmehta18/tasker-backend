import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { z } from 'zod';
import Task from '../models/Task.js';

const router = Router();

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
  date: z.coerce.date(),
  status: z.enum(['Not Started', 'In Progress', 'Completed']).optional().default('Not Started'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional().default('Low'),
  tags: z.array(z.string()).optional().default([])
});

// Create
router.post('/', authRequired, async (req, res) => {
  try {
    const parsed = taskSchema.parse(req.body);
    const t = await Task.create({
      ...parsed,
      owner: req.user._id,
      groupId: req.user.groupId || null
    });
    res.json({ task: t });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: e.errors[0].message });
    res.status(500).json({ error: 'Create task failed' });
  }
});

// Read list with filters: date range, status, etc.
router.get('/', authRequired, async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {
      $or: [
        { owner: req.user._id },
        ...(req.user.groupId ? [{ groupId: req.user.groupId }] : [])
      ]
    };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    const tasks = await Task.find(filter).sort({ date: 1, createdAt: -1 });
    res.json({ tasks });
  } catch (e) {
    res.status(500).json({ error: 'Fetch tasks failed' });
  }
});

// Update (owner only)
router.put('/:id', authRequired, async (req, res) => {
  try {
    const id = req.params.id;
    const t = await Task.findById(id);
    if (!t) return res.status(404).json({ error: 'Task not found' });
    if (t.owner.toString() != req.user._id.toString()) return res.status(403).json({ error: 'Not your task' });
    const parsed = taskSchema.partial().parse(req.body);
    Object.assign(t, parsed);
    await t.save();
    res.json({ task: t });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: e.errors[0].message });
    res.status(500).json({ error: 'Update failed' });
  }
});

// Delete (owner only)
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const id = req.params.id;
    const t = await Task.findById(id);
    if (!t) return res.status(404).json({ error: 'Task not found' });
    if (t.owner.toString() != req.user._id.toString()) return res.status(403).json({ error: 'Not your task' });
    await t.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

export default router;
