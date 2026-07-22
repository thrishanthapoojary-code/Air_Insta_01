import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { createReel } from '../lib/reels';
import { uploadMedia } from '../lib/upload';
import { Loader2, Film, Upload, Link2, X, Music2 } from 'lucide-react';
import Modal from './Modal';
import { extractHashtags } from '../lib/utils';

const STOCK_VIDEOS = [
  'https://cdn.pixabay.com/video/2023/10/05/183231-872921378_large.mp4',
  'https://cdn.pixabay.com/video/2022/12/15/141178-777854845_large.mp4',
  'https://cdn.pixabay.com/video/2023/06/30/73425-854025987_large.mp4',
  'https://cdn.pixabay.com/video/2023/04/05/156474-815625935_large.mp4',
  'https://cdn.pixabay.com/video/2022/09/09/127433-746284905_large.mp4',
  'https://cdn.pixabay.com/video/2023/02/27/152938-803254987_large.mp4',
];

const STOCK_POSTERS = [
  'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/459225/pexels-photo-459225.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/349758/pexels-photo-349758.jpeg?auto=compress&cs=tinysrgb&w=1080',
  'https://images.pexels.com/photos/1287142/pexels-photo-1287142.jpeg?auto=compress&cs=tinysrgb&w=1080',
];

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateReelModal({ open, onClose, onCreated }: Props) {
  const { profile } = useAuth();
  const [videoUrl, setVideoUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [audioTitle, setAudioTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setVideoUrl('');
    setPosterUrl('');
    setCaption('');
    setAudioTitle('');
    setError(null);
    setProgress(0);
  };

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file || !profile) return;
    setError(null);
    setBusy(true);
    setProgress(0);
    try {
      const result = await uploadMedia(file, 'reels', profile.id, setProgress);
      setVideoUrl(result.url);
      if (result.mediaType === 'video') {
        const cap = document.createElement('video');
        cap.src = result.url;
        cap.currentTime = 0.5;
        cap.onloadeddata = () => {
          try {
            const c = document.createElement('canvas');
            c.width = cap.videoWidth;
            c.height = cap.videoHeight;
            c.getContext('2d')?.drawImage(cap, 0, 0);
            setPosterUrl(c.toDataURL('image/jpeg', 0.7));
          } catch {
            setPosterUrl(STOCK_POSTERS[Math.floor(Math.random() * STOCK_POSTERS.length)]);
          }
        };
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }, [profile]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const submit = async () => {
    if (!profile || !videoUrl) return;
    setBusy(true);
    setError(null);
    try {
      const tags = extractHashtags(caption);
      await createReel(profile, videoUrl, posterUrl || null, caption, tags, audioTitle || null);
      reset();
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create reel');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="flex flex-col">
        <div className="border-b border-ig-border p-4 text-center">
          <h2 className="flex items-center justify-center gap-2 text-base font-semibold">
            <Film size={18} /> Create new reel
          </h2>
        </div>
        <div className="flex flex-col gap-4 p-4 sm:flex-row">
          <div className="sm:w-1/2">
            {videoUrl ? (
              <div className="relative">
                {busy && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-black/40 text-white">
                    <Loader2 size={28} className="animate-spin" />
                    <span className="text-sm">Uploading… {progress}%</span>
                  </div>
                )}
                <video src={videoUrl} poster={posterUrl || undefined} loop muted autoPlay playsInline className="aspect-[9/16] w-full rounded-lg object-cover" />
                {!busy && (
                  <button
                    onClick={() => { setVideoUrl(''); setPosterUrl(''); }}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
                    aria-label="Remove video"
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
                className={`flex aspect-[9/16] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed text-ig-muted transition ${
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
                    <Film size={40} />
                    <p className="mt-2 text-sm font-medium">Drag a video here</p>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="mt-4 flex items-center gap-1.5 rounded-lg bg-ig-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                    >
                      <Upload size={14} /> Choose video
                    </button>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div className="relative mt-3">
              <Link2 size={16} className="absolute left-3 top-3 text-ig-muted" />
              <input
                className="input pl-9"
                placeholder="Or paste video URL"
                value={videoUrl.startsWith('https://cdn.pixabay.com') ? '' : videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:w-1/2">
            <textarea
              className="input min-h-[80px] resize-none"
              placeholder="Write a caption… #hashtags welcome"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <div className="relative">
              <Music2 size={16} className="absolute left-3 top-3 text-ig-muted" />
              <input
                className="input pl-9"
                placeholder="Audio title (optional)"
                value={audioTitle}
                onChange={(e) => setAudioTitle(e.target.value)}
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-ig-muted">Or pick a stock video</p>
              <div className="grid grid-cols-3 gap-2">
                {STOCK_VIDEOS.map((v, i) => (
                  <button
                    key={v}
                    onClick={() => { setVideoUrl(v); setPosterUrl(STOCK_POSTERS[i % STOCK_POSTERS.length]); }}
                    className={`relative overflow-hidden rounded-md border-2 transition ${
                      videoUrl === v ? 'border-ig-accent' : 'border-transparent hover:opacity-80'
                    }`}
                  >
                    <img src={STOCK_POSTERS[i % STOCK_POSTERS.length]} alt="option" className="aspect-[9/16] w-full object-cover" loading="lazy" />
                    <Film size={14} className="absolute bottom-1 right-1 text-white drop-shadow" />
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <button onClick={submit} className="btn-primary mt-1" disabled={busy || !videoUrl}>
              {busy && <Loader2 size={16} className="animate-spin" />}
              Share reel
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
