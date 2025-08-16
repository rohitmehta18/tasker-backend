import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  inviteCode: { type: String, default: null } // unique code a user can share
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
