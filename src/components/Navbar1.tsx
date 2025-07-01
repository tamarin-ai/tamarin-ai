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
  menu = [
    {
      title: 'Resources',
      url: '#',
      items: [
        {
          title: 'Help Center',
          description: 'Get all the answers you need right here',
          icon: <Zap className='size-5 shrink-0' />,
          url: '#',
        },
        {
          title: 'Contact Us',
          description: 'We are here to help you with any questions you have',
          icon: <Sunset className='size-5 shrink-0' />,
          url: '#',
        },
      ],
    },
    {
      title: 'Blog',
      url: '#',
    },
  ],
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
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map(item => renderMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
              {status === 'loading' ? (
                <div className='animate-pulse ml-4'>
                  <div className='h-9 w-20 bg-gray-200 rounded'></div>
                </div>
              ) : session ? (
                <div className='flex items-center gap-2 ml-4'>
                  <Button asChild variant='ghost' size='sm'>
                    <Link href='/dashboard'>Dashboard</Link>
                  </Button>
                  <Button variant='ghost' size='sm' onClick={() => signOut()}>
                    Sign out
                  </Button>
                </div>
              ) : (
                <Button
                  size='sm'
                  onClick={() => signIn('github')}
                  className='bg-black/90 hover:bg-black/90 rounded-full text-white ml-4'
                >
                  Sign in with GitHub
                </Button>
              )}
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
                  <Accordion
                    type='single'
                    collapsible
                    className='flex w-full flex-col gap-4'
                  >
                    {menu.map(item => renderMobileMenuItem(item))}
                  </Accordion>

                  <div className='flex flex-col gap-3'>
                    {status === 'loading' ? (
                      <div className='animate-pulse'>
                        <div className='h-10 w-full bg-gray-200 rounded'></div>
                      </div>
                    ) : session ? (
                      <>
                        <Button asChild variant='outline'>
                          <Link href='/dashboard'>Dashboard</Link>
                        </Button>
                        <Button variant='ghost' onClick={() => signOut()}>
                          Sign out
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => signIn('github')}
                        className='bg-black/90 hover:bg-black/90 text-white'
                      >
                        Sign in with GitHub
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
};

const renderMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent className='bg-popover text-popover-foreground'>
          {item.items.map(subItem => (
            <NavigationMenuLink asChild key={subItem.title} className='w-80'>
              <SubMenuLink item={subItem} />
            </NavigationMenuLink>
          ))}
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink
        href={item.url}
        className='group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-accent-foreground'
      >
        {item.title}
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className='border-b-0'>
        <AccordionTrigger className='text-md py-0 font-semibold hover:no-underline'>
          {item.title}
        </AccordionTrigger>
        <AccordionContent className='mt-2'>
          {item.items.map(subItem => (
            <SubMenuLink key={subItem.title} item={subItem} />
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <Link key={item.title} href={item.url} className='text-md font-semibold'>
      {item.title}
    </Link>
  );
};

const SubMenuLink = ({ item }: { item: MenuItem }) => {
  return (
    <Link
      className='flex flex-row gap-4 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-muted hover:text-accent-foreground'
      href={item.url}
    >
      <div className='text-foreground'>{item.icon}</div>
      <div>
        <div className='text-sm font-semibold'>{item.title}</div>
        {item.description && (
          <p className='text-sm leading-snug text-muted-foreground'>
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
};

export { Navbar1 };
