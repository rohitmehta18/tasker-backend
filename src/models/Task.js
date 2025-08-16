import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: false },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Low' },
  tags: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('Task', TaskSchema);
