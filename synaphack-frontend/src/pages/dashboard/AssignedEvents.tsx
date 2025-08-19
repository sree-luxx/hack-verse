import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Users, MapPin, Globe, Award, Clock } from 'lucide-react';
import { api, hasApiBaseUrl } from '../../lib/api';

type AssignedEvent = {
  assignmentId: string;
  assignedAt: string;
  event: {
    id: string;
    name: string;
    theme: string;
    description: string;
    startAt: string;
    endAt: string;
    location: string;
    online: boolean;
    organizer: {
      id: string;
      name: string;
      email: string;
    };
    _count: {
      registrations: number;
      teams: number;
    };
  };
};

export const AssignedEvents: React.FC = () => {
  const { user } = useAuth();
  const roleColor = useMemo(() => 'orange' as const, []);
  
  const [assignedEvents, setAssignedEvents] = useState<AssignedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAssignedEvents = async () => {
    if (!hasApiBaseUrl()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/api/judges/my-assignments');
      if (Array.isArray(response)) {
        setAssignedEvents(response);
      }
    } catch (error) {
      console.error('Failed to load assigned events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'judge') {
      loadAssignedEvents();
    }
  }, [user?.role]);

  if (user?.role !== 'judge') {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-orbitron font-bold">Assigned Events</h1>
        <Card roleColor={roleColor}>
          <div className="text-center py-8">
            <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Access Denied</p>
            <p className="text-sm text-gray-500 mt-1">This page is only available for judges</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-orbitron font-bold">My Assigned Events</h1>
      
      {loading ? (
        <Card roleColor={roleColor}>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-orange mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading your assignments...</p>
          </div>
        </Card>
      ) : assignedEvents.length === 0 ? (
        <Card roleColor={roleColor}>
          <div className="text-center py-8">
            <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No Events Assigned</p>
            <p className="text-sm text-gray-500 mt-1">You haven't been assigned to any events yet</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Event Assignments</h2>
            <Button 
              onClick={loadAssignedEvents} 
              variant="outline" 
              size="sm"
              roleColor={roleColor}
            >
              Refresh
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {assignedEvents.map((assignment) => (
              <Card key={assignment.assignmentId} roleColor={roleColor}>
                <div className="space-y-4">
                  {/* Event Header */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">{assignment.event.name}</h3>
                    <p className="text-neon-orange text-sm font-medium">{assignment.event.theme}</p>
                    {assignment.event.description && (
                      <p className="text-gray-300 text-sm line-clamp-2">{assignment.event.description}</p>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">Event Date:</span>
                      <span className="text-white">
                        {new Date(assignment.event.startAt).toLocaleDateString()} - {new Date(assignment.event.endAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      {assignment.event.online ? (
                        <Globe className="w-4 h-4 text-gray-400" />
                      ) : (
                        <MapPin className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-gray-400">Location:</span>
                      <span className="text-white">
                        {assignment.event.online ? 'Online Event' : assignment.event.location || 'TBD'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">Participants:</span>
                      <span className="text-white">{assignment.event._count.registrations}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <Award className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">Teams:</span>
                      <span className="text-white">{assignment.event._count.teams}</span>
                    </div>
                  </div>

                  {/* Assignment Info */}
                  <div className="pt-3 border-t border-gray-700">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Assigned by: {assignment.event.organizer.name || assignment.event.organizer.email}</span>
                      <span>Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <Button 
                      className="flex-1" 
                      roleColor={roleColor}
                      onClick={() => {
                        // Navigate to project reviews for this event
                        window.location.href = `/dashboard/reviews?eventId=${assignment.event.id}`;
                      }}
                    >
                      <Award className="w-4 h-4 mr-2" />
                      Review Projects
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      roleColor={roleColor}
                      onClick={() => {
                        // Navigate to announcements for this event
                        window.location.href = `/dashboard/announcements?eventId=${assignment.event.id}`;
                      }}
                    >
                      View Updates
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedEvents;


