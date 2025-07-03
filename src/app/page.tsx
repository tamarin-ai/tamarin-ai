'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/Navbar';

import { Hero } from '@/components/Hero';
import { Features } from '@/components/Features';
import { Pricing } from '@/components/Pricing';
import { Integration } from '@/components/Integration';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  const { data: session, status } = useSession();

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  // Redirect to dashboard if user is logged in
  if (session) {
    redirect('/dashboard');
  }

  // Show landing page if user is not logged in
  return (
    <>
      <div className='min-h-screen bg-white'>
        <Navbar />

        <div className='container mx-auto max-w-5xl'>
          <Hero />
          <Features />

          <Integration />
          <Pricing />
          <Footer />
        </div>
      </div>
    </>
  );
}
