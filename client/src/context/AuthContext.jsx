import { createContext, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

export const AuthContext = createContext();

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get('/api/auth/check');
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(
          'Not authenticated or token expired. Redirecting to login.'
        );
        setAuthUser(null);
        localStorage.removeItem('token');
        setToken(null);
      } else {
        console.error(
          'Check Auth Error:',
          error.response?.data?.message || error.message
        );
        toast.error(
          error.response?.data?.message ||
            error.message ||
            'Authentication check failed.'
        );
      }
    }
  };

  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        connectSocket(data.userData);
        axios.defaults.headers.common['token'] = data.token;
        setToken(data.token);
        localStorage.setItem('token', data.token);
        toast.success(data.message);
        return { success: true, userData: data.userData };
      } else {
        toast.error(data.message || 'Login failed.');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || 'Login failed.'
      );
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    delete axios.defaults.headers.common['token'];
    toast.success('User logged out successfully');
    socket?.disconnect();
    setSocket(null);
  };

  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put('/api/auth/update-profile', body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success('User profile updated successfully');
      } else {
        toast.error(data.message || 'Profile update failed.');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Profile update failed.'
      );
    }
  };

  const connectSocket = (userData) => {
    if (!userData) return;

    const newSocket = io(import.meta.env.VITE_BACKEND_URL, {
      query: { userId: userData._id },
    });

    setSocket(newSocket);
    newSocket.on('getOnlineUsers', (userIds) => {
      setOnlineUsers(userIds);
    });
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['token'] = token;
      checkAuth();
    } else {
      setAuthUser(null);
      socket?.disconnect();
      setSocket(null);
    }
  }, [token]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
