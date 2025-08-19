import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { Award, Target, UserPlus, UserMinus } from 'lucide-react';
import { api, hasApiBaseUrl } from '../../lib/api';

type Assignment = { eventId: string; judgeId: string; judgeName: string; organizerId: string };
type LiteEvent = { id: string; title: string };

export const Judges: React.FC = () => {
  const { user } = useAuth();
  const roleColor = useMemo(() => 'blue' as const, []);
  const params = new URLSearchParams(useLocation().search);
  const [eventId, setEventId] = useState<string>(params.get('event') || '');
  const [judgeEmail, setJudgeEmail] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [myEvents, setMyEvents] = useState<LiteEvent[]>([]);

  const load = async () => {
    if (hasApiBaseUrl()) {
      try {
        const resp = await api.get(`/api/judges/assignments${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''}`);
        if (Array.isArray(resp)) {
          const mapped: Assignment[] = resp.map((a: any) => ({
            eventId: a.eventId,
            judgeId: a.judgeId,
            judgeName: a.judge?.name || a.judge?.email || a.judgeId,
            organizerId: a.event?.organizerId || ''
          }));
          setAssignments(mapped);
          return;
        }
      } catch {}
    }
    const all: Assignment[] = JSON.parse(localStorage.getItem('hv_assignments') || '[]');
    setAssignments(all.filter(a => a.organizerId === user?.id && (!eventId || a.eventId === eventId)));
  };

  useEffect(() => {
    // Load organizer events for dropdown
    const loadEvents = async () => {
      if (hasApiBaseUrl()) {
        try {
          const list = await api.get('/api/events?mine=true');
          if (Array.isArray(list)) setMyEvents(list.map((e: any) => ({ id: String(e.id), title: e.name })));
        } catch {}
      }
    };
    loadEvents();
  }, []);

  useEffect(() => { load(); }, [eventId, user?.id]);

  const addJudge = async () => {
    if (!eventId || !judgeEmail.trim()) return;
    if (hasApiBaseUrl()) {
      try {
        await api.post('/api/judges/assignments', { eventId, judgeId: judgeEmail });
        setJudgeEmail('');
        await load();
        return;
      } catch {}
    }
    const newAssign: Assignment = { eventId, judgeId: `judge-${judgeEmail}`, judgeName: judgeEmail.split('@')[0], organizerId: user?.id || '' };
    const all: Assignment[] = JSON.parse(localStorage.getItem('hv_assignments') || '[]');
    localStorage.setItem('hv_assignments', JSON.stringify([newAssign, ...all]));
    setJudgeEmail('');
    load();
  };

  const removeJudge = (a: Assignment) => {
    const all: Assignment[] = JSON.parse(localStorage.getItem('hv_assignments') || '[]');
    const filtered = all.filter(x => !(x.eventId === a.eventId && x.judgeId === a.judgeId));
    localStorage.setItem('hv_assignments', JSON.stringify(filtered));
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Judges</h1>
      <Card roleColor={roleColor}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Hackathon assigned</label>
            <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="neon-input w-full px-4 py-2.5 text-white rounded-lg">
              <option value="">Select an event</option>
              {myEvents.map(ev => (<option key={ev.id} value={ev.id}>{ev.title}</option>))}
            </select>
          </div>
          <Input label="Judge email" value={judgeEmail} onChange={(e) => setJudgeEmail(e.target.value)} placeholder="judge@example.com" roleColor={roleColor} />
          <div className="flex items-end">
            <Button onClick={addJudge} roleColor={roleColor}><UserPlus className="w-4 h-4" /> Assign</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {assignments.map((a, idx) => (
          <Card key={`${a.eventId}-${a.judgeId}-${idx}`} roleColor={roleColor}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-semibold flex items-center gap-2"><Award className="w-4 h-4 text-neon-orange" /> {a.judgeName}</div>
                <div className="text-gray-400 text-sm flex items-center gap-2"><Target className="w-4 h-4 text-neon-blue" /> Event: {a.eventId}</div>
              </div>
              <Button variant="outline" roleColor={roleColor} onClick={() => removeJudge(a)}><UserMinus className="w-4 h-4" /> Remove</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Judges;


