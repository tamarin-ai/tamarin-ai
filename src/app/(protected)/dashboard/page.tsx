'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { RepositoryList } from '@/components/dashboard/RepositoryList';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { InstallationCard } from '@/components/dashboard/InstallationCard';
import { api } from '@/utils/api';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const {
    data: repositories,
    isLoading: repositoriesLoading,
    error: repositoriesError,
  } = api.github.repositories.useQuery();

  if (status === 'loading' || repositoriesLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (!session) {
    redirect('/');
  }

  // If there are no repositories or an error occurred, show the installation card
  if (repositoriesError || !repositories || repositories.length === 0) {
    return <InstallationCard isPublicPage={false} />;
  }

  // Show the full dashboard if repositories exist (GitHub app is installed)
  return (
    <div className='min-h-screen bg-white'>
      <DashboardHeader />

      <main className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h1 className='text-2xl font-bold text-gray-900'>
            Welcome back, {session.user?.name || 'Developer'}
          </h1>
          <p className='mt-1 text-sm text-gray-600'>
            Manage your repositories and AI code review settings
          </p>
        </div>

        <StatsCards />

        <div className='mt-8'>
          <RepositoryList />
        </div>
      </main>
    </div>
  );
}
