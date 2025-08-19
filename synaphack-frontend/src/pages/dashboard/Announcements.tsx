import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { Megaphone } from 'lucide-react';
import { api, hasApiBaseUrl } from '../../lib/api';

type Ann = { id: string; title: string; content: string; createdAt: string; eventId?: string; author: string };

export const Announcements: React.FC = () => {
  const { user } = useAuth();
  const roleColor = useMemo(() => (user?.role === 'judge' ? 'orange' : user?.role === 'organizer' ? 'blue' : 'green') as const, [user?.role]);
  const [eventId, setEventId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [items, setItems] = useState<Ann[]>([]);

  const load = async () => {
    if (hasApiBaseUrl()) {
      try {
        const list = await api.get(`/api/announcements${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''}`);
        setItems((list || []).map((a: any) => ({ id: a.id, title: a.title, content: a.message || a.content, createdAt: a.createdAt, eventId: a.eventId, author: a.createdBy || a.author || 'Organizer' })));
        return;
      } catch {}
    }
    const all: Ann[] = JSON.parse(localStorage.getItem('hv_announcements') || '[]');
    setItems(all.filter(a => !eventId || a.eventId === eventId));
  };

  useEffect(() => { load(); }, [eventId]);

  const post = async () => {
    if (!title.trim() || !content.trim()) return;
    if (hasApiBaseUrl()) {
      try {
        await api.post('/api/announcements', { eventId: eventId || undefined, title: title.trim(), message: content.trim() });
        setTitle(''); setContent('');
        await load();
        return;
      } catch {}
    }
    const newItem: Ann = { id: `${Date.now()}`, title: title.trim(), content: content.trim(), createdAt: new Date().toISOString(), eventId: eventId || undefined, author: user?.name || 'User' };
    const all: Ann[] = JSON.parse(localStorage.getItem('hv_announcements') || '[]');
    localStorage.setItem('hv_announcements', JSON.stringify([newItem, ...all]));
    setTitle('');
    setContent('');
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Announcements & Q&A</h1>

      <Card roleColor={roleColor}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Filter by Event ID (optional)" value={eventId} onChange={(e) => setEventId(e.target.value)} placeholder="Event ID" roleColor={roleColor} />
        </div>
      </Card>

      {user?.role === 'organizer' && (
        <Card roleColor={roleColor}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" roleColor={roleColor} />
            <Input label="Event ID (optional)" value={eventId} onChange={(e) => setEventId(e.target.value)} placeholder="Event ID" roleColor={roleColor} />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
              <textarea className="neon-input w-full px-4 py-2.5 text-white rounded-lg h-28" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your update..." />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button onClick={post} roleColor={roleColor}><Megaphone className="w-4 h-4" /> Post</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {items.map((a) => (
          <Card key={a.id} roleColor={roleColor}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-white font-semibold">{a.title}</div>
              <div className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleString()}</div>
            </div>
            {a.eventId && <div className="text-xs text-neon-blue mb-2">Event: {a.eventId}</div>}
            <div className="text-gray-300 whitespace-pre-wrap">{a.content}</div>
            <div className="text-xs text-gray-500 mt-2">By {a.author}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Announcements;


