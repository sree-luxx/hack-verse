import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { api, hasApiBaseUrl } from '../../lib/api';

type NewEventForm = {
  title: string;
  theme: string;
  mode: 'online' | 'offline' | 'hybrid';
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeamSize: number;
  maxParticipants: number;
  description: string;
};

const defaultForm: NewEventForm = {
  title: '',
  theme: '',
  mode: 'hybrid',
  location: '',
  startDate: '',
  endDate: '',
  registrationDeadline: '',
  maxTeamSize: 4,
  maxParticipants: 100,
  description: ''
};

export const CreateEvent: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<NewEventForm>(defaultForm);
  const [isLoading, setIsLoading] = useState(false);

  const roleColor = useMemo(() => 'blue' as const, []);

  const storageKey = useMemo(() => `hv_events_${user?.id || 'anon'}`,[user?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'maxTeamSize' || name === 'maxParticipants' ? Number(value) : value }));
  };

  const validate = () => {
    if (!form.title.trim()) return 'Title is required';
    if (!form.theme.trim()) return 'Theme is required';
    if (!form.startDate || !form.endDate) return 'Start and End dates are required';
    if (new Date(form.endDate) < new Date(form.startDate)) return 'End date must be after start date';
    if (!form.registrationDeadline) return 'Registration deadline is required';
    if (new Date(form.registrationDeadline) > new Date(form.startDate)) return 'Registration deadline must be before start date';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast.error('Invalid form', error);
      return;
    }
    setIsLoading(true);
    try {
      if (hasApiBaseUrl()) {
        await api.post('/api/events', {
          name: form.title.trim(),
          description: form.description.trim(),
          theme: form.theme.trim(),
          online: form.mode !== 'offline',
          location: form.location.trim() || (form.mode === 'online' ? 'Virtual' : ''),
          startAt: form.startDate,
          endAt: form.endDate,
          registrationOpenAt: undefined,
          registrationCloseAt: form.registrationDeadline,
          tracks: [],
          rules: [],
          prizes: [],
          sponsors: [],
        });
        toast.success('Event created');
        navigate('/dashboard/my-events');
        return;
      }
      await new Promise((r) => setTimeout(r, 600));
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const id = Math.random().toString(36).slice(2, 10);
      const bannerChoices = [
        'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/7567443/pexels-photo-7567443.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/9028894/pexels-photo-9028894.jpeg?auto=compress&cs=tinysrgb&w=1200'
      ];
      const newEvent = {
        id,
        title: form.title.trim(),
        description: form.description.trim(),
        theme: form.theme.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        registrationDeadline: form.registrationDeadline,
        mode: form.mode,
        location: form.location.trim() || (form.mode === 'online' ? 'Virtual' : ''),
        maxTeamSize: form.maxTeamSize,
        prizes: [],
        sponsors: [],
        tracks: [],
        rules: 'Standard hackathon rules apply',
        timeline: [],
        organizerId: user?.id || 'anon',
        status: 'draft',
        registrations: 0,
        maxParticipants: form.maxParticipants,
        bannerUrl: bannerChoices[Math.floor(Math.random() * bannerChoices.length)],
        rounds: []
      };
      localStorage.setItem(storageKey, JSON.stringify([newEvent, ...existing]));
      toast.success('Event created', 'You can publish it from My Events');
      navigate('/dashboard/my-events');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card roleColor={roleColor}>
        <h1 className="text-2xl font-orbitron font-bold text-white mb-6">Create Event</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input label="Title" name="title" value={form.title} onChange={handleChange} placeholder="e.g., AI Innovation Challenge" roleColor={roleColor} required />
          </div>
          <Input label="Theme" name="theme" value={form.theme} onChange={handleChange} placeholder="e.g., Artificial Intelligence" roleColor={roleColor} />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Mode</label>
            <select name="mode" value={form.mode} onChange={handleChange} className="neon-input w-full px-4 py-2.5 text-white rounded-lg">
              <option value="online">Online</option>
              <option value="offline">In-Person</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <Input label="Location" name="location" value={form.location} onChange={handleChange} placeholder={form.mode === 'online' ? 'Virtual' : 'City, Venue'} roleColor={roleColor} />
          <div>
            <Input label="Start Date" name="startDate" type="date" value={form.startDate} onChange={handleChange} roleColor={roleColor} required />
          </div>
          <div>
            <Input label="End Date" name="endDate" type="date" value={form.endDate} onChange={handleChange} roleColor={roleColor} required />
          </div>
          <div>
            <Input label="Registration Deadline" name="registrationDeadline" type="date" value={form.registrationDeadline} onChange={handleChange} roleColor={roleColor} required />
          </div>
          <Input label="Max Team Size" name="maxTeamSize" type="number" min={1} max={10} value={form.maxTeamSize} onChange={handleChange} roleColor={roleColor} />
          <Input label="Max Participants" name="maxParticipants" type="number" min={10} max={10000} value={form.maxParticipants} onChange={handleChange} roleColor={roleColor} />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the event, expectations, rules, etc." className="neon-input w-full px-4 py-2.5 text-white rounded-lg h-32 resize-none" />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3">
            <Button type="button" variant="outline" roleColor={roleColor} onClick={() => navigate('/dashboard/my-events')}>Cancel</Button>
            <Button type="submit" roleColor={roleColor} isLoading={isLoading}>Create Event</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateEvent;


