import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Crown, 
  UserMinus, 
  Copy,
  Check,
  MessageSquare,
  Settings,
  Calendar,
  Trophy,
  Target,
  ArrowRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Team, TeamMember, TeamInvite } from '../../types';
import { api, hasApiBaseUrl } from '../../lib/api';

export const TeamManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('my-teams');
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Create team form
  const [createTeamData, setCreateTeamData] = useState({
    name: '',
    description: '',
    maxSize: 4,
    skills: '',
    eventId: ''
  });

  const tabs = [
    { id: 'my-teams', label: 'My Teams', icon: <Users className="w-4 h-4" /> },
    { id: 'discover', label: 'Discover Teams', icon: <Search className="w-4 h-4" /> },
    { id: 'invites', label: 'Invitations', icon: <Mail className="w-4 h-4" /> }
  ];

  useEffect(() => {
    loadTeamsData();
  }, []);

  const loadTeamsData = async () => {
    // Try backend
    if (hasApiBaseUrl()) {
      try {
        const teams = await api.get('/api/teams?mine=true');
        if (Array.isArray(teams)) {
          const mapped: Team[] = teams.map((t: any) => ({
            id: t.id,
            name: t.name,
            eventId: t.eventId || '',
            leaderId: t.members?.[0]?.userId || '',
            members: (t.members || []).map((m: any) => ({
              userId: m.userId,
              name: m.user?.name || m.name || 'Member',
              email: m.user?.email || m.email || '',
              role: m.role === 'LEADER' ? 'leader' : (m.role || 'member'),
              joinedAt: new Date(m.createdAt || Date.now()),
              skills: m.skills || [],
            } as TeamMember)),
            inviteCode: t.inviteCode || 'INVITE',
            maxSize: t.maxSize || 4,
            description: t.description || '',
            skills: t.skills || [],
            status: (t.status?.toLowerCase?.() || 'forming') as Team['status']
          }));
          setMyTeams(mapped);
          setAvailableTeams(mapped);
          setInvites([]);
          return;
        }
      } catch {}
    }

    // Mock data - fallback
    const mockMyTeams: Team[] = [
      {
        id: 'team-1',
        name: 'AI Innovators',
        eventId: 'event-1',
        leaderId: user?.id || 'user-1',
        members: [
          {
            userId: user?.id || 'user-1',
            name: user?.name || 'John Doe',
            email: user?.email || 'john@example.com',
            role: 'leader',
            joinedAt: new Date('2024-11-01'),
            skills: ['React', 'Python', 'Machine Learning']
          },
          {
            userId: 'user-2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'member',
            joinedAt: new Date('2024-11-02'),
            skills: ['UI/UX', 'Figma', 'JavaScript']
          },
          {
            userId: 'user-3',
            name: 'Mike Johnson',
            email: 'mike@example.com',
            role: 'member',
            joinedAt: new Date('2024-11-03'),
            skills: ['Backend', 'Node.js', 'Database']
          }
        ],
        inviteCode: 'AI2024XYZ',
        maxSize: 4,
        description: 'Building innovative AI solutions for healthcare challenges',
        skills: ['AI/ML', 'Healthcare', 'Full-Stack Development'],
        status: 'complete'
      },
      {
        id: 'team-2',
        name: 'Web3 Warriors',
        eventId: 'event-2',
        leaderId: user?.id || 'user-1',
        members: [
          {
            userId: user?.id || 'user-1',
            name: user?.name || 'John Doe',
            email: user?.email || 'john@example.com',
            role: 'leader',
            joinedAt: new Date('2024-11-05'),
            skills: ['Blockchain', 'Solidity', 'React']
          }
        ],
        inviteCode: 'WEB3ABC123',
        maxSize: 5,
        description: 'Creating the future of decentralized applications',
        skills: ['Blockchain', 'Smart Contracts', 'DeFi'],
        status: 'forming'
      }
    ];

    const mockAvailableTeams: Team[] = [
      {
        id: 'team-3',
        name: 'Data Wizards',
        eventId: 'event-1',
        leaderId: 'user-4',
        members: [
          {
            userId: 'user-4',
            name: 'Sarah Wilson',
            email: 'sarah@example.com',
            role: 'leader',
            joinedAt: new Date('2024-11-01'),
            skills: ['Data Science', 'Python', 'ML']
          },
          {
            userId: 'user-5',
            name: 'Tom Brown',
            email: 'tom@example.com',
            role: 'member',
            joinedAt: new Date('2024-11-02'),
            skills: ['Statistics', 'R', 'Visualization']
          }
        ],
        inviteCode: 'DATA2024',
        maxSize: 4,
        description: 'Looking for frontend developers and designers to complete our data science team',
        skills: ['Data Science', 'Frontend', 'UI/UX'],
        status: 'forming'
      },
      {
        id: 'team-4',
        name: 'Mobile Masters',
        eventId: 'event-3',
        leaderId: 'user-6',
        members: [
          {
            userId: 'user-6',
            name: 'Alex Chen',
            email: 'alex@example.com',
            role: 'leader',
            joinedAt: new Date('2024-11-03'),
            skills: ['React Native', 'iOS', 'Android']
          }
        ],
        inviteCode: 'MOBILE456',
        maxSize: 3,
        description: 'Building cross-platform mobile apps. Need backend developer!',
        skills: ['Mobile Development', 'Backend', 'API Integration'],
        status: 'forming'
      }
    ];

    const mockInvites: TeamInvite[] = [
      {
        id: 'invite-1',
        teamId: 'team-5',
        invitedEmail: user?.email || 'john@example.com',
        invitedBy: 'user-7',
        status: 'pending',
        createdAt: new Date('2024-11-10')
      }
    ];

    setMyTeams(mockMyTeams);
    setAvailableTeams(mockAvailableTeams);
    setInvites(mockInvites);
  };

  const handleCreateTeam = async () => {
    if (!createTeamData.name.trim()) {
      toast.error('Team name required', 'Please enter a team name');
      return;
    }

    setIsLoading(true);
    try {
      if (hasApiBaseUrl()) {
        const created = await api.post('/api/teams', { eventId: createTeamData.eventId || undefined, name: createTeamData.name });
        toast.success('Team created!', `${created.name} has been created`);
        await loadTeamsData();
        setShowCreateModal(false);
        setCreateTeamData({ name: '', description: '', maxSize: 4, skills: '', eventId: '' });
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1500));
      const newTeam: Team = {
        id: `team-${Date.now()}`,
        name: createTeamData.name,
        eventId: createTeamData.eventId || 'event-1',
        leaderId: user?.id || 'user-1',
        members: [{
          userId: user?.id || 'user-1',
          name: user?.name || 'User',
          email: user?.email || 'user@example.com',
          role: 'leader',
          joinedAt: new Date(),
          skills: createTeamData.skills.split(',').map(s => s.trim()).filter(Boolean)
        }],
        inviteCode: Math.random().toString(36).substr(2, 9).toUpperCase(),
        maxSize: createTeamData.maxSize,
        description: createTeamData.description,
        skills: createTeamData.skills.split(',').map(s => s.trim()).filter(Boolean),
        status: 'forming'
      };

      setMyTeams(prev => [...prev, newTeam]);
      setShowCreateModal(false);
      setCreateTeamData({ name: '', description: '', maxSize: 4, skills: '', eventId: '' });
      toast.success('Team created!', `${newTeam.name} has been created successfully`);
    } catch (error) {
      toast.error('Failed to create team', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) {
      toast.error('Invite code required', 'Please enter a valid invite code');
      return;
    }

    setIsLoading(true);
    try {
      if (hasApiBaseUrl()) {
        // When invite codes aren't available from API, assume inviteCode is teamId for now
        await api.post('/api/teams/join', { teamId: inviteCode });
        await loadTeamsData();
        setShowJoinModal(false);
        setInviteCode('');
        toast.success('Joined team!');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Find team by invite code
      const team = availableTeams.find(t => t.inviteCode === inviteCode.toUpperCase());
      if (!team) {
        toast.error('Invalid code', 'Team not found with this invite code');
        return;
      }

      if (team.members.length >= team.maxSize) {
        toast.error('Team full', 'This team has reached maximum capacity');
        return;
      }

      // Add user to team
      const updatedTeam = {
        ...team,
        members: [...team.members, {
          userId: user?.id || 'user-1',
          name: user?.name || 'User',
          email: user?.email || 'user@example.com',
          role: 'member' as const,
          joinedAt: new Date(),
          skills: []
        }]
      };

      setMyTeams(prev => [...prev, updatedTeam]);
      setAvailableTeams(prev => prev.filter(t => t.id !== team.id));
      setShowJoinModal(false);
      setInviteCode('');
      toast.success('Joined team!', `Welcome to ${team.name}`);
    } catch (error) {
      toast.error('Failed to join team', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !selectedTeam) {
      toast.error('Email required', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      if (hasApiBaseUrl() && selectedTeam) {
        await api.post('/api/teams/invite', { teamId: selectedTeam.id, userId: inviteEmail }); // assuming backend expects userId/email mapping
        toast.success('Invite sent!', `Invitation sent to ${inviteEmail}`);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Invite sent!', `Invitation sent to ${inviteEmail}`);
      }
      setShowInviteModal(false);
      setInviteEmail('');
      setSelectedTeam(null);
    } catch (error) {
      toast.error('Failed to send invite', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Copied!', 'Invite code copied to clipboard');
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleLeaveTeam = async (teamId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMyTeams(prev => prev.filter(t => t.id !== teamId));
      toast.success('Left team', 'You have left the team successfully');
    } catch (error) {
      toast.error('Failed to leave team', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMyTeams(prev => prev.map(team => 
        team.id === teamId 
          ? { ...team, members: team.members.filter(m => m.userId !== memberId) }
          : team
      ));
      toast.success('Member removed', 'Team member has been removed');
    } catch (error) {
      toast.error('Failed to remove member', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteResponse = async (inviteId: string, response: 'accepted' | 'declined') => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setInvites(prev => prev.filter(i => i.id !== inviteId));
      
      if (response === 'accepted') {
        toast.success('Invite accepted!', 'You have joined the team');
        // Add logic to join the team
      } else {
        toast.info('Invite declined', 'You have declined the team invitation');
      }
    } catch (error) {
      toast.error('Failed to respond to invite', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAvailableTeams = availableTeams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-orbitron font-bold neon-text">Team Management</h1>
          <p className="text-gray-400 mt-1">Create, join, and manage your hackathon teams</p>
        </div>
        
        <div className="flex space-x-4 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={() => setShowJoinModal(true)}
            roleColor="green"
          >
            <Search className="w-4 h-4" />
            Join Team
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            roleColor="green"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <Card roleColor="green">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          roleColor="green"
        />

        <div className="mt-6">
          {activeTab === 'my-teams' && (
            <div className="space-y-6">
              {myTeams.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-orbitron font-bold text-gray-400 mb-2">
                    No teams yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Create your first team or join an existing one
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowJoinModal(true)}
                      roleColor="green"
                    >
                      Join Team
                    </Button>
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      roleColor="green"
                    >
                      Create Team
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {myTeams.map((team) => (
                    <Card key={team.id} hover roleColor="green">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-orbitron font-bold text-white mb-1">
                            {team.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              team.status === 'complete' 
                                ? 'bg-neon-green/20 text-neon-green' 
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {team.status === 'complete' ? 'Complete' : 'Forming'}
                            </span>
                            <span className="text-gray-400 text-sm">
                              {team.members.length}/{team.maxSize} members
                            </span>
                          </div>
                        </div>
                        
                        {team.leaderId === user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTeam(team);
                              setShowInviteModal(true);
                            }}
                            roleColor="green"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <p className="text-gray-400 text-sm mb-4">{team.description}</p>

                      {/* Skills */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {team.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Members */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Team Members</h4>
                        <div className="space-y-2">
                          {team.members.map((member) => (
                            <div key={member.userId} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-neon-green/20 rounded-full flex items-center justify-center">
                                  {member.role === 'leader' ? (
                                    <Crown className="w-4 h-4 text-yellow-400" />
                                  ) : (
                                    <Users className="w-4 h-4 text-neon-green" />
                                  )}
                                </div>
                                <div>
                                  <div className="text-white text-sm font-medium">{member.name}</div>
                                  <div className="text-gray-400 text-xs">{member.email}</div>
                                </div>
                              </div>
                              
                              {team.leaderId === user?.id && member.userId !== user?.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveMember(team.id, member.userId)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Invite Code */}
                      <div className="mb-4 p-3 bg-gray-900/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-300">Invite Code</div>
                            <div className="text-neon-green font-mono">{team.inviteCode}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyInviteCode(team.inviteCode)}
                            roleColor="green"
                          >
                            {copiedCode === team.inviteCode ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1" roleColor="green">
                          <MessageSquare className="w-4 h-4" />
                          Chat
                        </Button>
                        {team.leaderId !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLeaveTeam(team.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Leave
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'discover' && (
            <div className="space-y-6">
              {/* Search */}
              <Input
                type="text"
                placeholder="Search teams by name, skills, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
                roleColor="green"
              />

              {filteredAvailableTeams.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-orbitron font-bold text-gray-400 mb-2">
                    No teams found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your search terms or create a new team
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredAvailableTeams.map((team) => (
                    <Card key={team.id} hover roleColor="green">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-orbitron font-bold text-white mb-1">
                            {team.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                              Looking for members
                            </span>
                            <span className="text-gray-400 text-sm">
                              {team.members.length}/{team.maxSize} members
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-400 text-sm mb-4">{team.description}</p>

                      {/* Skills Needed */}
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-300 mb-2">Skills Needed</div>
                        <div className="flex flex-wrap gap-2">
                          {team.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-neon-green/20 text-neon-green rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Team Leader */}
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-300 mb-2">Team Leader</div>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                            <Crown className="w-4 h-4 text-yellow-400" />
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium">
                              {team.members.find(m => m.role === 'leader')?.name}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => {
                          setInviteCode(team.inviteCode);
                          handleJoinTeam();
                        }}
                        roleColor="green"
                      >
                        <ArrowRight className="w-4 h-4" />
                        Request to Join
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'invites' && (
            <div className="space-y-6">
              {invites.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-orbitron font-bold text-gray-400 mb-2">
                    No invitations
                  </h3>
                  <p className="text-gray-500">
                    You don't have any pending team invitations
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invites.map((invite) => (
                    <Card key={invite.id} roleColor="green">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            Team Invitation
                          </h3>
                          <p className="text-gray-400 text-sm">
                            You've been invited to join a team
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Invited {invite.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleInviteResponse(invite.id, 'declined')}
                            className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleInviteResponse(invite.id, 'accepted')}
                            roleColor="green"
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Create Team Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Team"
        roleColor="green"
      >
        <div className="space-y-6">
          <Input
            label="Team Name"
            value={createTeamData.name}
            onChange={(e) => setCreateTeamData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter team name"
            required
            roleColor="green"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={createTeamData.description}
              onChange={(e) => setCreateTeamData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your team's goals and what you're looking for..."
              className="neon-input w-full px-4 py-2.5 text-white rounded-lg h-24 resize-none focus:border-neon-green focus:shadow-[0_0_10px_rgba(0,255,136,0.5)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Team Size
              </label>
              <select
                value={createTeamData.maxSize}
                onChange={(e) => setCreateTeamData(prev => ({ ...prev, maxSize: parseInt(e.target.value) }))}
                className="neon-input w-full px-4 py-2.5 text-white rounded-lg bg-black/90 focus:border-neon-green focus:shadow-[0_0_10px_rgba(0,255,136,0.5)]"
              >
                {[2, 3, 4, 5, 6].map(size => (
                  <option key={size} value={size}>{size} members</option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Skills Needed (comma-separated)"
            value={createTeamData.skills}
            onChange={(e) => setCreateTeamData(prev => ({ ...prev, skills: e.target.value }))}
            placeholder="React, Python, UI/UX, etc."
            roleColor="green"
          />

          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
              roleColor="green"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTeam}
              isLoading={isLoading}
              className="flex-1"
              roleColor="green"
            >
              Create Team
            </Button>
          </div>
        </div>
      </Modal>

      {/* Join Team Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Team"
        roleColor="green"
      >
        <div className="space-y-6">
          <Input
            label="Invite Code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="Enter team invite code"
            required
            roleColor="green"
          />

          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h4 className="text-white font-medium mb-2">How to get an invite code:</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Ask a team leader for their invite code</li>
              <li>• Browse available teams in the Discover tab</li>
              <li>• Check team announcements in events</li>
            </ul>
          </div>

          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowJoinModal(false)}
              className="flex-1"
              roleColor="green"
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoinTeam}
              isLoading={isLoading}
              className="flex-1"
              disabled={!inviteCode.trim()}
              roleColor="green"
            >
              Join Team
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title={`Invite to ${selectedTeam?.name}`}
        roleColor="green"
      >
        <div className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Enter teammate's email"
            required
            roleColor="green"
          />

          {selectedTeam && (
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-2">Team Info</h4>
              <div className="text-sm text-gray-400 space-y-1">
                <div>Team: {selectedTeam.name}</div>
                <div>Members: {selectedTeam.members.length}/{selectedTeam.maxSize}</div>
                <div>Invite Code: <span className="text-neon-green font-mono">{selectedTeam.inviteCode}</span></div>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowInviteModal(false)}
              className="flex-1"
              roleColor="green"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvite}
              isLoading={isLoading}
              className="flex-1"
              disabled={!inviteEmail.trim()}
              roleColor="green"
            >
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};