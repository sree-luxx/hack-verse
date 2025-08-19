import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { Megaphone, MessageSquare, Plus, X, Send, Calendar, Users } from 'lucide-react';
import { api, hasApiBaseUrl } from '../../lib/api';

type Event = {
  id: string;
  name: string;
  theme: string;
  startAt: string;
  endAt: string;
  _count?: { registrations: number };
};

type Announcement = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  eventId: string;
  createdBy: string;
};

type Question = {
  id: string;
  question: string;
  askedBy: string;
  askedByName: string;
  answer: string;
  answeredBy: string;
  answeredByName: string;
  status: 'pending' | 'answered';
  createdAt: string;
  eventId: string;
};

export const Announcements: React.FC = () => {
  const { user } = useAuth();
  const roleColor = useMemo(() => {
    if (user?.role === 'judge') return 'orange';
    if (user?.role === 'organizer') return 'blue';
    return 'green';
  }, [user?.role]);
  
  // View state
  const [activeView, setActiveView] = useState<'announcements' | 'qa'>('announcements');
  
  // Announcements state
  const [events, setEvents] = useState<Event[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState<string | null>(null); // Event ID for which to show form
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncementsList, setShowAnnouncementsList] = useState(false);
  
  // Q&A state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedEventForQA, setSelectedEventForQA] = useState<Event | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [answeringQuestion, setAnsweringQuestion] = useState<string | null>(null);

  // Load events based on user role
  const loadEvents = async () => {
    try {
      console.log('loadEvents called, hasApiBaseUrl:', hasApiBaseUrl(), 'user role:', user?.role);
      
      if (hasApiBaseUrl()) {
        if (user?.role === 'organizer') {
          // Load organizer's created events
          try {
            console.log('Attempting to fetch events from API...');
            const list = await api.get('/api/events?mine=true');
            console.log('API response:', list);
            if (Array.isArray(list) && list.length > 0) {
              const mappedEvents = list.map((e: any) => ({
                id: String(e.id),
                name: e.name || e.title || 'Untitled Event',
                theme: e.theme || 'General',
                startAt: e.startAt || e.startDate || new Date().toISOString(),
                endAt: e.endAt || e.endDate || new Date().toISOString(),
                _count: { registrations: e._count?.registrations || 0 }
              }));
              console.log('Mapped events:', mappedEvents);
              setEvents(mappedEvents);
              return;
            } else {
              console.log('No events returned from API or empty array');
            }
          } catch (apiError) {
            console.error('API failed, falling back to localStorage:', apiError);
          }
        } else if (user?.role === 'participant') {
          // Load events participant is registered for
          try {
            const registrations = await api.get('/api/registrations');
            if (Array.isArray(registrations)) {
              const eventIds = [...new Set(registrations.map((r: any) => r.eventId))];
              if (eventIds.length > 0) {
                const eventPromises = eventIds.map(id => api.get(`/api/events/${id}`));
                const eventResults = await Promise.all(eventPromises);
                const validEvents = eventResults.filter(e => e && e.id).map((e: any) => ({
                  id: e.id,
                  name: e.name,
                  theme: e.theme,
                  startAt: e.startAt,
                  endAt: e.endAt,
                  _count: { registrations: e._count?.registrations || 0 }
                }));
                setEvents(validEvents);
                return;
              }
            }
          } catch (apiError) {
            console.error('API failed, falling back to localStorage:', apiError);
          }
        }
      }
      
      // Fallback to localStorage
      if (user?.role === 'organizer') {
        const storageKey = `hv_events_${user?.id || 'anon'}`;
        console.log('Checking localStorage with key:', storageKey);
        const storedEvents = JSON.parse(localStorage.getItem(storageKey) || '[]');
        console.log('Stored events from localStorage:', storedEvents);
        if (Array.isArray(storedEvents) && storedEvents.length > 0) {
          const mappedEvents = storedEvents.map((e: any) => ({
            id: String(e.id),
            name: e.title || e.name || 'Untitled Event',
            theme: e.theme || 'General',
            startAt: e.startDate || e.startAt || new Date().toISOString(),
            endAt: e.endDate || e.endAt || new Date().toISOString(),
            _count: { registrations: e.registrations || 0 }
          }));
          console.log('Mapped events from localStorage:', mappedEvents);
          setEvents(mappedEvents);
          return;
        } else {
          console.log('No events found in localStorage');
        }
      }
      
      // If still no events, set empty array
      setEvents([]);
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents([]);
    }
  };

  // Load announcements for an event
  const loadAnnouncements = async (eventId: string) => {
    if (!hasApiBaseUrl()) return;
    
    try {
      const list = await api.get(`/api/announcements?eventId=${encodeURIComponent(eventId)}`);
      if (Array.isArray(list)) {
        setAnnouncements(list);
      }
    } catch (error) {
      console.error('Failed to load announcements:', error);
    }
  };

  // Load questions for an event
  const loadQuestions = async (eventId: string) => {
    if (!hasApiBaseUrl()) return;
    
    try {
      const list = await api.get(`/api/questions?eventId=${encodeURIComponent(eventId)}`);
      if (Array.isArray(list)) {
        setQuestions(list);
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  // Post announcement
  const postAnnouncement = async (eventId: string) => {
    if (!announcementTitle.trim() || !announcementContent.trim()) return;
    
    if (hasApiBaseUrl()) {
      try {
        await api.post('/api/announcements', {
          eventId: eventId,
          title: announcementTitle.trim(),
          message: announcementContent.trim()
        });
        setAnnouncementTitle('');
        setAnnouncementContent('');
        setShowAnnouncementForm(null);
        await loadAnnouncements(eventId);
        return;
      } catch (error) {
        console.error('Failed to post announcement:', error);
      }
    }
    
    // Fallback to localStorage
    const newAnnouncement: Announcement = {
      id: `${Date.now()}`,
      title: announcementTitle.trim(),
      message: announcementContent.trim(),
      createdAt: new Date().toISOString(),
      eventId: eventId,
      createdBy: user?.name || 'Organizer'
    };
    
    const all: Announcement[] = JSON.parse(localStorage.getItem('hv_announcements') || '[]');
    localStorage.setItem('hv_announcements', JSON.stringify([newAnnouncement, ...all]));
    
    setAnnouncementTitle('');
    setAnnouncementContent('');
    setShowAnnouncementForm(null);
    await loadAnnouncements(eventId);
  };

  // Answer question
  const answerQuestion = async (questionId: string) => {
    if (!answerText.trim()) return;
    
    if (hasApiBaseUrl()) {
      try {
        await api.put('/api/questions', {
          id: questionId,
          answer: answerText.trim()
        });
        setAnswerText('');
        setAnsweringQuestion(null);
        if (selectedEventForQA) {
          await loadQuestions(selectedEventForQA.id);
        }
        return;
      } catch (error) {
        console.error('Failed to answer question:', error);
      }
    }
    
    // Fallback to localStorage
    const all: Question[] = JSON.parse(localStorage.getItem('hv_questions') || '[]');
    const updated = all.map(q => 
      q.id === questionId 
        ? { ...q, answer: answerText.trim(), status: 'answered' as const, answeredBy: user?.id || '', answeredByName: user?.name || 'Organizer' }
        : q
    );
    localStorage.setItem('hv_questions', JSON.stringify(updated));
    
    setAnswerText('');
    setAnsweringQuestion(null);
    if (selectedEventForQA) {
      await loadQuestions(selectedEventForQA.id);
    }
  };

  useEffect(() => {
    if (user?.role === 'organizer' || user?.role === 'participant') {
      console.log('Loading events for role:', user?.role);
      loadEvents();
    }
  }, [user?.role]);

  const handleEventSelectForQA = (event: Event) => {
    setSelectedEventForQA(event);
    loadQuestions(event.id);
  };

  const resetAnnouncementView = () => {
    setShowAnnouncementForm(null);
    setShowAnnouncementsList(false);
    setAnnouncementTitle('');
    setAnnouncementContent('');
  };

  const resetQAView = () => {
    setSelectedEventForQA(null);
    setAnsweringQuestion(null);
    setAnswerText('');
  };

  // For participants, show a simplified view
  if (user?.role === 'participant') {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-orbitron font-bold">Announcements & Q&A</h1>
        
        {/* View Toggle for Participants */}
        <div className="flex space-x-2">
          <Button
            variant={activeView === 'announcements' ? 'primary' : 'outline'}
            onClick={() => setActiveView('announcements')}
            roleColor={roleColor}
          >
            <Megaphone className="w-4 h-4 mr-2" />
            Announcements
          </Button>
          <Button
            variant={activeView === 'qa' ? 'primary' : 'outline'}
            onClick={() => setActiveView('qa')}
            roleColor={roleColor}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Ask Questions
          </Button>
        </div>

        {/* Participant Announcements View */}
        {activeView === 'announcements' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Event Announcements</h2>
            {events.length === 0 ? (
              <Card roleColor={roleColor}>
                <p className="text-gray-400">No events registered yet. Register for events to see announcements.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <Card key={event.id} roleColor={roleColor}>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">{event.name}</h3>
                      <p className="text-neon-blue text-sm">{event.theme}</p>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(event.startAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {event._count?.registrations || 0}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Announcements from organizers will appear here.
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Participant Q&A View */}
        {activeView === 'qa' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Ask Questions</h2>
            {events.length === 0 ? (
              <Card roleColor={roleColor}>
                <p className="text-gray-400">No events registered yet. Register for events to ask questions.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <Card key={event.id} roleColor={roleColor}>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">{event.name}</h3>
                      <p className="text-neon-blue text-sm">{event.theme}</p>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(event.startAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {event._count?.registrations || 0}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        You can ask questions to organizers about this event.
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // For judges, show a simplified view
  if (user?.role === 'judge') {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Announcements & Q&A</h1>

      <Card roleColor={roleColor}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Event Updates</h2>
            <p className="text-gray-400">Announcements and updates for your assigned events will appear here.</p>
        </div>
      </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">Announcements & Q&A</h1>

      {/* View Toggle */}
      <div className="flex space-x-2">
        <Button
          variant={activeView === 'announcements' ? 'primary' : 'outline'}
          onClick={() => {
            setActiveView('announcements');
            resetAnnouncementView();
          }}
          roleColor={roleColor}
        >
          <Megaphone className="w-4 h-4 mr-2" />
          Announcements
        </Button>
        <Button
          variant={activeView === 'qa' ? 'primary' : 'outline'}
          onClick={() => {
            setActiveView('qa');
            resetQAView();
          }}
          roleColor={roleColor}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Q&A
        </Button>
      </div>

      {/* Announcements View */}
      {activeView === 'announcements' && (
        <div className="space-y-6">
          {/* Events List */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Hackathons</h2>
                         <Button
               onClick={async () => {
                 setShowAnnouncementsList(true);
                 // Load announcements for all events when button is clicked
                 if (events.length > 0) {
                   const allAnnouncements: Announcement[] = [];
                   for (const event of events) {
                     try {
                       if (hasApiBaseUrl()) {
                         const list = await api.get(`/api/announcements?eventId=${encodeURIComponent(event.id)}`);
                         if (Array.isArray(list)) {
                           allAnnouncements.push(...list);
                         }
                       } else {
                         // Fallback to localStorage
                         const stored = JSON.parse(localStorage.getItem('hv_announcements') || '[]');
                         const eventAnnouncements = stored.filter((a: any) => a.eventId === event.id);
                         allAnnouncements.push(...eventAnnouncements);
                       }
                     } catch (error) {
                       console.error(`Failed to load announcements for event ${event.id}:`, error);
                     }
                   }
                   setAnnouncements(allAnnouncements);
                 }
               }}
               variant="outline"
               roleColor={roleColor}
             >
               Announcements Made
             </Button>
          </div>
          
          

          {events.length === 0 ? (
        <Card roleColor={roleColor}>
              <p className="text-gray-400">No hackathons created yet. Create events first.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <Card key={event.id} roleColor={roleColor} className="space-y-3">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">{event.name}</h3>
                    <p className="text-neon-blue text-sm">{event.theme}</p>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(event.startAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {event._count?.registrations || 0}
                      </div>
                    </div>
                    
                    {/* Add Announcement Button */}
                    <Button
                      onClick={() => {
                        if (showAnnouncementForm === event.id) {
                          setShowAnnouncementForm(null);
                          setAnnouncementTitle('');
                          setAnnouncementContent('');
                        } else {
                          setShowAnnouncementForm(event.id);
                          setAnnouncementTitle('');
                          setAnnouncementContent('');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      roleColor={roleColor}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {showAnnouncementForm === event.id ? 'Cancel' : 'Add Announcement'}
                    </Button>
                  </div>
                  
                  {/* Inline Announcement Form */}
                  {showAnnouncementForm === event.id && (
                    <div className="border-t border-gray-700 pt-3 space-y-3">
                      <h4 className="text-sm font-semibold text-neon-blue">Add Content for Your Announcement</h4>
                      <Input
                        label="Title"
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        placeholder="Announcement title"
                        roleColor={roleColor}
                      />
                      <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                        <textarea
                          className="neon-input w-full px-3 py-2 text-white rounded-lg h-24 text-sm"
                          value={announcementContent}
                          onChange={(e) => setAnnouncementContent(e.target.value)}
                          placeholder="Write your announcement..."
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowAnnouncementForm(null);
                            setAnnouncementTitle('');
                            setAnnouncementContent('');
                          }}
                          roleColor={roleColor}
                        >
                          Discard
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => postAnnouncement(event.id)}
                          roleColor={roleColor}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Announcements List */}
          {showAnnouncementsList && (
            <Card roleColor={roleColor}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                                     <h3 className="text-lg font-semibold">All Announcements Made</h3>
                  <Button
                    variant="outline"
                    onClick={() => setShowAnnouncementsList(false)}
                    roleColor={roleColor}
                  >
                    Close
                  </Button>
                </div>
                {announcements.length === 0 ? (
                  <p className="text-gray-400">No announcements made yet.</p>
                ) : (
                                       <div className="space-y-3">
                       {announcements.map((ann) => {
                         const event = events.find(e => e.id === ann.eventId);
                         return (
                           <div key={ann.id} className="border border-gray-700 rounded-lg p-4">
                             <div className="flex items-center justify-between mb-2">
                               <div>
                                 <h4 className="font-semibold">{ann.title}</h4>
                                 {event && (
                                   <p className="text-xs text-neon-blue">Event: {event.name}</p>
                                 )}
                               </div>
                               <span className="text-xs text-gray-500">
                                 {new Date(ann.createdAt).toLocaleString()}
                               </span>
                             </div>
                             <p className="text-gray-300 whitespace-pre-wrap">{ann.message}</p>
                           </div>
                         );
                       })}
                     </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Q&A View */}
      {activeView === 'qa' && (
        <div className="space-y-6">
          {!selectedEventForQA ? (
            <>
              {/* Events List for Q&A */}
              <h2 className="text-xl font-semibold">Select Hackathon for Q&A</h2>
              {events.length === 0 ? (
                <Card roleColor={roleColor}>
                  <p className="text-gray-400">No hackathons created yet. Create events first.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((event) => (
                    <div 
                      key={event.id} 
                      className="cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => handleEventSelectForQA(event)}
                    >
                      <Card roleColor={roleColor}>
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold">{event.name}</h3>
                          <p className="text-neon-blue text-sm">{event.theme}</p>
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(event.startAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {event._count?.registrations || 0}
            </div>
            </div>
          </div>
        </Card>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Selected Event Q&A View */}
              <div className="flex items-center justify-between">
                <div>
                  <Button variant="outline" onClick={resetQAView} roleColor={roleColor}>
                    <X className="w-4 h-4 mr-2" />
                    Back to Events
                  </Button>
                  <h2 className="text-xl font-semibold mt-2">Q&A for {selectedEventForQA.name}</h2>
                </div>
              </div>

              {/* Questions List */}
              <Card roleColor={roleColor}>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Participant Questions</h3>
                  {questions.length === 0 ? (
                    <p className="text-gray-400">No questions from participants yet.</p>
                  ) : (
      <div className="space-y-4">
                      {questions.map((question) => (
                        <div key={question.id} className="border border-gray-700 rounded-lg p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Asked by {question.askedByName}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(question.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-white">{question.question}</p>
                            
                            {question.status === 'answered' ? (
                              <div className="bg-gray-800 rounded-lg p-3">
                                <div className="text-sm text-gray-500 mb-1">Answered by {question.answeredByName}</div>
                                <p className="text-gray-300">{question.answer}</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {answeringQuestion === question.id ? (
                                  <div className="space-y-2">
                                    <textarea
                                      className="neon-input w-full px-3 py-2 text-white rounded-lg h-20"
                                      value={answerText}
                                      onChange={(e) => setAnswerText(e.target.value)}
                                      placeholder="Write your answer..."
                                    />
                                    <div className="flex space-x-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setAnsweringQuestion(null);
                                          setAnswerText('');
                                        }}
                                        roleColor={roleColor}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => answerQuestion(question.id)}
                                        roleColor={roleColor}
                                      >
                                        <Send className="w-4 h-4 mr-2" />
                                        Answer
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => setAnsweringQuestion(question.id)}
                                    roleColor={roleColor}
                                  >
                                    Answer Question
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
            </div>
        ))}
      </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Announcements;


