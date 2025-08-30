
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { useData } from '../contexts/DataContext';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdminOrSecretary: boolean;
  login: (email: string, password?: string) => User | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const { contacts } = useData(); 

  const login = (email: string, password?: string): User | null => {
    const foundUser = contacts.find(u => u.orgEmail.toLowerCase() === email.toLowerCase());
    
    // In a real app, you would hash and compare passwords.
    // Here we check for the default password.
    if (foundUser && foundUser.password === password) {
      setUser(foundUser);
      return foundUser;
    }
    return null;
  };

  const logout = () => {
    setUser(null);
  };
  
  const isAuthenticated = !!user;
  const isAdminOrSecretary = user?.role === UserRole.Admin || user?.role === UserRole.Secretary;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdminOrSecretary, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};