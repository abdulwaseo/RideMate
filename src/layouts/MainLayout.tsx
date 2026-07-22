import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-brand-bg relative overflow-x-hidden">
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[40%] right-1/4 w-[600px] h-[600px] rounded-full bg-brand-accent/5 blur-[140px] pointer-events-none z-0" />

      <Navbar />
      
      <main className="flex-grow pt-20 relative z-10">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
