import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Music, Disc3, LogOut, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/artist/dashboard' },
  { icon: Music, label: 'My Songs', path: '/artist/songs' },
  { icon: Disc3, label: 'My Albums', path: '/artist/albums' },
];

export default function ArtistLayout() {
  const { role, isLoading, logout, artist } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (role !== 'artist' || !artist) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-sidebar border-r border-sidebar-border fixed inset-y-0 left-0">
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/artist/dashboard" className="flex items-center gap-3">
            <img src={logo} alt="ytnAfrica" className="h-8" />
            <span className="font-bold">Artist</span>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive ? 'bg-sidebar-accent text-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border space-y-2">
          <Link
            to={`/artists/${artist.id}`}
            className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            View public profile
          </Link>
          <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent">
            <Home className="w-5 h-5" />
            <span>Back to Site</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {navItems.find((i) => i.path === location.pathname)?.label || 'Artist'}
          </h2>
          <div className="flex items-center gap-3">
            {artist.profileImagePath && (
              <img src={artist.profileImagePath} alt="" className="w-10 h-10 rounded-full object-cover" />
            )}
            <div className="text-right">
              <p className="font-medium flex items-center gap-1 justify-end">
                {artist.artistName}
                <VerifiedBadge verified={artist.verified} />
              </p>
              <p className="text-xs text-muted-foreground">{artist.email}</p>
            </div>
          </div>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
