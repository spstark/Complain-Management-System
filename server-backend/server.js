const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Make sure it's exported as CommonJS
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { loggerMiddleware } = require('./middleware/logger');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

// Make io accessible in routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);

// ✅ Create default admin
const createDefaultAdmin = async () => {
  try {
    const existing = await User.findOne({ email: 'admin@example.com' });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('✅ Default admin created');
    } else {
      console.log('⚠️ Admin already exists');
    }
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
  }
};

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  
}).then(async () => {
  console.log('✅ MongoDB Connected');
  await createDefaultAdmin(); // 🟢 Call only after DB is connected
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => console.error('❌ MongoDB Connection Failed:', err));
