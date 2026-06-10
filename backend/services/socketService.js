const socketIo = require('socket.io');

let io = null;
const userConnections = new Map(); // userId -> socketId
const adminConnections = new Set(); // socketIds of connected admins

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register user session
    socket.on('register', ({ userId, role }) => {
      if (userId) {
        userConnections.set(userId, socket.id);
        socket.userId = userId;
        console.log(`Registered user ${userId} to socket ${socket.id}`);
      }
      if (role === 'admin') {
        adminConnections.add(socket.id);
        socket.isAdmin = true;
        console.log(`Registered admin socket: ${socket.id}`);
      }
    });

    // Handle order tracking room subscriptions
    socket.on('joinOrderTrack', (orderId) => {
      socket.join(orderId);
      console.log(`Socket ${socket.id} joined tracking room: ${orderId}`);
    });

    socket.on('leaveOrderTrack', (orderId) => {
      socket.leave(orderId);
      console.log(`Socket ${socket.id} left tracking room: ${orderId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (socket.userId) {
        userConnections.delete(socket.userId);
      }
      if (socket.isAdmin) {
        adminConnections.delete(socket.id);
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};

// Send message to a specific user
const sendToUser = (userId, event, data) => {
  const socketId = userConnections.get(userId.toString());
  if (socketId && io) {
    io.to(socketId).emit(event, data);
  }
};

// Broadcast to order tracking room
const updateOrderTracking = (orderId, status, estimatedTime) => {
  if (io) {
    io.to(orderId).emit('statusUpdate', { orderId, status, estimatedTime });
  }
};

// Send message to all admins
const sendToAdmins = (event, data) => {
  if (io) {
    adminConnections.forEach((socketId) => {
      io.to(socketId).emit(event, data);
    });
  }
};

module.exports = {
  initSocket,
  getIO,
  sendToUser,
  updateOrderTracking,
  sendToAdmins
};
