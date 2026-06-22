import { createContext, useContext, useState, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import * as api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('jrv_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [activeLocation, setActiveLocation] = useState(() => {
    const raw = localStorage.getItem('jrv_location');
    return raw ? JSON.parse(raw) : null;
  });

  const signIn = useCallback(async (userCode, password) => {
    const res = await api.login(userCode, password);
    localStorage.setItem('jrv_token', res.token);
    const userObj = { id: res.userId, userCode: res.userCode, fullName: res.fullName };
    localStorage.setItem('jrv_user', JSON.stringify(userObj));
    setUser(userObj);
    return userObj;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('jrv_token');
    localStorage.removeItem('jrv_user');
    localStorage.removeItem('jrv_location');
    setUser(null);
    setActiveLocation(null);
  }, []);

  const chooseLocation = useCallback((location) => {
    localStorage.setItem('jrv_location', JSON.stringify(location));
    setActiveLocation(location);
  }, []);

  return (
    <AuthContext.Provider value={{ user, activeLocation, signIn, signOut, chooseLocation }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function ProtectedRoute({ children, requireLocation = true }) {
  const { user, activeLocation } = useAuth();
  const loc = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />;
  if (requireLocation && !activeLocation) return <Navigate to="/select-location" replace />;
  return children;
}
