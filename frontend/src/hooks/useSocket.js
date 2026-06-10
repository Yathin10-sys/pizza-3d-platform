import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector, useDispatch } from 'react-redux';
import { updateTrackingStatus, addNewAdminOrder } from '../redux/slices/orderSlice';

export const useSocket = (onNotificationReceived) => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to WebSocket server
    // Vite proxy handles /socket.io automatically, or connect directly
    socketRef.current = io('/', {
      autoConnect: true,
      reconnection: true
    });

    const socket = socketRef.current;

    // Register user details
    socket.emit('register', { userId: user.id, role: user.role });

    // Global event listeners
    socket.on('statusUpdate', (data) => {
      // data: { orderId, status, estimatedTime }
      dispatch(updateTrackingStatus(data));
      if (onNotificationReceived) {
        onNotificationReceived({
          title: 'Order Updated',
          message: `Order ${data.orderId} status changed to ${data.status}`,
          type: 'order'
        });
      }
    });

    socket.on('newNotification', (notif) => {
      if (onNotificationReceived) {
        onNotificationReceived(notif);
      }
    });

    socket.on('newOrder', (order) => {
      if (user.role === 'admin') {
        dispatch(addNewAdminOrder(order));
      }
    });

    socket.on('lowStockAlert', (lowItems) => {
      if (user.role === 'admin' && onNotificationReceived) {
        onNotificationReceived({
          title: '🚨 Stock Shortage Warning',
          message: `The following bases/toppings are running low: ${lowItems.map(i => i.name).join(', ')}`,
          type: 'stock'
        });
      }
    });

    return () => {
      socket.off('statusUpdate');
      socket.off('newNotification');
      socket.off('newOrder');
      socket.off('lowStockAlert');
      socket.disconnect();
    };
  }, [user, isAuthenticated, dispatch, onNotificationReceived]);

  const joinOrderTracking = (orderId) => {
    if (socketRef.current) {
      socketRef.current.emit('joinOrderTrack', orderId);
    }
  };

  const leaveOrderTracking = (orderId) => {
    if (socketRef.current) {
      socketRef.current.emit('leaveOrderTrack', orderId);
    }
  };

  return {
    socket: socketRef.current,
    joinOrderTracking,
    leaveOrderTracking
  };
};
export default useSocket;
