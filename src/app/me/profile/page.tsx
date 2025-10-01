"use client";

import { useEffect, useRef, useState } from 'react';
import ResponsiveImg from '@/components/ResponsiveImg';

type Profile = {
  id: string;
  name: string | null;
  image: string | null;
  companyName: string | null;
  licenseNumber: string | null;
  registrationNumber: string | null;
};

export default function MyProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/me/profile', { cache: 'no-store' })
      .then(async (r) => { if (!r.ok) throw new Error('Failed to load'); return r.json(); })
      .then((json) => { if (mounted) setProfile(json); })
      .catch((e) => setError(e?.message || 'Error'))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  // Capture previous in-app path for redirect after save
  useEffect(() => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const ref = document.referrer || '';
      const sameOrigin = origin && ref.startsWith(origin);
      const prevPath = sameOrigin ? new URL(ref).pathname : '/me/listings';
      sessionStorage.setItem('prev_path', prevPath);
    } catch {}
  }, []);

  async function uploadAvatar(file: File) {
    // Expect avif; accept jpeg/png/webp and rely on server, or client compression not required here
    const form = new FormData();
    form.append('file', file);
    form.append('filename', file.name || 'avatar.avif');
    // If file name includes -w{width}.avif, we preserve srcset via ResponsiveImg
    const widthMatch = (file.name || '').match(/-w(\d+)\.avif$/);
    if (widthMatch) form.append('width', widthMatch[1]);
    const res = await fetch('/api/uploads/profile-images', { method: 'POST', body: form });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return String(data.url);
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await uploadAvatar(f);
      await onSave({ image: url });
      if (fileRef.current) fileRef.current.value = '';
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
    }
  }

  async function onSave(partial: Partial<Profile>) {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/me/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(partial) });
      if (!res.ok) throw new Error('Save failed');
      const next = await res.json();
      setProfile(next);
      // Redirect back to previous page or My Listings
      const prev = sessionStorage.getItem('prev_path');
      const target = prev && prev !== '/me/profile' ? prev : '/me/listings';
      window.location.assign(target);
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="min-h-screen bg-white overflow-x-hidden"><div className="min-h-screen bg-white max-w-3xl mx-auto p-6">Loading…</div></div>;
  if (!profile) return <div className="min-h-screen bg-white overflow-x-hidden"><div className="min-h-screen bg-white max-w-3xl mx-auto p-6">Not available</div></div>;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
    <div className="min-h-screen bg-white max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      {error ? <div className="mb-4 text-sm text-red-600">{error}</div> : null}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="flex gap-4 items-center">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border">
            {profile.image ? (
              <ResponsiveImg src={profile.image} alt={profile.name || 'Me'} className="w-full h-full object-cover" sizesAttr="80px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">👤</div>
            )}
          </div>
          <div>
            <label className="inline-flex items-center px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50 cursor-pointer">
              <input ref={fileRef} type="file" accept="image/avif,image/webp,image/jpeg,image/png" className="hidden" onChange={onFileChange} />
              Upload avatar
            </label>
            <div className="text-xs text-gray-500 mt-1">Tip: AVIF like avatar-w400.avif enables responsive variants.</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input className="mt-1 w-full border rounded-md px-3 py-2" value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Company name</label>
            <input className="mt-1 w-full border rounded-md px-3 py-2" value={profile.companyName || ''} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">License number</label>
            <input className="mt-1 w-full border rounded-md px-3 py-2" value={profile.licenseNumber || ''} onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Registration number</label>
            <input className="mt-1 w-full border rounded-md px-3 py-2" value={profile.registrationNumber || ''} onChange={(e) => setProfile({ ...profile, registrationNumber: e.target.value })} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => { const prev = sessionStorage.getItem('prev_path'); const target = prev && prev !== '/me/profile' ? prev : '/me/listings'; window.location.assign(target); }} className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700">
            Cancel
          </button>
          <button disabled={saving} onClick={() => onSave({ name: profile.name, companyName: profile.companyName, licenseNumber: profile.licenseNumber, registrationNumber: profile.registrationNumber })} className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}


