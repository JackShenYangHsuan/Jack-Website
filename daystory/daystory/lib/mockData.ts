import { CalendarEvent } from '@/types';

// Mock calendar events for testing
export const getMockEvents = (date: Date): CalendarEvent[] => {
  const dayOfWeek = date.getDay();

  // Weekend events
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return [
      {
        id: '1',
        title: 'Morning Coffee',
        startTime: new Date(date.setHours(9, 0)),
        endTime: new Date(date.setHours(10, 0)),
        location: 'Blue Bottle Coffee, SF',
        description: 'Relaxing weekend coffee'
      },
      {
        id: '2',
        title: 'Hiking at Lands End',
        startTime: new Date(date.setHours(11, 0)),
        endTime: new Date(date.setHours(14, 0)),
        location: 'Lands End Trail, SF',
        description: 'Scenic coastal hike'
      },
      {
        id: '3',
        title: 'Dinner with Friends',
        startTime: new Date(date.setHours(19, 0)),
        endTime: new Date(date.setHours(21, 0)),
        location: 'North Beach, SF',
        description: 'Italian restaurant'
      }
    ];
  }

  // Weekday events
  return [
    {
      id: '1',
      title: 'Morning Standup',
      startTime: new Date(date.setHours(9, 0)),
      endTime: new Date(date.setHours(9, 30)),
      location: 'Zoom',
      description: 'Daily team sync'
    },
    {
      id: '2',
      title: 'Product Strategy Meeting',
      startTime: new Date(date.setHours(10, 0)),
      endTime: new Date(date.setHours(11, 30)),
      location: 'Conference Room A',
      description: 'Q4 planning session'
    },
    {
      id: '3',
      title: 'Lunch with Design Team',
      startTime: new Date(date.setHours(12, 0)),
      endTime: new Date(date.setHours(13, 0)),
        location: 'Salesforce Park',
      description: 'Team lunch'
    },
    {
      id: '4',
      title: 'User Research Interview',
      startTime: new Date(date.setHours(14, 0)),
      endTime: new Date(date.setHours(15, 0)),
      location: 'Zoom',
      description: 'Customer feedback session'
    },
    {
      id: '5',
      title: 'Gym Session',
      startTime: new Date(date.setHours(18, 0)),
      endTime: new Date(date.setHours(19, 0)),
      location: 'Equinox SF',
      description: 'Evening workout'
    }
  ];
};

// Generate mock calendar data for the past 30 days
export const getMockCalendarDays = () => {
  const days = [];
  const today = new Date();

  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);

    days.push({
      date: date.toISOString().split('T')[0],
      eventCount: getMockEvents(new Date(date)).length,
      hasEvents: true
    });
  }

  return days;
};
