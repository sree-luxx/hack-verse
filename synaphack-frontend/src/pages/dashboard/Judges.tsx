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
      } catch (error) {
        console.error('Failed to load judge assignments:', error);
      }
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
          if (Array.isArray(list)) {
            const mappedEvents = list.map((e: any) => ({ 
              id: String(e.id), 
              title: e.name || e.title || 'Untitled Event' 
            }));
            setMyEvents(mappedEvents);
          }
        } catch (error) {
          console.error('Failed to load events:', error);
          // Fallback to localStorage
          const storageKey = `hv_events_${user?.id || 'anon'}`;
          const storedEvents = JSON.parse(localStorage.getItem(storageKey) || '[]');
          if (Array.isArray(storedEvents) && storedEvents.length > 0) {
            const mappedEvents = storedEvents.map((e: any) => ({ 
              id: String(e.id), 
              title: e.title || e.name || 'Untitled Event' 
            }));
            setMyEvents(mappedEvents);
          }
        }
      } else {
        // Fallback to localStorage when API is not available
        const storageKey = `hv_events_${user?.id || 'anon'}`;
        const storedEvents = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (Array.isArray(storedEvents) && storedEvents.length > 0) {
          const mappedEvents = storedEvents.map((e: any) => ({ 
            id: String(e.id), 
            title: e.title || e.name || 'Untitled Event' 
          }));
          setMyEvents(mappedEvents);
        }
      }
    };
    loadEvents();
  }, [user?.id]);

  useEffect(() => { load(); }, [eventId, user?.id]);

  const addJudge = async () => {
    if (!eventId || !judgeEmail.trim()) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(judgeEmail.trim())) {
      alert('Please enter a valid email address');
      return;
    }
    
    if (hasApiBaseUrl()) {
      try {
        await api.post('/api/judges/assignments', { eventId, judgeEmail: judgeEmail.trim() });
        setJudgeEmail('');
        await load();
        return;
      } catch (error) {
        console.error('Failed to assign judge:', error);
        alert('Failed to assign judge. Please try again.');
      }
    }
    
    // Fallback to localStorage
    const newAssign: Assignment = { 
      eventId, 
      judgeId: `judge-${judgeEmail}`, 
      judgeName: judgeEmail.split('@')[0], 
      organizerId: user?.id || '' 
    };
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
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-neon-blue">Assign Judges to Events</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Hackathon</label>
              <select 
                value={eventId} 
                onChange={(e) => setEventId(e.target.value)} 
                className="neon-input w-full px-4 py-2.5 text-white rounded-lg"
              >
                <option value="">Choose an event to assign judges</option>
                {myEvents.length === 0 ? (
                  <option value="" disabled>No events created yet</option>
                ) : (
                  myEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))
                )}
              </select>
              {myEvents.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">Create events first to assign judges</p>
              )}
            </div>
            
            <Input 
              label="Judge Email" 
              value={judgeEmail} 
              onChange={(e) => setJudgeEmail(e.target.value)} 
              placeholder="judge@example.com" 
              roleColor={roleColor} 
            />
            
            <div className="flex items-end">
              <Button 
                onClick={addJudge} 
                roleColor={roleColor}
                disabled={!eventId || !judgeEmail.trim()}
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" /> 
                Assign Judge
              </Button>
            </div>
          </div>
          
          {eventId && (
            <div className="text-sm text-gray-400">
              <span className="text-neon-blue">Selected Event:</span> {myEvents.find(e => e.id === eventId)?.title}
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Assigned Work</h2>
          {assignments.length > 0 && (
            <span className="text-sm text-gray-400">
              {assignments.length} judge{assignments.length !== 1 ? 's' : ''} assigned
            </span>
          )}
        </div>
        
        {assignments.length === 0 ? (
          <Card roleColor={roleColor}>
            <div className="text-center py-8">
              <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No judges assigned yet</p>
              <p className="text-sm text-gray-500 mt-1">Select an event above and assign judges to get started</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {assignments.map((a, idx) => {
              const event = myEvents.find(e => e.id === a.eventId);
              return (
                <Card key={`${a.eventId}-${a.judgeId}-${idx}`} roleColor={roleColor}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-neon-orange" />
                        <span className="text-white font-semibold">{a.judgeName}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        roleColor={roleColor} 
                        onClick={() => removeJudge(a)}
                      >
                        <UserMinus className="w-4 h-4 mr-1" /> 
                        Remove
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 text-neon-blue" />
                        <span className="text-gray-400">Event:</span>
                        <span className="text-white font-medium">
                          {event ? event.title : `Event ID: ${a.eventId}`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Judge ID:</span>
                        <span className="text-gray-300 font-mono text-xs bg-gray-800 px-2 py-1 rounded">
                          {a.judgeId}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Judges;


