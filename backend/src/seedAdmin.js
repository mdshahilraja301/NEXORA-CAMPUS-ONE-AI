require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

(async () => {
  try {
    if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) throw new Error('Set MONGODB_URI and JWT_SECRET in .env first.');
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) throw new Error('Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in .env.');
    await mongoose.connect(process.env.MONGODB_URI);
    const email = ADMIN_EMAIL.trim().toLowerCase();
    const exists = await User.findOne({ email });
    if (exists) throw new Error('An account with ADMIN_EMAIL already exists; refusing to change its role automatically.');
    await User.create({ name: ADMIN_NAME, email, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12), role: 'admin' });
    console.log(`Admin account created for ${email}. Keep the password private.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally { await mongoose.disconnect().catch(() => {}); }
})();
