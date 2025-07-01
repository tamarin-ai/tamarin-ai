import {
  BatteryCharging,
  GitPullRequest,
  Layers,
  RadioTower,
  SquareKanban,
  WandSparkles,
  Brain,
  Unlock,
  Puzzle,
  Shield,
} from 'lucide-react';

interface Reason {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface Feature43Props {
  heading?: string;
  reasons?: Reason[];
}

const Features = ({
  heading = 'Start Building With Us',
  reasons = [
    {
      title: 'Open and Transparent',
      description:
        'The code is open source. You can check, use, or improve it yourself—no hidden parts.',
      icon: <Unlock className='size-6' />,
    },
    {
      title: 'Consistent Code Quality',
      description:
        'Automated reviews help catch common issues and keep your codebase healthy for everyone.',
      icon: <Shield className='size-6' />,
    },
    {
      title: 'Faster Code Reviews',
      description:
        'Let the system handle routine checks so your team can spend more time building and less time waiting.',
      icon: <BatteryCharging className='size-6' />,
    },
    {
      title: 'Feedback from Real Use',
      description:
        'Get quick feedback based on how your app runs in production, so you can fix problems early.',
      icon: <RadioTower className='size-6' />,
    },
    {
      title: 'Instant Suggestions',
      description:
        'Receive helpful tips and warnings on every pull request, across different programming languages.',
      icon: <GitPullRequest className='size-6' />,
    },
    {
      title: 'Works with Your Tools',
      description:
        'Connects easily with GitHub, GitLab, Bitbucket, and more. Review comments show up right in your pull requests.',
      icon: <Puzzle className='size-6' />,
    },
  ],
}: Feature43Props) => {
  return (
    <section className='py-10'>
      <div className='container'>
        <div className='mb-10 md:mb-20'>
          <h2 className='text-center text-2xl font-semibold lg:text-4xl'>
            {heading}
          </h2>
        </div>
        <div className='grid gap-10 md:grid-cols-2 lg:grid-cols-3'>
          {reasons.map((reason, i) => (
            <div key={i} className='flex flex-col'>
              <div className='mb-5 flex size-16 items-center justify-center rounded-full bg-black/5'>
                {reason.icon}
              </div>
              <h3 className='mb-2 text-lg font-semibold'>{reason.title}</h3>
              <p className='text-black/80 text-sm'>{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Features };
