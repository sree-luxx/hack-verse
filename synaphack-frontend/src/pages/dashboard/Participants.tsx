import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Search } from 'lucide-react';
import { api, hasApiBaseUrl } from '../../lib/api';

type Participant = { id: string; name: string; email: string; registeredAt: string };
type LiteEvent = { id: string; title: string; registrations: number };

export const Participants: React.FC = () => {
  const { user } = useAuth();
  const roleColor = useMemo(() => 'blue' as const, []);
  const params = new URLSearchParams(useLocation().search);
  const [eventId, setEventId] = useState<string>(params.get('event') || '');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [myEvents, setMyEvents] = useState<LiteEvent[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    // Load organizer's events with participant counts for display
    const loadEvents = async () => {
      // Try backend first
      if (hasApiBaseUrl() && user?.role === 'organizer') {
        try {
          const list = await api.get('/api/events?mine=true');
          if (Array.isArray(list) && list.length > 0) {
            setMyEvents(list.map((e: any) => ({ id: String(e.id), title: e.name, registrations: (e._count?.registrations || 0) })));
            return;
          }
        } catch {}
      }

      // Fallback: load locally created events and counts
      try {
        const local = JSON.parse(localStorage.getItem(`hv_events_${user?.id || 'anon'}`) || '[]');
        if (Array.isArray(local) && local.length > 0) {
          const mapped: LiteEvent[] = local.map((e: any) => {
            const regs = JSON.parse(localStorage.getItem(`hv_participants_${e.id}`) || '[]');
            return { id: String(e.id), title: e.title || e.name || 'Event', registrations: Array.isArray(regs) ? regs.length : 0 } as LiteEvent;
          });
          setMyEvents(mapped);
        }
      } catch {}
    };
    loadEvents();
  }, [user?.role]);

  useEffect(() => {
    const load = async () => {
      if (!eventId) return setParticipants([]);
      if (hasApiBaseUrl()) {
        try {
          const regs = await api.get(`/api/registrations?forEvent=${encodeURIComponent(eventId)}`);
          if (Array.isArray(regs)) {
            const mapped: Participant[] = regs.map((r: any) => ({
              id: r.userId,
              name: r.user?.name || r.user?.email?.split('@')[0] || 'Participant',
              email: r.user?.email || '',
              registeredAt: r.createdAt || new Date().toISOString(),
            }));
            setParticipants(mapped);
            return;
          }
        } catch {}
      }
      const data = JSON.parse(localStorage.getItem(`hv_participants_${eventId}`) || '[]');
      setParticipants(data);
    };
    load();
  }, [eventId]);

  const selectedEvent = myEvents.find(e => e.id === eventId);

  const removeParticipant = (id: string) => {
    const next = participants.filter(p => p.id !== id);
    localStorage.setItem(`hv_participants_${eventId}`, JSON.stringify(next));
    setParticipants(next);
  };

  const filtered = participants.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.email.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Participants</h1>

      <Card roleColor={roleColor}>
        <h2 className="text-lg font-semibold text-white mb-4">Your Hackathons</h2>
        {myEvents.length === 0 ? (
          <p className="text-gray-400">No hackathons yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myEvents.map(ev => (
              <Card key={ev.id} roleColor={roleColor} hover>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-white font-medium">{ev.title}</div>
                    <div className="text-gray-400 text-sm mt-1 flex items-center"><Users className="w-4 h-4 mr-2 text-neon-green" /> {ev.registrations} participants</div>
                  </div>
                  <Button variant="outline" size="sm" roleColor={roleColor} onClick={() => setEventId(ev.id)}>View</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {eventId && (
        <Card roleColor={roleColor}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Selected Event</label>
              <div className="text-white font-semibold">{selectedEvent?.title || eventId}</div>
            </div>
            <Input label="Filter" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search name or email" icon={<Search className="w-4 h-4" />} roleColor={roleColor} />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Quick Stats</label>
              <div className="flex items-center text-gray-400"><Users className="w-4 h-4 mr-2 text-neon-green" /> {participants.length} participants</div>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="ghost" size="sm" roleColor={roleColor} onClick={() => setEventId('')}>Back</Button>
          </div>
        </Card>
      )}

      {eventId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <Card key={p.id} roleColor={roleColor}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">{p.name}</div>
                  <div className="text-gray-400 text-sm">{p.email}</div>
                  <div className="text-gray-500 text-xs">Joined {new Date(p.registeredAt).toLocaleString()}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Participants;


