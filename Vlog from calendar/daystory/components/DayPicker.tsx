'use client';

import { useState, useEffect } from 'react';
import { getMockCalendarDays } from '@/lib/mockData';

interface DayPickerProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  selectedDates?: string[];
  onSelectDates?: (dates: string[]) => void;
  multiSelect?: boolean;
}

interface DayWithEvents {
  date: string;
  hasEvents: boolean;
  eventCount?: number;
  events?: Array<{
    title: string;
    startTime: string;
    endTime: string;
  }>;
}

export default function DayPicker({
  selectedDate,
  onSelectDate,
  selectedDates = [],
  onSelectDates,
  multiSelect = false
}: DayPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [daysWithEvents, setDaysWithEvents] = useState<DayWithEvents[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  useEffect(() => {
    fetchCalendarDays();
  }, [currentMonth]);

  const fetchCalendarDays = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

      const response = await fetch(
        `/api/calendar/days?month=${encodeURIComponent(startOfMonth.toISOString())}`
      );

      if (response.ok) {
        const data = await response.json();
        setDaysWithEvents(data.days || []);
      } else {
        // Fallback to mock data
        const mockDays = getMockCalendarDays();
        setDaysWithEvents(mockDays);
      }
    } catch (error) {
      console.error('Error fetching calendar days:', error);
      // Fallback to mock data
      const mockDays = getMockCalendarDays();
      setDaysWithEvents(mockDays);
    } finally {
      setLoading(false);
    }
  };

  const handleDayClick = (date: string) => {
    if (multiSelect && onSelectDates) {
      if (selectedDates.includes(date)) {
        // Remove if already selected
        onSelectDates(selectedDates.filter(d => d !== date));
      } else {
        // Add to selection
        onSelectDates([...selectedDates, date]);
      }
    } else {
      onSelectDate(date);
    }
  };

  const isSelected = (date: string) => {
    if (multiSelect) {
      return selectedDates.includes(date);
    }
    return selectedDate === date;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-900 mb-1.5 text-center">
          {multiSelect ? 'Select days from your calendar' : 'Select a day from your calendar'}
        </h2>
        <p className="text-sm text-gray-600 text-center">
          {multiSelect
            ? 'Pick one or more days to create your DayStory'
            : 'Choose a day to turn into a Pixar-style video'}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => {
              const prev = new Date(currentMonth);
              prev.setMonth(prev.getMonth() - 1);
              setCurrentMonth(prev);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Previous month"
          >
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h3 className="text-lg font-bold text-gray-900">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>

          <button
            onClick={() => {
              const next = new Date(currentMonth);
              next.setMonth(next.getMonth() + 1);
              setCurrentMonth(next);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Next month"
          >
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mx-auto max-w-[18rem]">
          {/* Day headers */}
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={`${day}-${index}`} className="text-center py-1.5">
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">{day}</span>
            </div>
          ))}

          {/* Calendar days */}
          {loading ? (
            <div className="col-span-7 text-center py-6 text-gray-500 text-sm">Loading calendar...</div>
          ) : (
            daysWithEvents.slice(0, 35).map((day) => {
              const selected = isSelected(day.date);
              const hasEvents = day.hasEvents;
              const eventCount = day.eventCount || 0;

              return (
                <div
                  key={day.date}
                  className="relative"
                  onMouseEnter={() => setHoveredDay(day.date)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  <button
                    onClick={() => handleDayClick(day.date)}
                    disabled={!hasEvents}
                    className={`
                      w-full aspect-square flex flex-col items-center justify-center rounded-full
                      transition-all duration-200 relative group
                      ${selected
                        ? 'bg-gray-900 text-white font-semibold shadow-md'
                        : hasEvents
                        ? 'hover:border-2 hover:border-gray-900 text-gray-900 hover:font-semibold'
                        : 'text-gray-300 cursor-not-allowed line-through'
                      }
                    `}
                  >
                    <span className={`text-sm ${selected ? 'font-bold' : 'font-medium'}`}>
                      {new Date(day.date).getDate()}
                    </span>

                    {hasEvents && !selected && (
                      <div className="flex items-center gap-0.5 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
                        {eventCount > 1 && (
                          <span className="text-[10px] font-medium text-gray-600">{eventCount}</span>
                        )}
                      </div>
                    )}

                    {selected && multiSelect && selectedDates.length > 1 && (
                      <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {selectedDates.indexOf(day.date) + 1}
                      </div>
                    )}
                  </button>

                  {/* Tooltip showing events */}
                  {hoveredDay === day.date && hasEvents && day.events && (
                    <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 w-64 bg-white border-2 border-gray-900 text-gray-900 text-xs rounded-xl shadow-2xl p-2.5 pointer-events-none">
                      <div className="font-bold mb-1.5 text-gray-900">{eventCount} {eventCount === 1 ? 'event' : 'events'} on {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {day.events.slice(0, 5).map((event, idx) => (
                          <div key={idx} className="border-l-2 border-rose-500 pl-2">
                            <div className="font-semibold text-gray-900 text-[11px]">{event.title}</div>
                            <div className="text-[10px] text-gray-600 mt-0.5">
                              {new Date(event.startTime).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        ))}
                        {eventCount > 5 && (
                          <div className="text-gray-500 text-[10px] pl-2">+{eventCount - 5} more events</div>
                        )}
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-900"></div>
              <span>Has events</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">1</span>
              </div>
              <span>Selected</span>
            </div>
          </div>

          {/* Selected days count for multi-select */}
          {multiSelect && selectedDates.length > 0 && (
            <p className="text-center text-xs text-gray-600 mt-3">
              <span className="font-semibold text-gray-900">{selectedDates.length}</span> {selectedDates.length === 1 ? 'day' : 'days'} selected
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
