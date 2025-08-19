import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

type SeriesPoint = { date: string; count: number };

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const roleColor = useMemo(() => (user?.role === 'organizer' ? 'blue' : 'green') as const, [user?.role]);
  const [registrationTrend, setRegistrationTrend] = useState<SeriesPoint[]>([]);
  const [submissionTrend, setSubmissionTrend] = useState<SeriesPoint[]>([]);

  useEffect(() => {
    const today = new Date();
    const build = (days: number) => Array.from({ length: days }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (days - i));
      return { date: d.toISOString().slice(0, 10), count: Math.floor(Math.random() * 50) };
    });
    setRegistrationTrend(build(14));
    setSubmissionTrend(build(14));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Analytics</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card roleColor={roleColor}>
          <h2 className="text-white font-semibold mb-3">Registrations (last 14 days)</h2>
          <div className="flex gap-2 items-end h-40">
            {registrationTrend.map((p, i) => (
              <div key={i} className="bg-neon-blue/40 w-3" style={{ height: `${(p.count/50)*100}%` }} title={`${p.date}: ${p.count}`} />
            ))}
          </div>
        </Card>
        <Card roleColor={roleColor}>
          <h2 className="text-white font-semibold mb-3">Submissions (last 14 days)</h2>
          <div className="flex gap-2 items-end h-40">
            {submissionTrend.map((p, i) => (
              <div key={i} className="bg-neon-purple/40 w-3" style={{ height: `${(p.count/50)*100}%` }} title={`${p.date}: ${p.count}`} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;


