import { Button } from '@/components/ui/button';
import { Badge } from './ui/badge';
import { Github } from 'lucide-react';
import { signIn } from 'next-auth/react';

const Hero = () => {
  const handleGetStarted = () => {
    signIn('github');
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
            <Badge variant='outline' className='flex items-center gap-2'>
              <span className='text-xs'>🔒</span>
              <span className='text-xs'>Open Source & Secure</span>
            </Badge>
            <h1 className='my-6 text-pretty text-4xl font-bold '>
              Supercharge Your Code Reviews with Open Source
            </h1>
            <p className='text-black/80 mb-8 max-w-xl '>
              Your AI code reviewer built for accuracy and transparency.
            </p>
            <div className='flex w-full flex-col justify-center gap-2 sm:flex-row lg:justify-start'>
              <Button
                onClick={handleGetStarted}
                className='w-full bg-black/90 hover:bg-black/90 text-white'
              >
                Sign in with GitHub
              </Button>
              <Button
                onClick={handleGithub}
                variant='outline'
                className='w-fit whitespace-nowrap'
              >
                <Github className='size-4 mr-2' />
                View on Github
              </Button>
            </div>
          </div>
          <img
            src='https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg'
            alt='Tamarin'
            className='max-h-96 w-full rounded-md object-cover'
          />
        </div>
      </div>
    </section>
  );
};

export { Hero };
