'use client';

import { CircleCheck } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

interface PricingFeature {
  text: string;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  features: PricingFeature[];
  button: {
    text: string;
    url: string;
  };
}

interface PricingProps {
  heading?: string;
  description?: string;
  plans?: PricingPlan[];
}

const Pricing = ({
  heading = 'Pricing',
  description = 'Check out our pricing plans',
  plans = [
    {
      id: 'Free',
      name: 'Free',
      description: 'For teams to use',
      monthlyPrice: 'Free',
      yearlyPrice: 'Free',
      features: [
        { text: '1,000 credits per month' },
        { text: 'Unlimited public repositories' },
        { text: 'Basic code review insights' },
        { text: 'Community support' },
        { text: 'Easy GitHub integration' },
      ],
      button: {
        text: 'Get Started',
        url: 'https://github.com/apps/tamarin',
      },
    },
  ],
}: PricingProps) => {
  const [isYearly, setIsYearly] = useState(false);
  return (
    <section className='py-32'>
      <div className='container'>
        <div className='mx-auto flex max-w-5xl flex-col items-center gap-6 text-center'>
          <h2 className='text-4xl font-semibold text-black/80 lg:text-5xl'>
            {heading}
          </h2>
          <p className='text-black/50 lg:text-xl'>{description}</p>

          <div className='flex flex-col items-stretch gap-6 md:flex-row'>
            {plans.map(plan => (
              <Card
                key={plan.id}
                className='flex w-80 flex-col justify-between text-left'
              >
                <CardHeader>
                  <CardTitle>
                    <p>{plan.name}</p>
                  </CardTitle>
                  <p className='text-sm text-black/50'>{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <Separator className='mb-6' />
                  {plan.id === 'pro' && (
                    <p className='mb-3 font-semibold'>
                      Everything in Plus, and:
                    </p>
                  )}
                  <ul className='space-y-4'>
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className='flex items-center gap-2 text-sm'
                      >
                        <CircleCheck className='size-4' />
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className='mt-auto'>
                  <Button asChild className='w-full'>
                    <a href={plan.button.url} target='_blank'>
                      {plan.button.text}
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export { Pricing };
