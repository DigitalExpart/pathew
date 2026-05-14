import React, { createContext, useContext, useState } from 'react';

const ADMIN_EMAIL = 'hello@pathew.com';
const ADMIN_PASSWORD = 'PathewAdmin';

interface AdminContextType {
  isAdmin: boolean;
  adminLogin: (email: string, password: string) => boolean;
  adminLogout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('pathew_admin') === 'true');

  const adminLogin = (email: string, password: string): boolean => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      sessionStorage.setItem('pathew_admin', 'true');
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    sessionStorage.removeItem('pathew_admin');
    setIsAdmin(false);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, adminLogin, adminLogout }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};

export const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAdmin();
  if (!isAdmin) {
    window.location.href = '/admin';
    return null;
  }
  return <>{children}</>;
};
