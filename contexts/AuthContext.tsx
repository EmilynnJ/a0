import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define user roles
export type UserRole = 'client' | 'reader' | 'admin';

// Define user type
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage?: string;
  balance?: number; // For clients
  ratePerMinute?: { // For readers
    chat: number;
    audio: number;
    video: number;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  updateUserBalance: (newBalance: number) => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => false,
  signOut: () => {},
  updateUserBalance: () => {},
  updateUser: () => {},
});

// Mock user data for testing
const MOCK_USERS = [
  {
    id: 'client123',
    name: 'Emma Thompson',
    email: 'client@example.com',
    password: 'password123',
    role: 'client' as UserRole,
    profileImage: 'https://api.a0.dev/assets/image?text=spiritual%20client%20female%20profile%20picture&aspect=1:1',
    balance: 100.00,
  },
  {
    id: 'reader123',
    name: 'Mystique Luna',
    email: 'reader@example.com',
    password: 'password123',
    role: 'reader' as UserRole,
    profileImage: 'https://api.a0.dev/assets/image?text=mystical%20woman%20with%20tarot%20cards&aspect=1:1',
    ratePerMinute: {
      chat: 3.99,
      audio: 4.99,
      video: 5.99,
    },
  },
  {
    id: 'admin123',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin' as UserRole,
  },
];

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem('@auth_user');
        if (userJson) {
          setUser(JSON.parse(userJson));
        }
      } catch (e) {
        console.error('Failed to load user from storage', e);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      // Mock authentication
      const foundUser = MOCK_USERS.find(
        u => u.email === email && u.password === password
      );
      
      if (foundUser) {
        // Remove password before storing user
        const { password, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        await AsyncStorage.setItem('@auth_user', JSON.stringify(userWithoutPassword));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Sign in failed', e);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('@auth_user');
      setUser(null);
    } catch (e) {
      console.error('Sign out failed', e);
    }
  };

  const updateUserBalance = (newBalance: number) => {
    if (user && 'balance' in user) {
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      AsyncStorage.setItem('@auth_user', JSON.stringify(updatedUser))
        .catch(e => console.error('Failed to update user balance in storage', e));
    }
  };
  
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      AsyncStorage.setItem('@auth_user', JSON.stringify(updatedUser))
        .catch(e => console.error('Failed to update user in storage', e));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signOut, 
      updateUserBalance,
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);