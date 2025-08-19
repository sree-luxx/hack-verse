import React, { useMemo, useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { User, Edit, Save, X, Github, Linkedin, Image } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const roleColor = useMemo(() => (user?.role === 'judge' ? 'orange' : user?.role === 'organizer' ? 'blue' : 'green') as const, [user?.role]);
  
  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [github, setGithub] = useState(user?.socialLinks?.github || '');
  const [linkedin, setLinkedin] = useState(user?.socialLinks?.linkedin || '');

  // Update form state when user changes
  useEffect(() => {
    setName(user?.name || '');
    setAvatar(user?.avatar || '');
    setGithub(user?.socialLinks?.github || '');
    setLinkedin(user?.socialLinks?.linkedin || '');
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset form to current user values
    setName(user?.name || '');
    setAvatar(user?.avatar || '');
    setGithub(user?.socialLinks?.github || '');
    setLinkedin(user?.socialLinks?.linkedin || '');
    setIsEditing(false);
  };

  const save = async () => {
    try {
      await updateProfile({ name, avatar, socialLinks: { github, linkedin } as any });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  // For organizers, default to display mode
  useEffect(() => {
    if (user?.role === 'organizer') {
      setIsEditing(false);
    }
  }, [user?.role]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Profile Settings</h1>
      
      {!isEditing ? (
        // Display Mode
        <Card roleColor={roleColor}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neon-blue">Profile Information</h2>
              <Button 
                onClick={handleEdit} 
                variant="outline" 
                size="sm"
                roleColor={roleColor}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Picture */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Profile Picture</label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                    {avatar ? (
                      <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {avatar ? 'Custom avatar set' : 'No avatar set'}
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Name</label>
                <div className="text-white font-medium">{name || 'Not set'}</div>
              </div>

              {/* Social Links */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">GitHub</label>
                <div className="flex items-center space-x-2">
                  <Github className="w-4 h-4 text-gray-400" />
                  {github ? (
                    <a 
                      href={github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-neon-blue hover:underline"
                    >
                      {github}
                    </a>
                  ) : (
                    <span className="text-gray-500">Not set</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">LinkedIn</label>
                <div className="flex items-center space-x-2">
                  <Linkedin className="w-4 h-4 text-gray-400" />
                  {linkedin ? (
                    <a 
                      href={linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-neon-blue hover:underline"
                    >
                      {linkedin}
                    </a>
                  ) : (
                    <span className="text-gray-500">Not set</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        // Edit Mode
        <Card roleColor={roleColor}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neon-blue">Edit Profile</h2>
              <Button 
                onClick={handleCancel} 
                variant="outline" 
                size="sm"
                roleColor={roleColor}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Enter your name"
                roleColor={roleColor} 
              />
              <Input 
                label="Avatar URL" 
                value={avatar} 
                onChange={(e) => setAvatar(e.target.value)} 
                placeholder="https://example.com/avatar.jpg"
                roleColor={roleColor} 
              />
              <Input 
                label="GitHub" 
                value={github} 
                onChange={(e) => setGithub(e.target.value)} 
                placeholder="https://github.com/username" 
                roleColor={roleColor} 
              />
              <Input 
                label="LinkedIn" 
                value={linkedin} 
                onChange={(e) => setLinkedin(e.target.value)} 
                placeholder="https://linkedin.com/in/username" 
                roleColor={roleColor} 
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                onClick={handleCancel} 
                variant="outline" 
                roleColor={roleColor}
              >
                Cancel
              </Button>
              <Button 
                onClick={save} 
                roleColor={roleColor}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Profile;


