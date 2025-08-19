import React, { useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const roleColor = useMemo(() => (user?.role === 'judge' ? 'orange' : user?.role === 'organizer' ? 'blue' : 'green') as const, [user?.role]);
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [github, setGithub] = useState(user?.socialLinks?.github || '');
  const [linkedin, setLinkedin] = useState(user?.socialLinks?.linkedin || '');

  const save = async () => {
    await updateProfile({ name, avatar, socialLinks: { github, linkedin } as any });
    toast.success('Profile updated');
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Profile Settings</h1>
      <Card roleColor={roleColor}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} roleColor={roleColor} />
          <Input label="Avatar URL" value={avatar} onChange={(e) => setAvatar(e.target.value)} roleColor={roleColor} />
          <Input label="GitHub" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/username" roleColor={roleColor} />
          <Input label="LinkedIn" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username" roleColor={roleColor} />
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={save} roleColor={roleColor}>Save</Button>
        </div>
      </Card>
    </div>
  );
};

export default Profile;


