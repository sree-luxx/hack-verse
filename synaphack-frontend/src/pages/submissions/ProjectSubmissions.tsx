import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Github, 
  Video, 
  Link as LinkIcon, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Submission, Event } from '../../types';
import { api, hasApiBaseUrl } from '../../lib/api';

export const ProjectSubmissions: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('submissions');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Submission form data
  const [submissionData, setSubmissionData] = useState({
    eventId: '',
    roundId: '',
    title: '',
    description: '',
    githubUrl: '',
    demoUrl: '',
    videoUrl: '',
    files: [] as File[]
  });

  const tabs = [
    { id: 'submissions', label: 'My Submissions', icon: <FileText className="w-4 h-4" /> },
    { id: 'feedback', label: 'Feedback & Scores', icon: <Star className="w-4 h-4" /> }
  ];

  useEffect(() => {
    loadSubmissionsData();
  }, []);

  const loadSubmissionsData = async () => {
    // Try backend first
    if (hasApiBaseUrl()) {
      try {
        const evs = await api.get('/api/events');
        const normalizedE: Event[] = (evs || []).map((e: any) => ({
          id: e.id,
          title: e.name || e.title,
          description: e.description || '',
          theme: e.theme || 'General',
          startDate: new Date(e.startAt || e.startDate),
          endDate: new Date(e.endAt || e.endDate),
          registrationDeadline: new Date(e.startAt || e.registrationDeadline || Date.now()),
          mode: e.online ? 'online' : 'offline',
          location: e.location || (e.online ? 'Virtual' : ''),
          maxTeamSize: 4,
          prizes: e.prizes || [],
          sponsors: e.sponsors || [],
          tracks: (e.tracks || []).map((t: any) => t.name || t),
          rules: '',
          timeline: [],
          organizerId: e.organizerId || 'org',
          status: 'ongoing',
          registrations: 0,
          bannerUrl: e.bannerUrl,
          rounds: [],
        }));
        setEvents(normalizedE);

        const subs = await api.get('/api/submissions');
        const normalizedS: Submission[] = (subs || []).map((s: any) => ({
          id: s.id,
          teamId: s.teamId,
          eventId: s.eventId,
          roundId: s.roundId || '',
          title: s.title,
          description: s.description || '',
          githubUrl: s.repoUrl || s.githubUrl,
          demoUrl: s.demoUrl,
          videoUrl: s.videoUrl,
          documents: (s.files || []).map((f: any, i: number) => ({ id: `${s.id}-${i}`, name: f.name || 'file', url: f.url || '', type: f.type || '', size: f.size || 0 })),
          submittedAt: new Date(s.createdAt || Date.now()),
          status: 'submitted',
          scores: [],
          feedback: [],
        }));
        setSubmissions(normalizedS);
        return;
      } catch {}
    }

    // Fallback mock
    const mockEvents: Event[] = [
      {
        id: 'event-1',
        title: 'AI Innovation Challenge',
        description: 'AI hackathon',
        theme: 'AI',
        startDate: new Date('2024-12-15'),
        endDate: new Date('2024-12-17'),
        registrationDeadline: new Date('2024-12-10'),
        mode: 'hybrid',
        location: 'San Francisco',
        maxTeamSize: 4,
        prizes: [],
        sponsors: [],
        tracks: [],
        rules: '',
        timeline: [],
        organizerId: 'org-1',
        status: 'ongoing',
        registrations: 150,
        bannerUrl: '',
        rounds: [
          {
            id: 'round-1',
            name: 'Initial Submission',
            description: 'Submit your MVP',
            startDate: new Date('2024-12-15'),
            endDate: new Date('2024-12-17T15:00:00'),
            criteria: [
              { name: 'Innovation', description: 'Originality', maxScore: 25 },
              { name: 'Technical Implementation', description: 'Code quality', maxScore: 25 },
              { name: 'Impact', description: 'Real-world value', maxScore: 25 },
              { name: 'Presentation', description: 'Demo quality', maxScore: 25 }
            ]
          }
        ]
      }
    ];

    const mockSubmissions: Submission[] = [
      {
        id: 'sub-1',
        teamId: 'team-1',
        eventId: 'event-1',
        roundId: 'round-1',
        title: 'HealthAI Assistant',
        description: 'An AI-powered healthcare assistant that helps patients manage their medications and appointments using natural language processing.',
        githubUrl: 'https://github.com/team/healthai-assistant',
        demoUrl: 'https://healthai-demo.vercel.app',
        videoUrl: 'https://youtube.com/watch?v=demo',
        documents: [
          {
            id: 'doc-1',
            name: 'Project_Presentation.pdf',
            url: 'https://example.com/presentation.pdf',
            type: 'application/pdf',
            size: 2048000
          },
          {
            id: 'doc-2',
            name: 'Technical_Documentation.md',
            url: 'https://example.com/docs.md',
            type: 'text/markdown',
            size: 512000
          }
        ],
        submittedAt: new Date('2024-12-16T14:30:00'),
        status: 'reviewed',
        scores: [
          {
            judgeId: 'judge-1',
            judgeName: 'Dr. Sarah Johnson',
            criteria: [
              { criteriaName: 'Innovation', score: 22, maxScore: 25, feedback: 'Excellent use of NLP for healthcare' },
              { criteriaName: 'Technical Implementation', score: 20, maxScore: 25, feedback: 'Solid architecture, could improve error handling' },
              { criteriaName: 'Impact', score: 24, maxScore: 25, feedback: 'High potential for real-world impact' },
              { criteriaName: 'Presentation', score: 18, maxScore: 25, feedback: 'Good demo, could be more polished' }
            ],
            overallFeedback: 'Great project with strong healthcare focus. The AI implementation is impressive and the use case is very relevant.',
            submittedAt: new Date('2024-12-17T10:00:00')
          },
          {
            judgeId: 'judge-2',
            judgeName: 'Prof. Michael Chen',
            criteria: [
              { criteriaName: 'Innovation', score: 20, maxScore: 25, feedback: 'Good concept, similar solutions exist' },
              { criteriaName: 'Technical Implementation', score: 23, maxScore: 25, feedback: 'Excellent code quality and structure' },
              { criteriaName: 'Impact', score: 21, maxScore: 25, feedback: 'Good potential, needs user validation' },
              { criteriaName: 'Presentation', score: 19, maxScore: 25, feedback: 'Clear presentation, good flow' }
            ],
            overallFeedback: 'Well-executed project with good technical implementation. Consider conducting user studies to validate the approach.',
            submittedAt: new Date('2024-12-17T11:30:00')
          }
        ],
        feedback: [
          'Consider adding multi-language support',
          'Integration with existing healthcare systems would be valuable',
          'User privacy and data security should be highlighted more'
        ]
      },
      {
        id: 'sub-2',
        teamId: 'team-2',
        eventId: 'event-2',
        roundId: 'round-1',
        title: 'DeFi Portfolio Tracker',
        description: 'A decentralized finance portfolio tracking application with real-time analytics and yield farming optimization.',
        githubUrl: 'https://github.com/team/defi-tracker',
        demoUrl: 'https://defi-tracker.netlify.app',
        documents: [
          {
            id: 'doc-3',
            name: 'Smart_Contract_Audit.pdf',
            url: 'https://example.com/audit.pdf',
            type: 'application/pdf',
            size: 1024000
          }
        ],
        submittedAt: new Date('2024-12-22T16:45:00'),
        status: 'submitted',
        scores: [],
        feedback: []
      }
    ];

    setEvents(mockEvents);
    setSubmissions(mockSubmissions);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'text/markdown', 'text/plain', 'application/zip'];
    
    const validFiles = fileArray.filter(file => {
      if (file.size > maxSize) {
        toast.error('File too large', `${file.name} exceeds 10MB limit`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type', `${file.name} is not a supported file type`);
        return false;
      }
      return true;
    });

    setSubmissionData(prev => ({
      ...prev,
      files: [...prev.files, ...validFiles]
    }));
  };

  const handleRemoveFile = (index: number) => {
    setSubmissionData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const simulateUpload = async () => {
    setUploadProgress(0);
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(i);
    }
  };

  const handleSubmit = async () => {
    if (!submissionData.title.trim() || !submissionData.description.trim()) {
      toast.error('Required fields missing', 'Please fill in title and description');
      return;
    }

    setIsLoading(true);
    try {
      if (hasApiBaseUrl()) {
        await simulateUpload();
        // try pick a team id
        let teamId = 'team-1';
        try {
          const teams = await api.get('/api/teams');
          if (Array.isArray(teams) && teams[0]?.id) teamId = teams[0].id;
        } catch {}
        const payload: any = {
          eventId: submissionData.eventId,
          teamId,
          title: submissionData.title,
          description: submissionData.description,
          repoUrl: submissionData.githubUrl,
          files: [],
          metadata: { demoUrl: submissionData.demoUrl, videoUrl: submissionData.videoUrl },
        };
        // Optional: upload files to /api/upload and push to payload.files
        if (submissionData.files.length) {
          const toBase64 = (f: File) => new Promise<string>((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(String((reader.result as string)?.split(',')[1] || ''));
            reader.onerror = rej; reader.readAsDataURL(f);
          });
          for (const file of submissionData.files) {
            const base64 = await toBase64(file);
            const up = await api.post('/api/upload', { base64, contentType: file.type, prefix: 'docs/', filename: file.name });
            payload.files.push({ name: file.name, url: up.url, type: file.type, size: file.size });
          }
        }
        await api.post('/api/submissions', payload);
        await loadSubmissionsData();
        setShowSubmissionModal(false);
        setSubmissionData({ eventId: '', roundId: '', title: '', description: '', githubUrl: '', demoUrl: '', videoUrl: '', files: [] });
        setUploadProgress(0);
        toast.success('Submission successful!', 'Your project has been submitted for review');
        return;
      }

      await simulateUpload();
      const newSubmission: Submission = {
        id: `sub-${Date.now()}`,
        teamId: 'team-1',
        eventId: submissionData.eventId || 'event-1',
        roundId: submissionData.roundId || 'round-1',
        title: submissionData.title,
        description: submissionData.description,
        githubUrl: submissionData.githubUrl,
        demoUrl: submissionData.demoUrl,
        videoUrl: submissionData.videoUrl,
        documents: submissionData.files.map((file, index) => ({
          id: `doc-${Date.now()}-${index}`,
          name: file.name,
          url: `https://storage.example.com/${file.name}`,
          type: file.type,
          size: file.size
        })),
        submittedAt: new Date(),
        status: 'submitted',
        scores: [],
        feedback: []
      };

      setSubmissions(prev => [...prev, newSubmission]);
      setShowSubmissionModal(false);
      setSubmissionData({
        eventId: '',
        roundId: '',
        title: '',
        description: '',
        githubUrl: '',
        demoUrl: '',
        videoUrl: '',
        files: []
      });
      setUploadProgress(0);
      
      toast.success('Submission successful!', 'Your project has been submitted for review');
    } catch (error) {
      toast.error('Submission failed', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setSubmissionData({
      eventId: submission.eventId,
      roundId: submission.roundId,
      title: submission.title,
      description: submission.description,
      githubUrl: submission.githubUrl || '',
      demoUrl: submission.demoUrl || '',
      videoUrl: submission.videoUrl || '',
      files: []
    });
    setShowSubmissionModal(true);
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      toast.success('Submission deleted', 'Your submission has been removed');
    } catch (error) {
      toast.error('Failed to delete', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-neon-blue';
      case 'reviewed': return 'text-neon-green';
      case 'draft': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Clock className="w-4 h-4" />;
      case 'reviewed': return <CheckCircle className="w-4 h-4" />;
      case 'draft': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const calculateAverageScore = (scores: any[]) => {
    if (scores.length === 0) return 0;
    const totalScore = scores.reduce((sum, score) => {
      const criteriaTotal = score.criteria.reduce((criteriaSum: number, criteria: any) => 
        criteriaSum + criteria.score, 0);
      return sum + criteriaTotal;
    }, 0);
    const maxPossibleScore = scores.length * 100; // Assuming 4 criteria * 25 points each
    return Math.round((totalScore / maxPossibleScore) * 100);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-orbitron font-bold neon-text">Project Submissions</h1>
          <p className="text-gray-400 mt-1">Submit and manage your hackathon projects</p>
        </div>
        
        <Button
          onClick={() => setShowSubmissionModal(true)}
          roleColor="green"
        >
          <Plus className="w-4 h-4" />
          New Submission
        </Button>
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
          {activeTab === 'submissions' && (
            <div className="space-y-6">
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <Upload className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-orbitron font-bold text-gray-400 mb-2">
                    No submissions yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Submit your first project to get started
                  </p>
                  <Button
                    onClick={() => setShowSubmissionModal(true)}
                    roleColor="green"
                  >
                    Create Submission
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {submissions.map((submission) => (
                    <Card key={submission.id} hover roleColor="green">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-orbitron font-bold text-white">
                              {submission.title}
                            </h3>
                            <div className={`flex items-center space-x-1 ${getStatusColor(submission.status)}`}>
                              {getStatusIcon(submission.status)}
                              <span className="text-sm font-medium capitalize">{submission.status}</span>
                            </div>
                          </div>
                          
                          <p className="text-gray-400 text-sm mb-3">{submission.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Submitted {submission.submittedAt.toLocaleDateString()}
                            </div>
                            {submission.scores.length > 0 && (
                              <div className="flex items-center">
                                <Star className="w-4 h-4 mr-1 text-yellow-400" />
                                Score: {calculateAverageScore(submission.scores)}%
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSubmission(submission)}
                            roleColor="green"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSubmission(submission.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Links */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {submission.githubUrl && (
                          <a
                            href={submission.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-neon-green transition-colors"
                          >
                            <Github className="w-5 h-5 text-neon-green mr-3" />
                            <div>
                              <div className="text-white text-sm font-medium">Source Code</div>
                              <div className="text-gray-400 text-xs">View on GitHub</div>
                            </div>
                          </a>
                        )}
                        
                        {submission.demoUrl && (
                          <a
                            href={submission.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-neon-blue transition-colors"
                          >
                            <LinkIcon className="w-5 h-5 text-neon-blue mr-3" />
                            <div>
                              <div className="text-white text-sm font-medium">Live Demo</div>
                              <div className="text-gray-400 text-xs">Try it out</div>
                            </div>
                          </a>
                        )}
                        
                        {submission.videoUrl && (
                          <a
                            href={submission.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-neon-purple transition-colors"
                          >
                            <Video className="w-5 h-5 text-neon-purple mr-3" />
                            <div>
                              <div className="text-white text-sm font-medium">Demo Video</div>
                              <div className="text-gray-400 text-xs">Watch presentation</div>
                            </div>
                          </a>
                        )}
                      </div>

                      {/* Documents */}
                      {submission.documents.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Documents</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {submission.documents.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-2 bg-gray-900/50 rounded border border-gray-800"
                              >
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <div className="text-white text-sm">{doc.name}</div>
                                    <div className="text-gray-500 text-xs">{formatFileSize(doc.size)}</div>
                                  </div>
                                </div>
                                <div className="flex space-x-1">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Stats */}
                      {submission.scores.length > 0 && (
                        <div className="bg-gray-900/50 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Reviewed by {submission.scores.length} judges</span>
                            <span className="text-neon-green font-medium">
                              {calculateAverageScore(submission.scores)}% average score
                            </span>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-6">
              {submissions.filter(s => s.scores.length > 0).length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-orbitron font-bold text-gray-400 mb-2">
                    No feedback yet
                  </h3>
                  <p className="text-gray-500">
                    Feedback will appear here once judges review your submissions
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {submissions
                    .filter(s => s.scores.length > 0)
                    .map((submission) => (
                      <Card key={submission.id} roleColor="green">
                        <div className="mb-6">
                          <h3 className="text-xl font-orbitron font-bold text-white mb-2">
                            {submission.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>Average Score: {calculateAverageScore(submission.scores)}%</span>
                            <span>{submission.scores.length} judges reviewed</span>
                          </div>
                        </div>

                        <div className="space-y-6">
                          {submission.scores.map((score, index) => (
                            <div key={index} className="border border-gray-800 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-white">{score.judgeName}</h4>
                                <span className="text-sm text-gray-400">
                                  {score.submittedAt.toLocaleDateString()}
                                </span>
                              </div>

                              {/* Criteria Scores */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {score.criteria.map((criteria, criteriaIndex) => (
                                  <div key={criteriaIndex} className="bg-gray-900/50 p-3 rounded">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-white font-medium">{criteria.criteriaName}</span>
                                      <span className="text-neon-green font-bold">
                                        {criteria.score}/{criteria.maxScore}
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                                      <div
                                        className="bg-neon-green h-2 rounded-full"
                                        style={{ width: `${(criteria.score / criteria.maxScore) * 100}%` }}
                                      />
                                    </div>
                                    {criteria.feedback && (
                                      <p className="text-gray-400 text-sm">{criteria.feedback}</p>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Overall Feedback */}
                              <div className="bg-gray-900/30 p-4 rounded-lg">
                                <h5 className="text-white font-medium mb-2">Overall Feedback</h5>
                                <p className="text-gray-300 text-sm">{score.overallFeedback}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* General Feedback */}
                        {submission.feedback.length > 0 && (
                          <div className="mt-6 bg-gray-900/30 p-4 rounded-lg">
                            <h4 className="text-white font-medium mb-3">Additional Feedback</h4>
                            <ul className="space-y-2">
                              {submission.feedback.map((feedback, index) => (
                                <li key={index} className="text-gray-300 text-sm flex items-start">
                                  <span className="text-neon-green mr-2">•</span>
                                  {feedback}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Card>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Submission Modal */}
      <Modal
        isOpen={showSubmissionModal}
        onClose={() => {
          setShowSubmissionModal(false);
          setSelectedSubmission(null);
          setSubmissionData({
            eventId: '',
            roundId: '',
            title: '',
            description: '',
            githubUrl: '',
            demoUrl: '',
            videoUrl: '',
            files: []
          });
          setUploadProgress(0);
        }}
        title={selectedSubmission ? 'Edit Submission' : 'New Submission'}
        size="lg"
        roleColor="green"
      >
        <div className="space-y-6">
          {/* Event Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Event
              </label>
              <select
                value={submissionData.eventId}
                onChange={(e) => setSubmissionData(prev => ({ ...prev, eventId: e.target.value }))}
                className="neon-input w-full px-4 py-2.5 text-white rounded-lg bg-black/90 focus:border-neon-green focus:shadow-[0_0_10px_rgba(0,255,136,0.5)]"
              >
                <option value="">Select Event</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.title}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Round
              </label>
              <select
                value={submissionData.roundId}
                onChange={(e) => setSubmissionData(prev => ({ ...prev, roundId: e.target.value }))}
                className="neon-input w-full px-4 py-2.5 text-white rounded-lg bg-black/90 focus:border-neon-green focus:shadow-[0_0_10px_rgba(0,255,136,0.5)]"
              >
                <option value="">Select Round</option>
                {events
                  .find(e => e.id === submissionData.eventId)
                  ?.rounds.map(round => (
                    <option key={round.id} value={round.id}>{round.name}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Basic Info */}
          <Input
            label="Project Title"
            value={submissionData.title}
            onChange={(e) => setSubmissionData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter your project title"
            required
            roleColor="green"
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Description
            </label>
            <textarea
              value={submissionData.description}
              onChange={(e) => setSubmissionData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your project, its features, and impact..."
              className="neon-input w-full px-4 py-2.5 text-white rounded-lg h-32 resize-none focus:border-neon-green focus:shadow-[0_0_10px_rgba(0,255,136,0.5)]"
              required
            />
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="GitHub Repository"
              value={submissionData.githubUrl}
              onChange={(e) => setSubmissionData(prev => ({ ...prev, githubUrl: e.target.value }))}
              placeholder="https://github.com/..."
              icon={<Github className="w-4 h-4" />}
              roleColor="green"
            />
            
            <Input
              label="Live Demo URL"
              value={submissionData.demoUrl}
              onChange={(e) => setSubmissionData(prev => ({ ...prev, demoUrl: e.target.value }))}
              placeholder="https://your-demo.com"
              icon={<LinkIcon className="w-4 h-4" />}
              roleColor="green"
            />
            
            <Input
              label="Demo Video URL"
              value={submissionData.videoUrl}
              onChange={(e) => setSubmissionData(prev => ({ ...prev, videoUrl: e.target.value }))}
              placeholder="https://youtube.com/..."
              icon={<Video className="w-4 h-4" />}
              roleColor="green"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Documents (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-neon-green transition-colors">
              <input
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id="file-upload"
                accept=".pdf,.md,.txt,.zip"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 mb-1">Click to upload files</p>
                <p className="text-gray-500 text-sm">PDF, Markdown, Text, or ZIP files (max 10MB each)</p>
              </label>
            </div>

            {/* File List */}
            {submissionData.files.length > 0 && (
              <div className="mt-4 space-y-2">
                {submissionData.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-900/50 rounded border border-gray-800">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-white text-sm">{file.name}</div>
                        <div className="text-gray-500 text-xs">{formatFileSize(file.size)}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-neon-green h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowSubmissionModal(false)}
              className="flex-1"
              roleColor="green"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={isLoading}
              className="flex-1"
              disabled={!submissionData.title.trim() || !submissionData.description.trim()}
              roleColor="green"
            >
              {selectedSubmission ? 'Update' : 'Submit'} Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};