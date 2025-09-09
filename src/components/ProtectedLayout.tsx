import React from 'react';
import AppHeader from './AppHeader';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <AppHeader />
      <main>{children}</main>
    </div>
  );
};

export default ProtectedLayout;