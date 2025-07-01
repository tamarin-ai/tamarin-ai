import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { ArrowRightIcon, Github } from 'lucide-react';
import React from 'react';

const OneClickInstallCard = () => (
  <Card className='bg-black/5 border-none shadow-xl p-8 rounded-2xl text-white max-w-md mx-auto'>
    <CardHeader className='pb-4'>
      <CardTitle className='text-2xl font-semibold text-black'>
        1-Click Install
      </CardTitle>
      <CardDescription className='text-sm text-black/70 mb-4'>
        Add Tamarin to your GitHub in seconds. No manual setup, no hassle.
      </CardDescription>
    </CardHeader>
    <CardContent className='flex flex-col justify-center gap-4 pt-8'>
      <div className='text-lg font-bold mb-2 text-black'>
        No configuration needed
      </div>
      <div className='flex items-center gap-6 mt-2'>
        <div className='flex items-center justify-center w-12 h-12 rounded-lg'>
          <Github className='w-8 h-8 text-black' />
        </div>
        <ArrowRightIcon className='text-black size-8' />
        <div className='w-10 h-10 bg-black rounded-lg flex items-center justify-center'>
          <span className='text-white font-bold text-sm'>T</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default OneClickInstallCard;
