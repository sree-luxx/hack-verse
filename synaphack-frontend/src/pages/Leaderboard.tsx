import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Trophy, Award, Medal } from 'lucide-react';
import { api, hasApiBaseUrl } from '../lib/api';

export const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<Array<{ rank: number; team: string; event: string; points: number }>>([]);
  const [eventId, setEventId] = useState('');

  useEffect(() => {
    const load = async () => {
      if (hasApiBaseUrl() && eventId) {
        try {
          const rows = await api.get(`/api/leaderboard/${encodeURIComponent(eventId)}`);
          setEntries((rows || []).map((r: any, idx: number) => ({ rank: idx + 1, team: r.teamName || r.team || 'Team', event: r.eventName || '', points: r.points || r.total || 0 })));
          return;
        } catch {}
      }
      // fallback mock
      const mock = Array.from({ length: 10 }).map((_, i) => ({ rank: i + 1, team: `Team ${i + 1}`, event: i % 2 === 0 ? 'AI Innovation Challenge' : 'Web3 Future Hackathon', points: Math.floor(Math.random() * 1000) + 500 }));
      setEntries(mock);
    };
    load();
  }, [eventId]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Leaderboard</h1>
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className="neon-input px-3 py-2 rounded bg-black/80 text-white" placeholder="Event ID (optional)" value={eventId} onChange={(e) => setEventId(e.target.value)} />
        </div>
      </Card>
      <Card>
        <div className="divide-y divide-gray-800">
          {entries.map((e) => (
            <div key={e.rank} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                  {e.rank === 1 ? <Trophy className="w-5 h-5 text-yellow-400" /> : e.rank === 2 ? <Medal className="w-5 h-5 text-gray-300" /> : e.rank === 3 ? <Medal className="w-5 h-5 text-amber-700" /> : <Award className="w-5 h-5 text-neon-purple" />}
                </div>
                <div>
                  <div className="text-white font-semibold">#{e.rank} {e.team}</div>
                  <div className="text-xs text-gray-500">{e.event}</div>
                </div>
              </div>
              <div className="text-neon-purple font-orbitron text-lg">{e.points}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Leaderboard;


