import { Github } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
  return (
    <section className='py-12'>
      <div className='container'>
        <footer>
          <div className='flex flex-col justify-between gap-4 border-t pt-8 text-sm font-medium  md:flex-row md:items-center'>
            <p>Made with ❤️</p>
            <div className='flex items-center gap-2'>
              <Link href='https://github.com/tamarin-ai'>
                <Github className='size-4' />
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
};

export { Footer };
