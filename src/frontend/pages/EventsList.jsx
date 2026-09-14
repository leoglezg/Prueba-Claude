import React from 'react';

function EventsList({ events, onAnalyzeNews }) {
  return (
    <div className="events-page">
      <h1>📰 All Events</h1>
      <div className="events-table-container">
        <table className="events-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Sentiment</th>
              <th>Magnitude</th>
              <th>Confidence</th>
              <th>Assets</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className={`event-row ${event.sentiment_label}`}>
                <td className="event-title">{event.title}</td>
                <td>{event.event_type}</td>
                <td>
                  <span className={`sentiment-badge ${event.sentiment_label}`}>
                    {event.sentiment_label}
                  </span>
                </td>
                <td>{event.magnitude}/10</td>
                <td>{((event.confidence || 0) * 100).toFixed(0)}%</td>
                <td>
                  {event.affected_assets?.length > 0 ? event.affected_assets.join(', ') : '-'}
                </td>
                <td>{new Date(event.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EventsList;
