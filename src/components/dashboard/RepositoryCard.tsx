'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { RepositoryWithOrganization } from '@/types/prisma';

interface RepositoryCardProps {
  repository: RepositoryWithOrganization;
}

export function RepositoryCard({ repository }: RepositoryCardProps) {
  return (
    <div className='flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors'>
      <div className='flex-1'>
        <div className='flex items-center space-x-3'>
          <h3 className='font-semibold text-gray-900'>{repository.fullName}</h3>
          <div className='flex space-x-2'>
            {repository.private && <Badge variant='secondary'>Private</Badge>}
            {repository.isEnabled && <Badge variant='success'>Enabled</Badge>}
          </div>
        </div>
        <p className='text-sm text-gray-600 mt-1'>
          {repository.description || 'No description'}
        </p>
        <div className='flex items-center text-xs text-gray-500 mt-2'>
          <span>{repository.organization.name}</span>
          <span className='mx-2'>•</span>
          <Link
            href={repository.url}
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-blue-600'
          >
            View on GitHub
          </Link>
        </div>
      </div>
    </div>
  );
}
