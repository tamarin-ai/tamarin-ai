import { InstallationCard } from '@/components/dashboard/InstallationCard';

export const metadata = {
  title: 'Install Tamarin AI - GitHub App',
  description:
    'Install the Tamarin AI GitHub app to get automated AI-powered code reviews for your repositories.',
};

export default function InstallPage() {
  return <InstallationCard isPublicPage={true} />;
}
