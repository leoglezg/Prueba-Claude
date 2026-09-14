import React, { useState } from 'react';

function Dashboard({ stats, recentEvents, topRecommendations, onAnalyzeNews }) {
  const [newsInput, setNewsInput] = useState({
    title: '',
    description: '',
    content: '',
    source: { name: 'Manual Entry' },
    publishedAt: new Date().toISOString()
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAnalyzeNews(newsInput);
    setNewsInput({ title: '', description: '', content: '', source: { name: 'Manual Entry' }, publishedAt: new Date().toISOString() });
  };

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        {/* Stats Cards */}
        <section className="stats-section">
          <h2>📈 Statistics (Last 30 Days)</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats?.total_events || 0}</div>
              <div className="stat-label">Total Events</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.avg_sentiment ? (stats.avg_sentiment * 100).toFixed(0) : 0}%</div>
              <div className="stat-label">Avg Sentiment</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.avg_magnitude ? stats.avg_magnitude.toFixed(1) : 0}/10</div>
              <div className="stat-label">Avg Magnitude</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats?.event_types || 0}</div>
              <div className="stat-label">Event Types</div>
            </div>
          </div>
        </section>

        {/* News Analyzer Form */}
        <section className="analyzer-section">
          <h2>🚀 Quick News Analyzer</h2>
          <form onSubmit={handleSubmit} className="news-form">
            <input
              type="text"
              placeholder="News Title"
              value={newsInput.title}
              onChange={(e) => setNewsInput({ ...newsInput, title: e.target.value })}
              required
            />
            <textarea
              placeholder="Description"
              value={newsInput.description}
              onChange={(e) => setNewsInput({ ...newsInput, description: e.target.value })}
            />
            <textarea
              placeholder="Full Content"
              value={newsInput.content}
              onChange={(e) => setNewsInput({ ...newsInput, content: e.target.value })}
            />
            <button type="submit" className="btn-primary">Analyze & Get Recommendations</button>
          </form>
        </section>

        {/* Recent Events */}
        <section className="events-section">
          <h2>📰 Recent Events</h2>
          <div className="events-list">
            {recentEvents.map((event) => (
              <div key={event.id} className="event-card">
                <div className="event-header">
                  <h3>{event.title}</h3>
                  <span className={`sentiment-badge ${event.sentiment_label}`}>
                    {event.sentiment_label}
                  </span>
                </div>
                <div className="event-info">
                  <span>Type: {event.event_type}</span>
                  <span>Magnitude: {event.magnitude}/10</span>
                  <span>Confidence: {(event.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Recommendations */}
        <section className="recommendations-section">
          <h2>💡 Top Recommendations</h2>
          <div className="recommendations-list">
            {topRecommendations.map((rec) => (
              <div key={rec.id} className={`recommendation-card ${rec.action}`}>
                <div className="rec-header">
                  <h3>{rec.asset}</h3>
                  <span className={`action-badge ${rec.action}`}>{rec.action}</span>
                </div>
                <div className="rec-info">
                  <p>Confidence: {(rec.confidence * 100).toFixed(0)}%</p>
                  <p>Expected Impact: {rec.expected_impact.toFixed(2)}%</p>
                  <p>Risk: {rec.risk_level}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
