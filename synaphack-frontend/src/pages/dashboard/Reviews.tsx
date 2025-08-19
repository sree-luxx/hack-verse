import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { CheckCircle, FileText, Star } from 'lucide-react';
import { api, hasApiBaseUrl } from '../../lib/api';

type Criteria = { name: string; maxScore: number };
type Submission = { id: string; title: string; description: string };

export const Reviews: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const roleColor = useMemo(() => 'orange' as const, []);
  const params = new URLSearchParams(useLocation().search);
  const eventId = params.get('event') || '';

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([
    { name: 'Innovation', maxScore: 25 },
    { name: 'Technical', maxScore: 25 },
    { name: 'Impact', maxScore: 25 },
    { name: 'Presentation', maxScore: 25 },
  ]);
  const [active, setActive] = useState<Submission | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      if (hasApiBaseUrl()) {
        try {
          const subs = await api.get(`/api/submissions?eventId=${encodeURIComponent(eventId)}`);
          setSubmissions((subs || []).map((s: any) => ({ id: s.id, title: s.title, description: s.description || '' })));
          return;
        } catch {}
      }
      const local = JSON.parse(localStorage.getItem(`hv_submissions_${eventId}`) || '[]');
      setSubmissions(local.map((s: any) => ({ id: s.id, title: s.title, description: s.description })));
    };
    load();
  }, [eventId]);

  const openReview = (s: Submission) => {
    setActive(s);
    const existing = JSON.parse(localStorage.getItem(`hv_scores_${user?.id}_${eventId}`) || '[]');
    const found = existing.find((x: any) => x.submissionId === s.id);
    if (found) {
      setScores(found.criteria.reduce((acc: any, c: any) => ({ ...acc, [c.name]: c.score }), {}));
      setFeedback(found.overallFeedback || '');
    } else {
      setScores({});
      setFeedback('');
    }
  };

  const saveScore = async () => {
    if (!eventId || !user || !active) return;
    setIsSaving(true);
    try {
      if (hasApiBaseUrl()) {
        const payload = {
          eventId,
          teamId: '',
          submissionId: active.id,
          criteria: criteria.map(c => ({ name: c.name, maxScore: c.maxScore, score: Math.min(Math.max(Number(scores[c.name] || 0), 0), c.maxScore) })),
          notes: feedback,
        } as any;
        await api.post('/api/scores', payload);
        toast.success('Scores saved');
        setActive(null);
        return;
      }
      await new Promise((r) => setTimeout(r, 400));
      const record = {
        submissionId: active.id,
        judgeId: user.id,
        judgeName: user.name,
        criteria: criteria.map(c => ({ name: c.name, maxScore: c.maxScore, score: Math.min(Math.max(Number(scores[c.name] || 0), 0), c.maxScore) })),
        overallFeedback: feedback,
        submittedAt: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem(`hv_scores_${user.id}_${eventId}`) || '[]');
      const updated = [record, ...existing.filter((x: any) => x.submissionId !== active.id)];
      localStorage.setItem(`hv_scores_${user.id}_${eventId}`, JSON.stringify(updated));
      toast.success('Scores saved');
      setActive(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Project Reviews</h1>

      {submissions.length === 0 ? (
        <Card roleColor={roleColor}><p className="text-gray-400">No submissions available yet.</p></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {submissions.map((s) => (
            <Card key={s.id} roleColor={roleColor}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-white font-semibold">{s.title}</div>
                  <div className="text-gray-400 text-sm line-clamp-2">{s.description}</div>
                </div>
                <Button onClick={() => openReview(s)} roleColor={roleColor}><FileText className="w-4 h-4" /> Score</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={!!active} onClose={() => setActive(null)} title={`Score: ${active?.title || ''}`} roleColor={roleColor} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criteria.map((c) => (
            <Input key={c.name} label={`${c.name} (0-${c.maxScore})`} type="number" value={String(scores[c.name] ?? '')} onChange={(e) => setScores(s => ({ ...s, [c.name]: Number(e.target.value) }))} roleColor={roleColor} />
          ))}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Overall Feedback</label>
            <textarea className="neon-input w-full px-4 py-2.5 text-white rounded-lg h-28" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Share your notes..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" roleColor={roleColor} onClick={() => setActive(null)}>Cancel</Button>
          <Button roleColor={roleColor} isLoading={isSaving} onClick={saveScore}><CheckCircle className="w-4 h-4" /> Save</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Reviews;


