'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface InstallationCardProps {
  isPublicPage?: boolean;
}

export function InstallationCard({
  isPublicPage = false,
}: InstallationCardProps) {
  const handleInstall = () => {
    const githubAppName =
      process.env.NEXT_PUBLIC_GITHUB_APP_NAME || 'ai-code-review';
    window.open(
      `https://github.com/apps/${githubAppName}/installations/new`,
      '_blank'
    );
  };

  const handleNotAdmin = () => {
    // Handle the "I'm not a GitHub admin" case
    // This could redirect to documentation or contact form
    window.open(
      'https://docs.github.com/en/developers/apps/managing-github-apps/installing-github-apps',
      '_blank'
    );
  };

  const handleLearnMore = () => {
    // Redirect to documentation or features page
    window.open('https://github.com/features/copilot', '_blank');
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <Card className='max-w-lg w-full'>
        <CardContent className='pt-8 pb-8 px-8 text-center space-y-6'>
          {/* Logo */}
          <div className='flex justify-center'>
            <div className='w-16 h-16 bg-black rounded-lg flex items-center justify-center'>
              <svg
                className='w-10 h-10 text-white'
                fill='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  d='M5 5L19 5M12 5L12 19'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.5'
                />
                <circle cx='5' cy='5' r='2' />
                <circle cx='19' cy='5' r='2' />
                <circle cx='12' cy='19' r='2' />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className='text-3xl font-bold text-gray-900'>Tamarin AI</h1>

          {/* Description */}
          <p className='text-gray-600 text-base leading-relaxed'>
            {isPublicPage
              ? 'AI-powered code reviews for your GitHub repositories. Get intelligent, contextual feedback on pull requests with automated suggestions for improvements, bug detection, and best practices.'
              : 'Tamarin is an AI Software Engineer capable of reviewing pull requests, writing code, summarizing recent code changes, answering questions, and more...'}
          </p>

          {/* Features for public page */}
          {isPublicPage && (
            <div className='text-left space-y-3 bg-gray-50 p-4 rounded-lg'>
              <h3 className='font-semibold text-gray-900 text-center'>
                Features
              </h3>
              <ul className='space-y-2 text-sm text-gray-600'>
                <li className='flex items-center'>
                  <span className='w-2 h-2 bg-green-500 rounded-full mr-3'></span>
                  Automated pull request reviews
                </li>
                <li className='flex items-center'>
                  <span className='w-2 h-2 bg-green-500 rounded-full mr-3'></span>
                  Code quality and security analysis
                </li>
                <li className='flex items-center'>
                  <span className='w-2 h-2 bg-green-500 rounded-full mr-3'></span>
                  Performance optimization suggestions
                </li>
                <li className='flex items-center'>
                  <span className='w-2 h-2 bg-green-500 rounded-full mr-3'></span>
                  Best practices recommendations
                </li>
              </ul>
            </div>
          )}

          {/* Install Button */}
          <Button
            onClick={handleInstall}
            className='w-full bg-black hover:bg-black/80 text-white py-3 rounded-md'
            size='lg'
          >
            <svg
              className='w-5 h-5 mr-2'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
            </svg>
            Install on GitHub
          </Button>

          {/* Additional actions for public page */}
          {isPublicPage && (
            <div className='space-y-3'>
              <div className='text-sm text-gray-500'>
                Requires GitHub repository admin access
              </div>
              <div className='flex space-x-3'>
                <Button
                  onClick={handleNotAdmin}
                  variant='outline'
                  size='sm'
                  className='flex-1'
                >
                  I&apos;m not an admin
                </Button>
                <Button
                  onClick={handleLearnMore}
                  variant='outline'
                  size='sm'
                  className='flex-1'
                >
                  Learn more
                </Button>
              </div>
            </div>
          )}

          {/* Installation steps for public page */}
          {isPublicPage && (
            <div className='text-left space-y-3 bg-blue-50 p-4 rounded-lg mt-6'>
              <h3 className='font-semibold text-blue-900 text-center'>
                Installation Steps
              </h3>
              <ol className='space-y-2 text-sm text-blue-800'>
                <li className='flex items-start'>
                  <span className='font-bold mr-2'>1.</span>
                  Click &quot;Install on GitHub&quot; above
                </li>
                <li className='flex items-start'>
                  <span className='font-bold mr-2'>2.</span>
                  Choose repositories to enable AI reviews
                </li>
                <li className='flex items-start'>
                  <span className='font-bold mr-2'>3.</span>
                  Create pull requests and get AI feedback automatically
                </li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
