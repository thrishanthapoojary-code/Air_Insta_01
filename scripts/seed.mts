/*
  Air Insta — comprehensive seed script.
  Creates 20 users, 100 posts, 10 stories, randomized likes/follows/comments.
  Idempotent: re-running cleans up old seed data first.
  Run with: npx tsx scripts/seed.mts
*/
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const PASSWORD = 'AirInsta2024!Secure';

const USERS = [
  { email: 'maya@airinsta.dev', username: 'maya', full_name: 'Maya Chen', bio: 'Photographer · coffee · travel ✈️', location: 'Lisbon' },
  { email: 'leo@airinsta.dev', username: 'leo', full_name: 'Leo Park', bio: 'Street style and sneakers 👟', location: 'Seoul' },
  { email: 'aria@airinsta.dev', username: 'aria', full_name: 'Aria Singh', bio: 'Foodie · plant mom 🌿', location: 'Berlin' },
  { email: 'kai@airinsta.dev', username: 'kai', full_name: 'Kai Mori', bio: 'Surf · sun · salt 🌊', location: 'Sydney' },
  { email: 'nova@airinsta.dev', username: 'nova', full_name: 'Nova Reyes', bio: 'Designer. Minimalist. ◇', location: 'Mexico City' },
  { email: 'zara@airinsta.dev', username: 'zara', full_name: 'Zara Okafor', bio: 'Music is my therapy 🎧', location: 'Lagos' },
  { email: 'finn@airinsta.dev', username: 'finn', full_name: 'Finn Larsen', bio: 'Mountains > everything 🏔️', location: 'Oslo' },
  { email: 'luna@airinsta.dev', username: 'luna', full_name: 'Luna Costa', bio: 'Yoga teacher & dog mom 🐕', location: 'São Paulo' },
  { email: 'ezra@airinsta.dev', username: 'ezra', full_name: 'Ezra Kim', bio: 'Coding by day, gaming by night 🎮', location: 'Tokyo' },
  { email: 'isla@airinsta.dev', username: 'isla', full_name: 'Isla Walsh', bio: 'Bookshop wanderer 📚', location: 'Dublin' },
  { email: 'rex@airinsta.dev', username: 'rex', full_name: 'Rex Tanaka', bio: 'Skater. Pizza expert. 🍕', location: 'Osaka' },
  { email: 'nina@airinsta.dev', username: 'nina', full_name: 'Nina Volkov', bio: 'Ballet dancer 💃 Moscow→NYC', location: 'New York' },
  { email: 'omar@airinsta.dev', username: 'omar', full_name: 'Omar Haddad', bio: 'Architect & coffee snob ☕', location: 'Cairo' },
  { email: 'sage@airinsta.dev', username: 'sage', full_name: 'Sage Miller', bio: 'Organic farmer 🌱 slow living', location: 'Portland' },
  { email: 'yuki@airinsta.dev', username: 'yuki', full_name: 'Yuki Sato', bio: 'Ramen hunter 🍜 Tokyo', location: 'Tokyo' },
  { email: 'clio@airinsta.dev', username: 'clio', full_name: 'Clio Moreau', bio: 'Vintage camera collector 📷', location: 'Paris' },
  { email: 'diego@airinsta.dev', username: 'diego', full_name: 'Diego Ruiz', bio: 'Football is life ⚽', location: 'Madrid' },
  { email: 'tara@airinsta.dev', username: 'tara', full_name: 'Tara Mehta', bio: 'Painter & gallery hopper 🎨', location: 'Mumbai' },
  { email: 'bruno@airinsta.dev', username: 'bruno', full_name: 'Bruno Silva', bio: 'DJ & vinyl collector 💿', location: 'São Paulo' },
  { email: 'ivy@airinsta.dev', username: 'ivy', full_name: 'Ivy Thompson', bio: 'Botanist 🌿 plant scientist', location: 'Vancouver' },
];

const AVATARS = [
  'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/1462630/pexels-photo-1462630.jpeg?auto=compress&cs=tinysrgb&w=200',
];

const PHOTOS = [
  'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/459225/pexels-photo-459225.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/349758/pexels-photo-349758.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/248797/pexels-photo-248797.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/1658967/pexels-photo-1658967.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/235554/pexels-photo-235554.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/1287142/pexels-photo-1287142.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/1287148/pexels-photo-1287148.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/3617500/pexels-photo-3617500.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/3617457/pexels-photo-3617457.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/268533/pexels-photo-268533.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/355465/pexels-photo-355465.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/56866/pexels-photo-56866.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/210186/pexels-photo-210186.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/206359/pexels-photo-206359.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/2422259/pexels-photo-2422259.jpeg?auto=compress&cs=tinysrgb&w=1080',
];

const CAPTIONS = [
  'Golden hour never misses. #sunset #goldenhour #nature',
  'New kicks, who dis? #sneakerhead #streetstyle #fashion',
  'Brunch done right 🥑 #foodie #brunch #avocado',
  'Salt in my hair, peace in my soul. #surf #beach #ocean',
  'Less, but better. #design #minimal #aesthetic',
  'City lights hit different. #cityscape #night #urban',
  'Coffee + a good book. #morningvibes #coffee #cozy',
  'Wandering the old town. #travel #wanderlust #explore',
  'Plants are the only drama I need. #plantparent #greenery',
  'Studio days. #designer #work #creative',
  'Mountain air, clear mind. #hiking #mountains #adventure',
  'Found the best ramen spot. #ramen #foodie #japanesefood',
  'Vintage lens, new perspective. #photography #vintage #film',
  'Match point. #tennis #sport #sunday',
  'Gallery night. #art #gallery #exhibition',
  'Sunrise run 🏃 #running #fitness #sunrise',
  'Record collection growing. #vinyl #music #collector',
  'Tending the garden. #organic #farming #slowliving',
  'Rooftop views. #rooftop #citylife #sunset',
  'Puppy cuddles fix everything. #dogsofinsta #puppy #doglover',
];

const COMMENT_TEXTS = [
  'Love this! 😍',
  'So good 🔥',
  'Where is this?',
  'Goals!',
  'Amazing shot 👏',
  'Need this in my life',
  'Too cool',
  'Beautiful 🌅',
  'Yum! Recipe?',
  'This is art',
  'Stop it, this is incredible',
  'Take me there ✈️',
  'Obsessed 😍',
  'Yes! So much yes.',
  'How do you do it?',
  'Teach me your ways 🙏',
  'Pure magic ✨',
  'This made my day',
  'Bookmarked!',
  'No way, this is unreal',
];

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

async function main() {
  console.log('Creating 20 auth users + profiles...');

  // Step 1: Create or sign in users, collect their UUIDs
  const userIds: string[] = [];
  for (let i = 0; i < USERS.length; i++) {
    const u = USERS[i];
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
    });
    let uid: string;
    if (error) {
      // user exists — fetch via list
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list.users.find((x) => x.email === u.email);
      if (!existing) { console.warn('skip', u.username, error.message); continue; }
      uid = existing.id;
      console.log('exists', u.username, uid);
    } else {
      uid = data.user.id;
      console.log('created', u.username, uid);
    }
    userIds.push(uid);

    // Upsert profile (service role bypasses RLS)
    const { error: pe } = await admin.from('profiles').upsert({
      id: uid,
      username: u.username,
      full_name: u.full_name,
      bio: u.bio,
      location: u.location,
      avatar_url: AVATARS[i % AVATARS.length],
    }, { onConflict: 'id' });
    if (pe) console.warn('profile', u.username, pe.message);
  }

  if (userIds.length < 2) { console.error('Need at least 2 users'); process.exit(1); }
  console.log(`Ready: ${userIds.length} users`);

  // Step 2: Clean up old seed posts/stories/likes/comments/follows
  console.log('Cleaning old seed data...');
  await admin.from('story_views').delete().neq('story_id', '00000000-0000-0000-0000-000000000000');
  await admin.from('post_likes').delete().neq('post_id', '00000000-0000-0000-0000-000000000000');
  await admin.from('comments').delete().neq('post_id', '00000000-0000-0000-0000-000000000000');
  await admin.from('stories').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
  await admin.from('posts').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
  await admin.from('follows').delete().neq('follower_id', '00000000-0000-0000-0000-000000000000');

  // Step 3: Create 100 posts distributed across users
  console.log('Creating 100 posts...');
  const postRows: { id: string; user_id: string }[] = [];
  for (let i = 0; i < 100; i++) {
    const authorIdx = i % userIds.length;
    const uid = userIds[authorIdx];
    const caption = CAPTIONS[i % CAPTIONS.length];
    const hashtags = caption.match(/#(\w+)/g)?.map((m) => m.slice(1).toLowerCase()) ?? [];
    const { data, error } = await admin.from('posts').insert({
      user_id: uid,
      caption,
      media_url: PHOTOS[i % PHOTOS.length],
      media_type: 'image',
      location: USERS[authorIdx].location,
      hashtags,
      created_at: new Date(Date.now() - rand(60, 60000 * 24 * 14)).toISOString(),
    }).select('id, user_id').single();
    if (error) { console.warn('post', i, error.message); continue; }
    postRows.push(data);
  }
  console.log(`Created ${postRows.length} posts`);

  // Step 4: Randomized likes (each post gets 0-15 likes from random users)
  console.log('Adding randomized likes...');
  let likeCount = 0;
  for (const post of postRows) {
    const numLikes = rand(0, 15);
    const likers = shuffle(userIds).slice(0, numLikes);
    if (likers.length === 0) continue;
    const { error } = await admin.from('post_likes').insert(
      likers.map((uid) => ({ post_id: post.id, user_id: uid })),
    );
    if (error && !error.message.includes('duplicate')) console.warn('like', error.message);
    else likeCount += likers.length;
  }
  console.log(`Added ~${likeCount} likes`);

  // Step 5: Randomized comments (each post gets 0-5 comments)
  console.log('Adding randomized comments...');
  let commentCount = 0;
  for (const post of postRows) {
    const numComments = rand(0, 5);
    const commenters = shuffle(userIds).slice(0, numComments);
    for (const uid of commenters) {
      const { error } = await admin.from('comments').insert({
        post_id: post.id,
        user_id: uid,
        body: pick(COMMENT_TEXTS),
      });
      if (error) console.warn('comment', error.message);
      else commentCount++;
    }
  }
  console.log(`Added ~${commentCount} comments`);

  // Step 6: Randomized follows (each user follows 5-15 others)
  console.log('Adding randomized follows...');
  let followCount = 0;
  for (const follower of userIds) {
    const others = userIds.filter((u) => u !== follower);
    const numFollows = rand(5, Math.min(15, others.length));
    const followees = shuffle(others).slice(0, numFollows);
    const { error } = await admin.from('follows').insert(
      followees.map((followee) => ({ follower_id: follower, followee_id: followee })),
    );
    if (error && !error.message.includes('duplicate')) console.warn('follow', error.message);
    else followCount += followees.length;
  }
  console.log(`Added ~${followCount} follows`);

  // Step 7: 10 stories (expire in 24h — created_at within last 20h)
  console.log('Creating 10 stories...');
  let storyCount = 0;
  for (let i = 0; i < 10; i++) {
    const uid = userIds[i % userIds.length];
    const caption = pick(CAPTIONS);
    const hashtags = caption.match(/#(\w+)/g)?.map((m) => m.slice(1).toLowerCase()) ?? [];
    const { error } = await admin.from('stories').insert({
      user_id: uid,
      media_url: PHOTOS[rand(0, PHOTOS.length - 1)],
      media_type: 'image',
      caption,
      hashtags,
      created_at: new Date(Date.now() - rand(0, 20 * 3600 * 1000)).toISOString(),
    });
    if (error) console.warn('story', i, error.message);
    else storyCount++;
  }
  console.log(`Created ${storyCount} stories`);

  console.log('\n=== Seed complete ===');
  console.log(`Users: ${userIds.length}`);
  console.log(`Posts: ${postRows.length}`);
  console.log(`Stories: ${storyCount}`);
  console.log(`Likes: ~${likeCount}`);
  console.log(`Comments: ~${commentCount}`);
  console.log(`Follows: ~${followCount}`);
  console.log(`\nLogin with any user: e.g. maya@airinsta.dev / ${PASSWORD}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
