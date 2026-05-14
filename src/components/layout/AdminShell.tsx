import React from 'react';
import { AdminSidebar } from './AdminSidebar';

export const AdminShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#020617' }}>
    <AdminSidebar />
    <main style={{ flex: 1, marginLeft: '240px', padding: '32px', overflowX: 'hidden' }}>
      {children}
    </main>
  </div>
);
