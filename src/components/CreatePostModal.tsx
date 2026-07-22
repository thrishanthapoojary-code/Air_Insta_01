import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPost } from '../lib/posts';
import { createStory } from '../lib/stories';
import { uploadMedia } from '../lib/upload';
import { Loader2, ImagePlus, MapPin, Camera, Upload, Link2, X } from 'lucide-react';
import Modal from './Modal';
import { extractHashtags } from '../lib/utils';

const STOCK_PHOTOS = [
  'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/459225/pexels-photo-459225.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/349758/pexels-photo-349758.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/248797/pexels-photo-248797.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/1658967/pexels-photo-1658967.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/235554/pexels-photo-235554.jpeg?auto=compress&cs=tinysrgb&w=1080',
];

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  mode?: 'post' | 'story';
};

export default function CreatePostModal({ open, onClose, onCreated, mode = 'post' }: Props) {
  const { profile } = useAuth();
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setUrl('');
    setCaption('');
    setLocation('');
    setError(null);
    setProgress(0);
  };

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    if (!profile) return;
    setError(null);
    setBusy(true);
    setProgress(0);
    try {
      const result = await uploadMedia(file, mode, profile.id, setProgress);
      setUrl(result.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }, [profile, mode]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const submit = async () => {
    if (!profile || !url) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === 'story') {
        const tags = extractHashtags(caption);
        await createStory(profile, url, 'image', caption, tags);
      } else {
        await createPost({
          user_id: profile.id,
          caption,
          media_url: url,
          media_type: 'image',
          location: location || undefined,
        });
      }
      reset();
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create post');
    } finally {
      setBusy(false);
    }
  };

  const isStory = mode === 'story';

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="flex flex-col">
        <div className="border-b border-ig-border p-4 text-center">
          <h2 className="text-base font-semibold">
            {isStory ? 'New story' : 'Create new post'}
          </h2>
        </div>
        <div className="flex flex-col gap-4 p-4 sm:flex-row">
          <div className="sm:w-1/2">
            {url ? (
              <div className="relative">
                {busy && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-black/40 text-white">
                    <Loader2 size={28} className="animate-spin" />
                    <span className="text-sm">Uploading… {progress}%</span>
                  </div>
                )}
                <img src={url} alt="preview" className="aspect-square w-full rounded-lg object-cover" />
                {!busy && (
                  <button
                    onClick={() => setUrl('')}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex aspect-square w-full flex-col items-center justify-center rounded-lg border-2 border-dashed text-ig-muted transition ${
                  dragOver ? 'border-ig-accent bg-ig-accent/5' : 'border-ig-border'
                }`}
              >
                {busy ? (
                  <>
                    <Loader2 size={36} className="animate-spin" />
                    <p className="mt-3 text-sm">Uploading… {progress}%</p>
                  </>
                ) : (
                  <>
                    <ImagePlus size={40} />
                    <p className="mt-2 text-sm font-medium">Drag a photo here</p>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-lg bg-ig-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                      >
                        <Upload size={14} /> Gallery
                      </button>
                      <button
                        onClick={() => cameraRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-lg border border-ig-border px-3 py-1.5 text-xs font-semibold transition hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        <Camera size={14} /> Camera
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div className="relative mt-3">
              <Link2 size={16} className="absolute left-3 top-3 text-ig-muted" />
              <input
                className="input pl-9"
                placeholder="Or paste image URL"
                value={url.startsWith('https://images.pexels.com') ? '' : url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:w-1/2">
            {(isStory || !isStory) && (
              <textarea
                className="input min-h-[100px] resize-none"
                placeholder={isStory ? 'Add a caption… #tags welcome' : 'Write a caption… #hashtags welcome'}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            )}
            {!isStory && (
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3 text-ig-muted" />
                <input
                  className="input pl-9"
                  placeholder="Add location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {STOCK_PHOTOS.map((p) => (
                <button
                  key={p}
                  onClick={() => setUrl(p)}
                  className={`overflow-hidden rounded-md border-2 transition ${
                    url === p ? 'border-ig-accent' : 'border-transparent hover:opacity-80'
                  }`}
                >
                  <img src={p} alt="option" className="aspect-square w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <button onClick={submit} className="btn-primary mt-1" disabled={busy || !url}>
              {busy && <Loader2 size={16} className="animate-spin" />}
              {isStory ? 'Share story' : 'Share post'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
