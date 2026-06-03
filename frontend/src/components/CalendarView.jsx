import React, { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function CalendarView({ tasks = [], meetings = [] }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Map our internal tasks and meetings to react-big-calendar events
  const events = useMemo(() => {
    const taskEvents = tasks
      .filter((t) => t.dueDate) // Only include tasks with a deadline
      .map((t) => {
        // Due dates usually don't have times, so make it an all-day event or 9 AM - 5 PM
        const startDate = new Date(t.dueDate);
        startDate.setHours(9, 0, 0, 0);
        const endDate = new Date(t.dueDate);
        endDate.setHours(17, 0, 0, 0);

        return {
          id: `task-${t.id || t.key}`,
          title: `Sprint/Task: ${t.title || t.summary}`,
          start: startDate,
          end: endDate,
          allDay: true,
          type: 'TASK',
          status: t.status?.name || t.status,
          resource: t
        };
      });

    const meetingEvents = meetings.map((m) => {
      // m.date is "YYYY-MM-DD", m.time is "14:00" or similar, or it might have a full ISO string.
      // Assuming scheduledAt exists (as we added to backend)
      const startDate = m.scheduledAt ? new Date(m.scheduledAt) : new Date(`${m.date}T${m.time || '10:00'}`);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Assume 1 hr meetings

      return {
        id: `meeting-${m.id}`,
        title: `Meeting: ${m.title || m.topic}`,
        start: startDate,
        end: endDate,
        allDay: false,
        type: 'MEETING',
        resource: m
      };
    });

    return [...taskEvents, ...meetingEvents];
  }, [tasks, meetings]);

  const eventStyleGetter = (event, start, end, isSelected) => {
    let backgroundColor = '#3174ad'; // Default Blue
    let border = 'none';

    if (event.type === 'TASK') {
      if (event.status?.toLowerCase() === 'done') {
        backgroundColor = 'rgba(16, 185, 129, 0.8)'; // Green
      } else if (new Date() > event.end && event.status?.toLowerCase() !== 'done') {
        backgroundColor = 'rgba(239, 68, 68, 0.8)'; // Red (Overdue)
      } else {
        backgroundColor = 'rgba(139, 92, 246, 0.8)'; // Purple (In Progress / Todo)
      }
    } else if (event.type === 'MEETING') {
      backgroundColor = 'rgba(59, 130, 246, 0.8)'; // Blue
    }

    const style = {
      backgroundColor,
      borderRadius: '6px',
      opacity: 0.9,
      color: 'white',
      border: '1px solid rgba(255,255,255,0.1)',
      display: 'block',
      fontWeight: '600',
      fontSize: '12px',
      padding: '2px 4px'
    };
    return { style };
  };

  const selectedEvents = events.filter(e => {
    const s = new Date(e.start); s.setHours(0, 0, 0, 0);
    const end = new Date(e.end); end.setHours(23, 59, 59, 999);
    const d = new Date(selectedDate); d.setHours(12, 0, 0, 0);
    return d >= s && d <= end;
  });

  return (
    <div className="glass-panel" style={{ height: 'calc(100vh - 120px)', padding: '20px', borderRadius: '16px', display: 'flex', gap: '20px' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '16px', color: 'var(--text-main)', fontSize: '24px' }}>Timeline & Deadlines</h2>
        <div style={{ height: '100%', paddingBottom: '40px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%', color: 'var(--text-main)' }}
            eventPropGetter={eventStyleGetter}
            views={['month', 'week', 'day', 'agenda']}
            selectable={true}
            onSelectSlot={(slotInfo) => {
              setSelectedDate(slotInfo.start);
            }}
            onSelectEvent={(event) => {
              setSelectedDate(event.start);
            }}
          />
        </div>
      </div>
      
      {/* Right Side Panel */}
      <div style={{
        width: '320px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        <h3 style={{ color: 'var(--text-main)', marginBottom: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
          Events on {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
          {selectedEvents.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>No events scheduled for this day.</p>
          ) : (
            selectedEvents.map((evt, idx) => (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderLeft: `4px solid ${evt.type === 'TASK' ? (evt.status?.toLowerCase() === 'done' ? '#10b981' : '#8b5cf6') : '#3b82f6'}`,
                padding: '12px',
                borderRadius: '6px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  {evt.type}
                </div>
                <div style={{ color: 'var(--text-main)', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>
                  {evt.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  {evt.allDay ? 'All Day' : `${evt.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${evt.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                </div>
                {evt.status && (
                  <div style={{ marginTop: '8px', display: 'inline-block', padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', color: 'var(--text-main)' }}>
                    Status: {evt.status}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
