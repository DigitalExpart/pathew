import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { Navigate } from 'react-router-dom';

// SECURITY FIX: Admin authentication is now based on the user's `role` field 
// in the Supabase `profiles` table, NOT hardcoded credentials.
// To make someone an admin, set their profiles.role = 'admin' in Supabase.

interface AdminContextType {
  isAdmin: boolean;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, signOut } = useAuth();
  
  // Admin status is derived from the authenticated user's profile role
  const isAdmin = !!(profile && (profile.role === 'admin' || profile.role === 'sub_admin'));

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    // Import supabase here to avoid circular deps
    const { supabase } = await import('../lib/supabase');
    
    // Sign in via Supabase Auth (real authentication)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error || !data.user) return false;
    
    // Check role from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();
    
    if (profileError || !profileData) return false;
    
    if (profileData.role === 'admin' || profileData.role === 'sub_admin') {
      return true;
    }
    
    // Not an admin — sign them out of this context
    return false;
  };

  const adminLogout = () => {
    signOut();
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
  const { loading } = useAuth();
  
  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', fontWeight: 600 }}>Loading Dashboard...</div>
    </div>;
  }

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
};
