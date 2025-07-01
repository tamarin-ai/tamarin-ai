'use client';

import { api } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RepositoryCard } from './RepositoryCard';

export function RepositoryList() {
  const {
    data: repositories,
    isLoading,
    error,
  } = api.github.repositories.useQuery();

  if (error) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='text-center text-red-600'>
            Error loading repositories: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Repositories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='animate-pulse'>
                <div className='flex items-center justify-between p-4 border rounded-lg'>
                  <div className='flex-1'>
                    <div className='h-5 bg-gray-200 rounded w-48 mb-2'></div>
                    <div className='h-4 bg-gray-200 rounded w-64'></div>
                  </div>
                  <div className='h-6 bg-gray-200 rounded w-12'></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!repositories || repositories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Repositories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8'>
            <div className='text-gray-500 mb-4'>
              No repositories found. Install the GitPack AI GitHub App to get
              started.
            </div>
            <a
              href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME}/installations/new`}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
            >
              Install GitHub App
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repositories ({repositories.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {repositories.map(repository => (
            <RepositoryCard key={repository.id} repository={repository} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
