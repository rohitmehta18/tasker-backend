import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { z } from 'zod';
import User from '../models/User.js';
import Group from '../models/Group.js';
import { generateInviteCode } from '../utils/invite.js';

const router = Router();

router.get('/me', authRequired, async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');
  res.json({ user });
});

router.post('/create-group', authRequired, async (req, res) => {
  try {
    const name = req.body.name?.trim() || `${req.user.name}'s Household`;
    const group = await Group.create({ name, members: [req.user._id] });
    req.user.groupId = group._id;
    await req.user.save();
    res.json({ group });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

router.post('/invite-code', authRequired, async (req, res) => {
  try {
    if (!req.user.groupId) return res.status(400).json({ error: 'Create or join a group first' });
    const code = generateInviteCode();
    req.user.inviteCode = code;
    await req.user.save();
    res.json({ code });
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

const joinSchema = z.object({ code: z.string().min(6).max(20) });

router.post('/join-by-code', authRequired, async (req, res) => {
  try {
    const { code } = joinSchema.parse(req.body);
    const inviter = await User.findOne({ inviteCode: code });
    if (!inviter || !inviter.groupId) return res.status(404).json({ error: 'Invalid code' });
    const group = await Group.findById(inviter.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    // attach user to group
    if (!group.members.some(m => m.toString() === req.user._id.toString())) {
      group.members.push(req.user._id);
      await group.save();
    }
    req.user.groupId = group._id;
    await req.user.save();
    res.json({ group });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: e.errors[0].message });
    res.status(500).json({ error: 'Failed to join group' });
  }
});

router.get('/my-group', authRequired, async (req, res) => {
  try {
    if (!req.user.groupId) return res.json({ group: null });
    const group = await Group.findById(req.user.groupId).populate('members', 'name email');
    res.json({ group });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

export default router;
