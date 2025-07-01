'use client';

import { api } from '@/utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StatsCards() {
  const { data: stats, isLoading } = api.github.repositoryStats.useQuery({});

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader className='pb-2'>
              <div className='h-4 bg-gray-200 rounded w-24'></div>
            </CardHeader>
            <CardContent>
              <div className='h-8 bg-gray-200 rounded w-16'></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: 'Active Repos',
      value: stats?.enabled || 0,
      description: 'Enabled for Tamarin',
    },
    {
      title: 'Private Repos',
      value: stats?.private || 0,
      description: 'Private repositories',
    },
    {
      title: 'Public Repos',
      value: stats?.public || 0,
      description: 'Public repositories',
    },
  ];

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      {statsData.map(stat => (
        <Card key={stat.title}>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600'>
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-gray-900'>{stat.value}</div>
            <p className='text-xs text-gray-500 mt-1'>{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
