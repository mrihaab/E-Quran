import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '../api';

const env = (import.meta as any).env || {};
const SOCKET_URL: string =
  env.VITE_BACKEND_URL ||
  env.VITE_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect_error', (error: Error) => {
      // eslint-disable-next-line no-console
      console.error('Socket connection error:', error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinUserRoom = useCallback((userId: number) => {
    socketRef.current?.emit('join', userId);
  }, []);

  const onNewMessage = useCallback((callback: (message: any) => void) => {
    socketRef.current?.on('new_message', callback);
    return () => {
      socketRef.current?.off('new_message', callback);
    };
  }, []);

  const onNotification = useCallback((callback: (notification: any) => void) => {
    socketRef.current?.on('notification', callback);
    return () => {
      socketRef.current?.off('notification', callback);
    };
  }, []);

  return {
    socket: socketRef.current,
    joinUserRoom,
    onNewMessage,
    onNotification,
    connected: socketRef.current?.connected || false,
  };
}

export default useSocket;
