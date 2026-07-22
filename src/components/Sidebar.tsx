import { Home, Compass, Search, Bell, Send, Plus, Camera, Moon, Sun, LogOut, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from './Avatar';
import { cn } from '../lib/utils';

export type Route = 'home' | 'explore' | 'reels' | 'search' | 'notifications' | 'messages' | 'profile';

type Props = {
  route: Route;
  onRoute: (r: Route) => void;
  onOpenCreate: () => void;
  onOpenStoryCreate: () => void;
  unread: number;
};

const items: { id: Route; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'reels', label: 'Reels', icon: Film },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'messages', label: 'Messages', icon: Send },
];

export default function Sidebar({ route, onRoute, onOpenCreate, onOpenStoryCreate, unread }: Props) {
  const { profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-ig-border bg-ig-surface px-3 py-6 md:flex">
        <button onClick={() => onRoute('home')} className="mb-8 flex items-center gap-2 px-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 text-white">
            <Camera size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">Air Insta</span>
        </button>

        <nav className="flex flex-1 flex-col gap-1">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => onRoute(it.id)}
              className={cn(
                'flex items-center gap-4 rounded-lg px-3 py-3 text-sm font-semibold transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
                route === it.id && 'bg-black/[0.04] dark:bg-white/[0.06]',
              )}
            >
              <div className="relative">
                <it.icon size={22} />
                {it.id === 'notifications' && unread > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              {it.label}
            </button>
          ))}
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-4 rounded-lg px-3 py-3 text-sm font-semibold transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <Plus size={22} /> Create
          </button>
          <button
            onClick={onOpenStoryCreate}
            className="flex items-center gap-4 rounded-lg px-3 py-3 text-sm font-semibold transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <Camera size={22} /> Story
          </button>
        </nav>

        <div className="mt-auto space-y-1">
          <button
            onClick={toggle}
            className="flex w-full items-center gap-4 rounded-lg px-3 py-3 text-sm font-semibold transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          {profile && (
            <button
              onClick={() => onRoute('profile')}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            >
              <Avatar url={profile.avatar_url} name={profile.full_name ?? profile.username} username={profile.username} size={28} />
              <span className="truncate">Profile</span>
            </button>
          )}
          <button
            onClick={signOut}
            className="flex w-full items-center gap-4 rounded-lg px-3 py-3 text-sm font-semibold transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <LogOut size={22} /> Sign out
          </button>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-ig-border bg-ig-surface px-2 py-2 md:hidden">
        <button onClick={() => onRoute('home')} aria-label="Home"><Home size={24} className={route === 'home' ? 'text-ig-accent' : ''} /></button>
        <button onClick={() => onRoute('explore')} aria-label="Explore"><Compass size={24} className={route === 'explore' ? 'text-ig-accent' : ''} /></button>
        <button onClick={() => onRoute('reels')} aria-label="Reels"><Film size={24} className={route === 'reels' ? 'text-ig-accent' : ''} /></button>
        <button onClick={onOpenCreate} aria-label="Create" className="rounded-lg bg-ig-accent p-1.5 text-white"><Plus size={20} /></button>
        <button onClick={() => onRoute('notifications')} aria-label="Notifications" className="relative">
          <Bell size={24} className={route === 'notifications' ? 'text-ig-accent' : ''} />
          {unread > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500" />}
        </button>
        <button onClick={() => onRoute('messages')} aria-label="Messages"><Send size={24} className={route === 'messages' ? 'text-ig-accent' : ''} /></button>
        {profile && (
          <button onClick={() => onRoute('profile')} aria-label="Profile">
            <Avatar url={profile.avatar_url} name={profile.username} username={profile.username} size={24} />
          </button>
        )}
      </nav>
    </>
  );
}
