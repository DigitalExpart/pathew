import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { Navigate } from 'react-router-dom';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  credits: number;
  story?: string;
  education?: any[];
  experience?: any[];
  goals?: string[];
  achievements?: string[];
  projects?: any[];
  organisation?: string;
  portfolio_url?: string;
  skills?: string[];
  portfolios?: any[];
  location?: string;
  languages?: string[];
  year_of_birth?: string;
  gender?: string;
  country?: string;
  street_address?: string;
  postal_code?: string;
  certifications?: any[];
  notification_settings?: {
    email: boolean;
    push: boolean;
    newsletter: boolean;
  };
  assistant_settings?: {
    tone: string;
    language: string;
    autoSave: boolean;
  };
  marketing_preferences?: {
    opportunityAlerts: boolean;
    productUpdates: boolean;
  };
  subscription_plan?: string;
  role?: 'user' | 'sub_admin' | 'admin';
  renewal_date?: string;
  payment_method?: {
    brand: string;
    last4: string;
    expiry: string;
  };
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);

      if (userEmail) {
        supabase.from('profiles').update({
          email: userEmail,
          last_active_at: new Date().toISOString()
        }).eq('id', userId).then(({ error }) => {
          if (error) console.error('Failed to update tracking info:', error);
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    let activeInterval: ReturnType<typeof setInterval>;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
        
        // Start pinging active status
        activeInterval = setInterval(() => {
          supabase.from('profiles').update({
            last_active_at: new Date().toISOString()
          }).eq('id', session.user.id).then();
        }, 3 * 60 * 1000); // Every 3 mins
      }
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (activeInterval) clearInterval(activeInterval);

      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
        
        activeInterval = setInterval(() => {
          supabase.from('profiles').update({
            last_active_at: new Date().toISOString()
          }).eq('id', session.user.id).then();
        }, 3 * 60 * 1000);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      if (activeInterval) clearInterval(activeInterval);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id, user.email);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
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

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--accent-primary)', fontSize: '1.2rem', fontWeight: 600 }}>Loading Pathew...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
