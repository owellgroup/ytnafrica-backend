import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MusicPlayer } from './MusicPlayer';
import { MobileNav } from './MobileNav';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <Sidebar />
      <main className="ml-0 md:ml-64 pb-32 md:pb-[100px] min-h-screen pt-14 md:pt-0">
        <Outlet />
      </main>
      <MusicPlayer />
    </div>
  );
}
