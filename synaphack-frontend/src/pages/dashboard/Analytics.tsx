import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Calendar, TrendingUp, Target, BarChart3, Activity, RefreshCw } from 'lucide-react';
import { api, hasApiBaseUrl } from '../../lib/api';

type Event = {
  id: string;
  name: string;
  theme: string;
  startAt: string;
  endAt: string;
  _count?: { registrations: number; teams: number };
};

type Registration = {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  teamId?: string;
  teamName?: string;
};

type SeriesPoint = { date: string; count: number };

type EventStats = {
  totalRegistrations: number;
  totalTeams: number;
  registrationsByDay: SeriesPoint[];
  teamFormationRate: number;
  averageTeamSize: number;
};

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const roleColor = useMemo(() => (user?.role === 'organizer' ? 'blue' : 'green') as const, [user?.role]);
  
  // State
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Load organizer's events
  const loadEvents = async () => {
    if (user?.role !== 'organizer') return;
    
    try {
      if (hasApiBaseUrl()) {
        const list = await api.get('/api/events?mine=true');
        if (Array.isArray(list)) {
          const mappedEvents = list.map((e: any) => ({
            id: String(e.id),
            name: e.name || e.title || 'Untitled Event',
            theme: e.theme || 'General',
            startAt: e.startAt || e.startDate || new Date().toISOString(),
            endAt: e.endAt || e.endDate || new Date().toISOString(),
            _count: { 
              registrations: e._count?.registrations || 0,
              teams: e._count?.teams || 0
            }
          }));
          setEvents(mappedEvents);
          return;
        }
      }
      
      // Fallback to localStorage
      const storageKey = `hv_events_${user?.id || 'anon'}`;
      const storedEvents = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(storedEvents) && storedEvents.length > 0) {
        const mappedEvents = storedEvents.map((e: any) => ({
          id: String(e.id),
          name: e.title || e.name || 'Untitled Event',
          theme: e.theme || 'General',
          startAt: e.startDate || e.startAt || new Date().toISOString(),
          endAt: e.endDate || e.endAt || new Date().toISOString(),
          _count: { 
            registrations: e.registrations || 0,
            teams: e.teams || 0
          }
        }));
        setEvents(mappedEvents);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  // Load registrations for selected event
  const loadRegistrations = async (eventId: string) => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      if (hasApiBaseUrl()) {
        const list = await api.get(`/api/registrations?forEvent=${encodeURIComponent(eventId)}`);
        if (Array.isArray(list)) {
          const mappedRegistrations = list.map((r: any) => ({
            id: String(r.id),
            eventId: r.eventId,
            userId: r.userId,
            userName: r.user?.name || r.userName || 'Anonymous',
            userEmail: r.user?.email || r.userEmail || 'No email',
            createdAt: r.createdAt,
            teamId: r.teamId,
            teamName: r.team?.name || r.teamName
          }));
          setRegistrations(mappedRegistrations);
          calculateEventStats(mappedRegistrations, eventId);
          return;
        }
      }
      
      // Fallback to localStorage
      const stored = JSON.parse(localStorage.getItem('hv_registrations') || '[]');
      const eventRegistrations = stored.filter((r: any) => r.eventId === eventId);
      const mappedRegistrations = eventRegistrations.map((r: any) => ({
        id: String(r.id),
        eventId: r.eventId,
        userId: r.userId,
        userName: r.userName || 'Anonymous',
        userEmail: r.userEmail || 'No email',
        createdAt: r.createdAt,
        teamId: r.teamId,
        teamName: r.teamName
      }));
      setRegistrations(mappedRegistrations);
      calculateEventStats(mappedRegistrations, eventId);
    } catch (error) {
      console.error('Failed to load registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate event statistics
  const calculateEventStats = (regs: Registration[], eventId: string) => {
    const totalRegistrations = regs.length;
    const uniqueTeams = new Set(regs.filter(r => r.teamId).map(r => r.teamId)).size;
    const totalTeams = uniqueTeams;
    
    // Group registrations by date
    const registrationsByDate = new Map<string, number>();
    regs.forEach(reg => {
      const date = reg.createdAt.split('T')[0];
      registrationsByDate.set(date, (registrationsByDate.get(date) || 0) + 1);
    });
    
    // Convert to series format and sort by date
    const registrationsByDay: SeriesPoint[] = Array.from(registrationsByDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    const teamFormationRate = totalRegistrations > 0 ? (uniqueTeams / totalRegistrations) * 100 : 0;
    const averageTeamSize = uniqueTeams > 0 ? totalRegistrations / uniqueTeams : 0;
    
    setEventStats({
      totalRegistrations,
      totalTeams,
      registrationsByDay,
      teamFormationRate,
      averageTeamSize
    });
  };

  // Handle event selection
  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    const event = events.find(e => e.id === eventId);
    setSelectedEvent(event || null);
    if (eventId) {
      loadRegistrations(eventId);
    } else {
      setRegistrations([]);
      setEventStats(null);
    }
  };

  // Refresh data
  const refreshData = () => {
    if (selectedEventId) {
      loadRegistrations(selectedEventId);
    }
    loadEvents();
  };

  useEffect(() => {
    if (user?.role === 'organizer') {
      loadEvents();
    }
  }, [user?.role, user?.id]);

  // For non-organizers, show a simplified view
  if (user?.role !== 'organizer') {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Analytics</h1>
        <Card roleColor={roleColor}>
          <div className="text-center py-8">
            <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Analytics Dashboard</p>
            <p className="text-sm text-gray-500 mt-1">Available for organizers only</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-orbitron font-bold">Analytics Dashboard</h1>
        <Button 
          onClick={refreshData} 
          variant="outline" 
          size="sm"
          roleColor={roleColor}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {/* Event Selection */}
      <Card roleColor={roleColor}>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neon-blue">Select Event for Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Choose Hackathon</label>
              <select 
                value={selectedEventId} 
                onChange={(e) => handleEventSelect(e.target.value)} 
                className="neon-input w-full px-4 py-2.5 text-white rounded-lg"
              >
                <option value="">Select an event to view analytics</option>
                {events.length === 0 ? (
                  <option value="" disabled>No events created yet</option>
                ) : (
                  events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev._count?.registrations || 0} registrations)
                    </option>
                  ))
                )}
              </select>
              {events.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">Create events first to view analytics</p>
              )}
            </div>
            
            {selectedEvent && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Selected Event</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-400">Name:</span> <span className="text-white">{selectedEvent.name}</span></div>
                  <div><span className="text-gray-400">Theme:</span> <span className="text-white">{selectedEvent.theme}</span></div>
                  <div><span className="text-gray-400">Start:</span> <span className="text-white">{new Date(selectedEvent.startAt).toLocaleDateString()}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Event Statistics */}
      {selectedEvent && eventStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card roleColor={roleColor}>
            <div className="text-center">
              <Users className="w-8 h-8 text-neon-blue mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{eventStats.totalRegistrations}</div>
              <div className="text-sm text-gray-400">Total Registrations</div>
            </div>
          </Card>
          
          <Card roleColor={roleColor}>
            <div className="text-center">
              <Target className="w-8 h-8 text-neon-purple mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{eventStats.totalTeams}</div>
              <div className="text-sm text-gray-400">Teams Formed</div>
            </div>
          </Card>
          
        <Card roleColor={roleColor}>
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-neon-orange mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{eventStats.teamFormationRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Team Formation Rate</div>
          </div>
        </Card>
          
        <Card roleColor={roleColor}>
            <div className="text-center">
              <Activity className="w-8 h-8 text-neon-green mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{eventStats.averageTeamSize.toFixed(1)}</div>
              <div className="text-sm text-gray-400">Avg Team Size</div>
          </div>
        </Card>
      </div>
      )}

      {/* Registration Trends Chart */}
      {selectedEvent && eventStats && eventStats.registrationsByDay.length > 0 && (
        <Card roleColor={roleColor}>
          <h2 className="text-white font-semibold mb-4">Registration Trends</h2>
          <div className="flex gap-2 items-end h-40">
            {eventStats.registrationsByDay.map((point, i) => (
              <div 
                key={i} 
                className="bg-neon-blue/40 w-4 rounded-t" 
                style={{ height: `${Math.max((point.count / Math.max(...eventStats.registrationsByDay.map(p => p.count))) * 100, 10)}%` }} 
                title={`${point.date}: ${point.count} registrations`} 
              />
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-2 text-center">
            Registration activity over time
          </div>
        </Card>
      )}

      {/* Registrations List */}
      {selectedEvent && (
        <Card roleColor={roleColor}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Participant Registrations</h2>
              <span className="text-sm text-gray-400">
                {loading ? 'Loading...' : `${registrations.length} participants`}
              </span>
            </div>
            
            {registrations.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No registrations yet</p>
                <p className="text-sm text-gray-500 mt-1">Participants will appear here once they register</p>
              </div>
            ) : (
              <div className="space-y-3">
                {registrations.map((reg) => (
                  <div key={reg.id} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-white font-medium">{reg.userName}</div>
                        <div className="text-sm text-gray-400">{reg.userEmail}</div>
                        {reg.teamName && (
                          <div className="text-xs text-neon-blue bg-neon-blue/10 px-2 py-1 rounded">
                            Team: {reg.teamName}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{new Date(reg.createdAt).toLocaleDateString()}</div>
                        <div>{new Date(reg.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Analytics;


