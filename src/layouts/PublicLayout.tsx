import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { Container } from '../components/ui/Container';

export const PublicLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-brand-bg relative overflow-x-hidden">
      {/* Visual background lights */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-brand-accent/5 blur-[100px] pointer-events-none z-0" />
      
      <Navbar />

      <main className="flex-grow pt-24 pb-16 relative z-10">
        <Container>
          <Outlet />
        </Container>
      </main>

      <Footer />
    </div>
  );
};
