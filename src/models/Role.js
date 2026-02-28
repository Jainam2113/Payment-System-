const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    lowercase: true,
    trim: true,
    enum: ['admin', 'manager', 'user']
  },
  permissions: [{
    type: String,
    required: true
  }],
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes
roleSchema.index({ name: 1 });

// Prevent deletion if users are assigned to this role
roleSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  const User = mongoose.model('User');
  const userCount = await User.countDocuments({ role: this._id });

  if (userCount > 0) {
    throw new Error(`Cannot delete role. ${userCount} user(s) are assigned to this role.`);
  }
  next();
});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
