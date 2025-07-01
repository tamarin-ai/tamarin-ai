'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MenuItem {
  title: string;
  url: string;
  description?: string;
}

interface DashboardHeaderProps {
  logo?: {
    url: string;
    src?: string;
    alt: string;
    title: string;
  };
  menu?: MenuItem[];
}

export function DashboardHeader({
  logo = {
    url: '/',
    alt: 'logo',
    title: 'Tamarin',
  },
  menu = [
    {
      title: 'Dashboard',
      url: '/dashboard',
    },
    {
      title: 'Settings',
      url: '/dashboard/settings',
    },
  ],
}: DashboardHeaderProps) {
  const { data: session, status } = useSession();

  return (
    <section className='py-2 bg-white border-b border-gray-200 sticky top-0 z-50'>
      <div className='container max-w-7xl'>
        {/* Desktop Menu */}
        <nav className='hidden justify-between lg:flex'>
          <div className='flex items-center gap-6'>
            {/* Logo */}
            <Link href={logo.url} className='flex items-center gap-2'>
              {logo.src ? (
                <img src={logo.src} className='max-h-8' alt={logo.alt} />
              ) : (
                <div className='w-8 h-8 bg-black rounded-lg flex items-center justify-center'>
                  <span className='text-white font-bold text-sm'>T</span>
                </div>
              )}
              <span className='text-lg font-semibold tracking-tighter'>
                {logo.title}
              </span>
            </Link>
          </div>

          <div className='flex items-center gap-6'>
            <div className='flex items-center z-50'>
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map(item => (
                    <NavigationMenuItem key={item.title}>
                      <NavigationMenuLink
                        href={item.url}
                        className='group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-accent-foreground'
                      >
                        {item.title}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>

              {status === 'loading' ? (
                <div className='animate-pulse ml-4'>
                  <div className='h-9 w-24 bg-gray-200 rounded'></div>
                </div>
              ) : session ? (
                <div className='flex items-center gap-3 ml-4'>
                  <div className='flex items-center gap-2'>
                    <Avatar className='h-8 w-8'>
                      <AvatarImage
                        src={session.user?.image || ''}
                        alt={session.user?.name || 'User'}
                      />
                      <AvatarFallback>
                        {session.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className='text-sm font-medium text-gray-900 hidden sm:block'>
                      {session.user?.name}
                    </span>
                  </div>
                  <Button variant='ghost' size='sm' onClick={() => signOut()}>
                    Sign out
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className='block lg:hidden'>
          <div className='flex items-center justify-between'>
            {/* Logo */}
            <Link href={logo.url} className='flex items-center gap-2'>
              {logo.src ? (
                <img src={logo.src} className='max-h-8' alt={logo.alt} />
              ) : (
                <div className='w-8 h-8 bg-black rounded-lg flex items-center justify-center'>
                  <span className='text-white font-bold text-sm'>G</span>
                </div>
              )}
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
                      {logo.src ? (
                        <img
                          src={logo.src}
                          className='max-h-8'
                          alt={logo.alt}
                        />
                      ) : (
                        <div className='w-8 h-8 bg-black rounded-lg flex items-center justify-center'>
                          <span className='text-white font-bold text-sm'>
                            T
                          </span>
                        </div>
                      )}
                      <span className='text-lg font-semibold tracking-tighter'>
                        {logo.title}
                      </span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>

                <div className='flex flex-col gap-6 p-4'>
                  <div className='flex flex-col gap-4'>
                    {menu.map(item => (
                      <Link
                        key={item.title}
                        href={item.url}
                        className='text-md font-semibold hover:text-primary transition-colors'
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>

                  {status === 'loading' ? (
                    <div className='animate-pulse'>
                      <div className='h-10 w-full bg-gray-200 rounded'></div>
                    </div>
                  ) : session ? (
                    <div className='flex flex-col gap-3 pt-4 border-t'>
                      <div className='flex items-center gap-2'>
                        <Avatar className='h-8 w-8'>
                          <AvatarImage
                            src={session.user?.image || ''}
                            alt={session.user?.name || 'User'}
                          />
                          <AvatarFallback>
                            {session.user?.name?.charAt(0)?.toUpperCase() ||
                              'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className='text-sm font-medium text-gray-900'>
                          {session.user?.name}
                        </span>
                      </div>
                      <Button variant='ghost' onClick={() => signOut()}>
                        Sign out
                      </Button>
                    </div>
                  ) : null}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
}
