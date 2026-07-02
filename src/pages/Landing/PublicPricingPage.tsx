import React, { useEffect } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { PricingPage } from '../Credits/PricingPage';
import { useLocation } from 'react-router-dom';

export const PublicPricingPage: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePage="pricing" />
      <main style={{ flex: 1, paddingTop: '100px', paddingBottom: '60px' }}>
        <PricingPage />
      </main>
      <Footer />
    </div>
  );
};
