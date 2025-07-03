'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Menu, Sunset, Zap } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

interface Navbar1Props {
  logo?: {
    url: string;
    src?: string;
    alt: string;
    title: string;
  };
  menu?: MenuItem[];
}

const Navbar1 = ({
  logo = {
    url: '/',
    alt: 'logo',
    title: 'Tamarin',
  },
}: Navbar1Props) => {
  const { data: session, status } = useSession();

  return (
    <section className='py-2 bg-white fixed w-full z-50 '>
      <div className='container lg:border border-black/10 lg:shadow-sm px-4 py-2 rounded-full max-w-5xl'>
        {/* Desktop Menu */}
        <nav className='hidden justify-between lg:flex'>
          <div className='flex items-center gap-6'>
            {/* Logo */}
            <Link href={logo.url} className='flex items-center gap-2'>
              <div className='w-8 h-8 bg-black rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>T</span>
              </div>
              <span className='text-lg font-semibold tracking-tighter'>
                {logo.title}
              </span>
            </Link>
          </div>
          <div className='flex items-center gap-6'>
            <div className='flex items-center z-50'>
              <Button
                size='sm'
                onClick={() => signIn('github')}
                className='bg-black/90 hover:bg-black/90 rounded-full text-white ml-4'
              >
                Sign in with GitHub
              </Button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className='block lg:hidden'>
          <div className='flex items-center justify-between'>
            {/* Logo */}
            <Link href={logo.url} className='flex items-center gap-2'>
              <div className='w-8 h-8 bg-black rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>T</span>
              </div>
              <span className='text-lg font-semibold tracking-tighter'>
                {logo.title}
              </span>
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant='outline' size='icon'>
                  <Menu className='size-4' />
                </Button>
              </SheetTrigger>
              <SheetContent className='overflow-y-auto'>
                <SheetHeader>
                  <SheetTitle>
                    <Link href={logo.url} className='flex items-center gap-2'>
                      <img src={logo.src} className='max-h-8' alt={logo.alt} />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className='flex flex-col gap-6 p-4'>
                  <Button
                    onClick={() => signIn('github')}
                    className='bg-black/90 hover:bg-black/90 text-white'
                  >
                    Sign in with GitHub
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Navbar1 };
