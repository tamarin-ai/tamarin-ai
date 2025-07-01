import { Button } from '@/components/ui/button';
import { Badge } from './ui/badge';
import { Github } from 'lucide-react';
import OneClickInstallCard from './OneClickInstallCard';

const Integration = () => {
  const handleGetStarted = () => {
    window.open('https://tamarin.ai', '_blank', 'noopener,noreferrer');
  };

  const handleGithub = () => {
    window.open(
      'https://github.com/tamarin-ai',
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <section className='py-32'>
      <div className='container'>
        <div className='grid items-center gap-8 lg:grid-cols-2'>
          <div className='flex flex-col items-center text-center lg:items-start lg:text-left'>
            <h1 className='my-6 text-pretty text-4xl font-bold '>
              Connect Effortlessly with GitHub
            </h1>
            <p className='text-black/80 mb-8 max-w-xl '>
              GitPack AI connects to your GitHub repositories in just a few
              clicks. Once set up, it automatically reviews your pull requests,
              saving you time and effort.
            </p>
            <div className='flex w-full flex-col justify-center gap-2 sm:flex-row lg:justify-start'>
              <Button onClick={handleGetStarted} className='w-full'>
                Get Started
              </Button>
            </div>
          </div>
          <OneClickInstallCard />
        </div>
      </div>
    </section>
  );
};

export { Integration };
