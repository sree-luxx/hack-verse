import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, hasApiBaseUrl, setAuthToken, postForm } from '../lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: User['role']) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state. Prefer backend if configured, otherwise fallback to localStorage
    const init = async () => {
      try {
        const savedToken = localStorage.getItem('hackverse_token');
        if (hasApiBaseUrl() && savedToken) {
          setAuthToken(savedToken);
          try {
            const me = await api.get('/auth/me');
            if (me) {
              setUser({
                ...me,
                createdAt: new Date(me.createdAt || Date.now())
              });
              localStorage.setItem('hackverse_user', JSON.stringify(me));
              return;
            }
          } catch {
            // fall through to local
          }
        }

        const savedUser = localStorage.getItem('hackverse_user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser({
              ...parsedUser,
              createdAt: new Date(parsedUser.createdAt)
            });
          } catch (error) {
            localStorage.removeItem('hackverse_user');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (hasApiBaseUrl()) {
        // NextAuth credential flow: fetch CSRF, then POST callback/credentials
        try {
          const csrf: any = await api.get('/api/auth/csrf');
          const csrfToken = csrf?.csrfToken || csrf?.token || csrf;
          // Preferred NextAuth credentials endpoint
          try {
            await postForm('/api/auth/callback/credentials', {
              csrfToken: String(csrfToken || ''),
              email,
              password,
              json: 'true',
              callbackUrl: '/'
            });
          } catch (err) {
            // Fallback to signin/credentials if callback path not available
            await postForm('/api/auth/signin/credentials', {
              csrfToken: String(csrfToken || ''),
              email,
              password,
              json: 'true',
              callbackUrl: '/'
            });
          }
        } catch (e) {
          // If credentials failed, throw to fallback to mock error handling
          throw e;
        }
        // Load session user
        const me = await api.get('/api/users/me');
        const normalized: User = {
          id: me.id,
          email: me.email,
          name: me.name || me.email?.split('@')[0],
          role: (me.role?.toString().toLowerCase?.() || 'participant') as User['role'],
          createdAt: new Date(),
          avatar: me.image,
          socialLinks: me.socialLinks || {}
        };
        setUser(normalized);
        localStorage.setItem('hackverse_user', JSON.stringify(me));
        return;
      }

      // Fallback mock
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        role: email.includes('organizer') ? 'organizer' : 
              email.includes('judge') ? 'judge' : 'participant',
        createdAt: new Date(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        socialLinks: {
          github: `https://github.com/${email.split('@')[0]}`,
          linkedin: `https://linkedin.com/in/${email.split('@')[0]}`,
        }
      };
      setUser(mockUser);
      localStorage.setItem('hackverse_user', JSON.stringify(mockUser));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role: User['role']) => {
    setIsLoading(true);
    try {
      if (hasApiBaseUrl()) {
        // Create user, then log them in
        await api.post('/api/auth/register', { name, email, password, role: role.toUpperCase() });
        const csrf: any = await api.get('/api/auth/csrf');
        const csrfToken = csrf?.csrfToken || csrf?.token || csrf;
        try {
          await postForm('/api/auth/callback/credentials', {
            csrfToken: String(csrfToken || ''),
            email,
            password,
            json: 'true',
            callbackUrl: '/'
          });
        } catch {
          await postForm('/api/auth/signin/credentials', {
            csrfToken: String(csrfToken || ''),
            email,
            password,
            json: 'true',
            callbackUrl: '/'
          });
        }
        const me = await api.get('/api/users/me');
        const normalized: User = {
          id: me.id,
          email: me.email,
          name: me.name || name,
          role: (me.role?.toString().toLowerCase?.() || role) as User['role'],
          createdAt: new Date(),
          avatar: me.image,
          socialLinks: me.socialLinks || {}
        };
        setUser(normalized);
        localStorage.setItem('hackverse_user', JSON.stringify(me));
        return;
      }

      // Fallback mock
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name,
        role,
        createdAt: new Date(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        socialLinks: {}
      };
      setUser(newUser);
      localStorage.setItem('hackverse_user', JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    if (hasApiBaseUrl()) {
      try {
        // No explicit update endpoint provided; skip server update
        const result = updates;
        const merged = { ...user, ...result } as any;
        const normalized: User = {
          id: merged.id || user.id,
          email: merged.email || user.email,
          name: merged.name || user.name,
          role: merged.role || user.role,
          createdAt: new Date(merged.createdAt || user.createdAt),
          avatar: merged.avatar || user.avatar,
          socialLinks: merged.socialLinks || user.socialLinks,
        };
        setUser(normalized);
        localStorage.setItem('hackverse_user', JSON.stringify(merged));
        return;
      } catch {
        // fallback to local update below
      }
    }

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('hackverse_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hackverse_user');
    setAuthToken(null);
    localStorage.removeItem('hackverse_token');
    if (hasApiBaseUrl()) {
      // Best-effort signout to clear NextAuth session cookie
      api.get('/api/auth/csrf').then((csrf: any) => {
        const csrfToken = csrf?.csrfToken || csrf?.token || csrf;
        return postForm('/api/auth/signout', { csrfToken: String(csrfToken || ''), callbackUrl: '/' });
      }).catch(() => {});
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};