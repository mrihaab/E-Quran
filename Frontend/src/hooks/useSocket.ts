import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '../api';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Connect to Socket.io server with auth token
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Join user room for receiving personal messages
  const joinUserRoom = useCallback((userId: number) => {
    if (socketRef.current) {
      socketRef.current.emit('join', userId);
    }
  }, []);

  // Listen for new messages
  const onNewMessage = useCallback((callback: (message: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('new_message', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('new_message', callback);
      }
    };
  }, []);

  // Listen for notifications
  const onNotification = useCallback((callback: (notification: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('notification', callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('notification', callback);
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    joinUserRoom,
    onNewMessage,
    onNotification,
    connected: socketRef.current?.connected || false
  };
}

export default useSocket;
