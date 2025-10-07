import React from 'react';
import AppHeader from './AppHeader';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background to-muted/50">
      <AppHeader />
      <main className="flex-1 overflow-y-auto p-4">{children}</main>
    </div>
  );
};

export default ProtectedLayout;