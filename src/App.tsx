import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthScreen from './screens/AuthScreen';
import Feed from './screens/Feed';
import Explore from './screens/Explore';
import Reels from './screens/Reels';
import Notifications from './screens/Notifications';
import Messages from './screens/Messages';
import Profile from './screens/Profile';
import SearchScreen from './screens/SearchScreen';
import Sidebar, { type Route } from './components/Sidebar';
import CreatePostModal from './components/CreatePostModal';
import PostDetailModal from './components/PostDetailModal';
import { supabase } from './lib/supabase';
import { unreadCount } from './lib/notifications';
import { Loader2, Camera } from 'lucide-react';

function Shell() {
  const { profile, loading } = useAuth();
  const [route, setRoute] = useState<Route>('home');
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [messageTarget, setMessageTarget] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [storyCreateOpen, setStoryCreateOpen] = useState(false);
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!profile) return;
    unreadCount(profile.id).then(setUnread).catch(() => {});
    const sub = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, () => {
        unreadCount(profile.id).then(setUnread).catch(() => {});
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [profile]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ig-bg">
        <div className="flex flex-col items-center gap-3 text-ig-muted">
          <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 text-white">
            <Camera size={24} />
          </div>
          <Loader2 className="animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) return <AuthScreen />;

  const openProfile = (username: string) => {
    setProfileUsername(username);
    setRoute('profile');
  };

  const openPost = (id: string) => setOpenPostId(id);

  const openMessage = (userId: string) => {
    setMessageTarget(userId);
    setRoute('messages');
  };

  const onCreated = () => setRefreshKey((k) => k + 1);

  return (
    <div className="min-h-screen bg-ig-bg pb-16 md:pb-0 md:pl-64">
      <Sidebar
        route={route}
        onRoute={(r) => {
          if (r === 'profile') setProfileUsername(profile.username);
          setRoute(r);
        }}
        onOpenCreate={() => setCreateOpen(true)}
        onOpenStoryCreate={() => setStoryCreateOpen(true)}
        unread={unread}
      />

      <main className="min-h-screen pt-4">
        {route === 'home' && (
          <Feed
            onOpenProfile={openProfile}
            onOpenPost={openPost}
            onOpenCreate={() => setCreateOpen(true)}
            onOpenStoryCreate={() => setStoryCreateOpen(true)}
            refreshKey={refreshKey}
          />
        )}
        {route === 'explore' && <Explore onOpenProfile={openProfile} onOpenPost={openPost} />}
        {route === 'reels' && <Reels onOpenProfile={openProfile} />}
        {route === 'search' && (
          <SearchScreen
            onOpenProfile={openProfile}
            onOpenHashtag={(tag) => {
              setProfileUsername(`#${tag}`);
              setRoute('profile');
            }}
          />
        )}
        {route === 'notifications' && <Notifications onOpenProfile={openProfile} onOpenPost={openPost} />}
        {route === 'messages' && <Messages startUserId={messageTarget} onOpenProfile={openProfile} />}
        {route === 'profile' && profileUsername && (
          <Profile
            username={profileUsername.startsWith('#') ? profile.username : profileUsername}
            onBack={() => setRoute('home')}
            onOpenProfile={openProfile}
            onOpenPost={openPost}
            onMessage={openMessage}
          />
        )}
      </main>

      <CreatePostModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={onCreated} mode="post" />
      <CreatePostModal open={storyCreateOpen} onClose={() => setStoryCreateOpen(false)} onCreated={onCreated} mode="story" />
      <PostDetailModal postId={openPostId} onClose={() => setOpenPostId(null)} onOpenProfile={openProfile} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </ThemeProvider>
  );
}
