import React, { createContext, useContext, useState, useEffect } from 'react';
import { Admin, Artist, api, convertToUrl } from '@/lib/api';

export type AuthRole = 'admin' | 'artist' | null;

interface AuthContextType {
  admin: Admin | null;
  artist: Artist | null;
  role: AuthRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginArtist: (email: string, password: string) => Promise<boolean>;
  /** Tries admin login first, then artist — for shared /admin sign-in */
  loginUnified: (email: string, password: string) => Promise<AuthRole | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [role, setRole] = useState<AuthRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem('authRole') as AuthRole;
    if (storedRole === 'admin') {
      const storedAdmin = localStorage.getItem('admin');
      if (storedAdmin) {
        try {
          setAdmin(JSON.parse(storedAdmin));
          setRole('admin');
        } catch {
          localStorage.removeItem('admin');
          localStorage.removeItem('authRole');
        }
      }
    } else if (storedRole === 'artist') {
      const storedArtist = localStorage.getItem('artist');
      if (storedArtist) {
        try {
          setArtist(JSON.parse(storedArtist));
          setRole('artist');
        } catch {
          localStorage.removeItem('artist');
          localStorage.removeItem('authRole');
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.login(email, password);
      if (response.success && response.admin) {
        setAdmin(response.admin);
        setArtist(null);
        setRole('admin');
        localStorage.setItem('admin', JSON.stringify(response.admin));
        localStorage.setItem('authRole', 'admin');
        localStorage.removeItem('artist');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const loginArtist = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.loginArtist(email, password);
      if (response.success && response.artist) {
        const artistData = {
          ...response.artist,
          profileImagePath: response.artist.profileImagePath
            ? convertToUrl(response.artist.profileImagePath)
            : null,
        };
        setArtist(artistData);
        setAdmin(null);
        setRole('artist');
        localStorage.setItem('artist', JSON.stringify(artistData));
        localStorage.setItem('authRole', 'artist');
        localStorage.removeItem('admin');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Artist login error:', error);
      return false;
    }
  };

  const loginUnified = async (email: string, password: string): Promise<AuthRole | null> => {
    const adminOk = await login(email, password);
    if (adminOk) return 'admin';
    const artistOk = await loginArtist(email, password);
    if (artistOk) return 'artist';
    return null;
  };

  const logout = () => {
    setAdmin(null);
    setArtist(null);
    setRole(null);
    localStorage.removeItem('admin');
    localStorage.removeItem('artist');
    localStorage.removeItem('authRole');
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        artist,
        role,
        isAuthenticated: !!admin || !!artist,
        isLoading,
        login,
        loginArtist,
        loginUnified,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
