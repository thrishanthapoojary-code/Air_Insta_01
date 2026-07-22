export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  location: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_private: boolean;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  caption: string | null;
  media_url: string | null;
  media_type: string;
  location: string | null;
  hashtags: string[] | null;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
};

export type PostWithAuthor = Post & {
  profiles: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name'>;
  liked_by_me?: boolean;
  saved_by_me?: boolean;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  profiles: Pick<Profile, 'id' | 'username' | 'avatar_url'>;
};

export type Story = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  hashtags: string[] | null;
  created_at: string;
  viewed_by_me?: boolean;
};

export type StoryWithUser = Story & {
  profiles: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name'>;
};

export type Notification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  entity_id: string | null;
  body: string | null;
  read: boolean;
  created_at: string;
  actor?: Pick<Profile, 'id' | 'username' | 'avatar_url'> | null;
};

export type Conversation = {
  id: string;
  title: string | null;
  is_group: boolean;
  created_at: string;
  last_message?: string;
  last_at?: string;
  members?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name'>[];
};

export type Message = {
  id: string;
  conversation_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles: Pick<Profile, 'id' | 'username' | 'avatar_url'>;
};

export type Follow = {
  follower_id: string;
  followee_id: string;
  created_at: string;
};

export type Reel = {
  id: string;
  user_id: string;
  video_url: string;
  poster_url: string | null;
  caption: string | null;
  hashtags: string[] | null;
  audio_title: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
};

export type ReelWithAuthor = Reel & {
  profiles: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name'>;
  liked_by_me?: boolean;
};
