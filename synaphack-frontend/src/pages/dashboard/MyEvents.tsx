import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Calendar, Users, Megaphone, UserCheck, BarChart3, Trash2, Edit3, Eye, UploadCloud, DownloadCloud } from 'lucide-react';
import { api, hasApiBaseUrl } from '../../lib/api';

type LiteEvent = {
  id: string;
  title: string;
  theme: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  mode: 'online' | 'offline' | 'hybrid';
  location: string;
  maxTeamSize: number;
  organizerId: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed';
  registrations: number;
  maxParticipants: number;
  bannerUrl?: string;
};

export const MyEvents: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<LiteEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<LiteEvent | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<LiteEvent>>({});

  const roleColor = useMemo(() => 'blue' as const, []);
  const storageKey = useMemo(() => `hv_events_${user?.id || 'anon'}`,[user?.id]);

  const load = async () => {
    setIsLoading(true);
    try {
      if (hasApiBaseUrl()) {
        if (user?.role === 'organizer') {
          try {
            const list = await api.get('/api/events?mine=true');
            if (Array.isArray(list)) {
              const mapped: LiteEvent[] = list.map((e: any) => ({
                id: String(e.id),
                title: e.name,
                theme: e.theme || 'General',
                startDate: e.startAt,
                endDate: e.endAt,
                registrationDeadline: e.registrationCloseAt || e.startAt,
                mode: e.online === false ? 'offline' : 'online',
                location: e.location || '',
                maxTeamSize: 4,
                maxParticipants: 100,
                description: e.description || '',
                organizerId: String(e.organizerId),
                registrations: (e._count && e._count.registrations) ? e._count.registrations : 0,
                bannerUrl: e.bannerUrl,
                status: 'published',
              }));
              setEvents(mapped);
              return;
            }
          } catch {}
        } else {
          try {
            const regs = await api.get('/api/registrations');
            if (Array.isArray(regs)) {
              const mapped: LiteEvent[] = regs.map((r: any) => ({
                id: String(r.event?.id || r.eventId),
                title: r.event?.name || 'Event',
                theme: r.event?.theme || 'General',
                startDate: r.event?.startAt,
                endDate: r.event?.endAt,
                registrationDeadline: r.event?.registrationCloseAt || r.event?.startAt,
                mode: r.event?.online === false ? 'offline' : 'online',
                location: r.event?.location || '',
                maxTeamSize: 4,
                maxParticipants: 100,
                description: r.event?.description || '',
                organizerId: String(r.event?.organizerId || ''),
                registrations: (r.event?._count && r.event?._count.registrations) ? r.event._count.registrations : 0,
                bannerUrl: r.event?.bannerUrl,
                status: 'published',
              }));
              setEvents(mapped);
              return;
            }
          } catch {}
        }
      }
      const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setEvents(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      setTimeout(() => {
        const el = document.getElementById(`event-${highlightId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  }, [storageKey]);

  const save = (updated: LiteEvent[]) => {
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setEvents(updated);
  };

  const togglePublish = (id: string) => {
    const updated = events.map(e => e.id === id ? { ...e, status: e.status === 'published' ? 'draft' : 'published' } : e);
    save(updated);
    toast.success('Status updated');
    // Seed demo submissions when publishing first time
    const target = updated.find(e => e.id === id);
    if (target && target.status === 'published') {
      seedDemoSubmissions(target.id, target.maxParticipants);
    }
  };

  const remove = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    save(updated);
    toast.info('Event deleted');
    // cleanup related
    localStorage.removeItem(`hv_participants_${id}`);
    localStorage.removeItem(`hv_submissions_${id}`);
    const assignments = JSON.parse(localStorage.getItem('hv_assignments') || '[]').filter((a: any) => a.eventId !== id);
    localStorage.setItem('hv_assignments', JSON.stringify(assignments));
  };

  const openEdit = (ev: LiteEvent) => {
    setEditing(ev);
    setEditDraft({ title: ev.title, theme: ev.theme, mode: ev.mode, location: ev.location, startDate: ev.startDate, endDate: ev.endDate, registrationDeadline: ev.registrationDeadline, maxTeamSize: ev.maxTeamSize, maxParticipants: ev.maxParticipants });
  };

  const saveEdit = () => {
    if (!editing) return;
    const updated = events.map(e => e.id === editing.id ? { ...e, ...editDraft } as LiteEvent : e);
    save(updated);
    toast.success('Event updated');
    setEditing(null);
  };

  // removed seedDemoParticipants per request

  const seedDemoSubmissions = (eventId: string, maxParticipants: number) => {
    const num = Math.max(5, Math.floor((maxParticipants || 100) * 0.2));
    const subs = Array.from({ length: num }).map((_, i) => ({
      id: `${eventId}_s_${i+1}`,
      teamId: `${eventId}_team_${i+1}`,
      eventId,
      roundId: 'round-1',
      title: `Project ${i+1}`,
      description: 'Demo submission for review',
      githubUrl: '',
      demoUrl: '',
      videoUrl: '',
      documents: [],
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      scores: [],
      feedback: []
    }));
    localStorage.setItem(`hv_submissions_${eventId}`, JSON.stringify(subs));
  };

  if (isLoading) {
    return (
      <div className="p-6"><div className="w-16 h-16 border-4 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mx-auto" /></div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-orbitron font-bold">My Events</h1>
        {user?.role === 'organizer' && (
          <Link to="/dashboard/create-event"><Button roleColor={roleColor}>Create Event</Button></Link>
        )}
      </div>

      {events.length === 0 ? (
        <Card roleColor={roleColor}>
          <p className="text-gray-400">No events yet. Create your first event.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((ev) => (
            <Card key={ev.id} roleColor={roleColor} className="space-y-4" hover>
              <div id={`event-${ev.id}`} className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">{ev.title}</h3>
                  <p className="text-neon-blue text-sm">{ev.theme}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${ev.status === 'published' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>{ev.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-gray-400">
                <div className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-neon-blue" /> {new Date(ev.startDate).toLocaleDateString()}</div>
                <div className="flex items-center"><Users className="w-4 h-4 mr-2 text-neon-green" /> {ev.registrations}/{ev.maxParticipants}</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link to={`/events/${ev.id}`}>
                  <Button variant="outline" size="sm" roleColor={roleColor}><Eye className="w-4 h-4" /> Preview</Button>
                </Link>
                <Button variant="outline" size="sm" roleColor={roleColor} onClick={() => openEdit(ev)}><Edit3 className="w-4 h-4" /> Edit</Button>
                <Button variant="outline" size="sm" roleColor={roleColor} onClick={() => togglePublish(ev.id)}>
                  {ev.status === 'published' ? (<><DownloadCloud className="w-4 h-4" /> Unpublish</>) : (<><UploadCloud className="w-4 h-4" /> Publish</>)}
                </Button>
                <Link to={`/dashboard/participants?event=${ev.id}`}>
                  <Button variant="outline" size="sm" roleColor={roleColor}><Users className="w-4 h-4" /> Participants</Button>
                </Link>
                <Link to={`/dashboard/judges?event=${ev.id}`}>
                  <Button variant="outline" size="sm" roleColor={roleColor}><UserCheck className="w-4 h-4" /> Judges</Button>
                </Link>
                <Link to={`/dashboard/announcements?event=${ev.id}`}>
                  <Button variant="outline" size="sm" roleColor={roleColor}><Megaphone className="w-4 h-4" /> Announcements</Button>
                </Link>
                <Link to={`/dashboard/analytics?event=${ev.id}`}>
                  <Button variant="outline" size="sm" roleColor={roleColor}><BarChart3 className="w-4 h-4" /> Analytics</Button>
                </Link>
                <Button variant="outline" size="sm" className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white" onClick={() => remove(ev.id)}>
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
                {/* removed Seed Demo Participants button per request */}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Event" roleColor={roleColor}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Title" value={editDraft.title || ''} onChange={(e) => setEditDraft(s => ({ ...s, title: e.target.value }))} roleColor={roleColor} />
          <Input label="Theme" value={editDraft.theme || ''} onChange={(e) => setEditDraft(s => ({ ...s, theme: e.target.value }))} roleColor={roleColor} />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Mode</label>
            <select value={editDraft.mode || 'hybrid'} onChange={(e) => setEditDraft(s => ({ ...s, mode: e.target.value as any }))} className="neon-input w-full px-4 py-2.5 text-white rounded-lg">
              <option value="online">Online</option>
              <option value="offline">In-Person</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <Input label="Location" value={editDraft.location || ''} onChange={(e) => setEditDraft(s => ({ ...s, location: e.target.value }))} roleColor={roleColor} />
          <Input label="Start" type="datetime-local" value={editDraft.startDate || ''} onChange={(e) => setEditDraft(s => ({ ...s, startDate: e.target.value }))} roleColor={roleColor} />
          <Input label="End" type="datetime-local" value={editDraft.endDate || ''} onChange={(e) => setEditDraft(s => ({ ...s, endDate: e.target.value }))} roleColor={roleColor} />
          <Input label="Reg. Deadline" type="datetime-local" value={editDraft.registrationDeadline || ''} onChange={(e) => setEditDraft(s => ({ ...s, registrationDeadline: e.target.value }))} roleColor={roleColor} />
          <Input label="Max Team Size" type="number" value={(editDraft.maxTeamSize as any) || 4} onChange={(e) => setEditDraft(s => ({ ...s, maxTeamSize: Number(e.target.value) }))} roleColor={roleColor} />
          <Input label="Max Participants" type="number" value={(editDraft.maxParticipants as any) || 100} onChange={(e) => setEditDraft(s => ({ ...s, maxParticipants: Number(e.target.value) }))} roleColor={roleColor} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" roleColor={roleColor} onClick={() => setEditing(null)}>Cancel</Button>
          <Button roleColor={roleColor} onClick={saveEdit}>Save</Button>
        </div>
      </Modal>
    </div>
  );
};

export default MyEvents;


