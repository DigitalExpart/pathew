import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { PublicPricingPage } from './PublicPricingPage';
import { PricingPage } from '../Credits/PricingPage';
import { Shell } from '../../components/layout/Shell';

export const PricingRouteHandler: React.FC = () => {
  const { user } = useAuth();
  
  if (user) {
    return (
      <Shell>
        <PricingPage />
      </Shell>
    );
  }
  
  return <PublicPricingPage />;
};
