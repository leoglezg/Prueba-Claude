import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import EventsList from './pages/EventsList';
import Recommendations from './pages/Recommendations';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [events, setEvents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, recsRes, statsRes] = await Promise.all([
        fetch('/api/events?limit=20'),
        fetch('/api/recommendations?limit=15'),
        fetch('/api/statistics')
      ]);

      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (recsRes.ok) setRecommendations(await recsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeNews = async (newsData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/analyze-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ news: newsData })
      });

      if (response.ok) {
        await fetchData();
        alert('Event analyzed and alert sent!');
      }
    } catch (error) {
      console.error('Error analyzing news:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📊 Market News Analyzer</h1>
        <p>Real-time analysis & portfolio recommendations based on market events</p>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-btn ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentPage('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`nav-btn ${currentPage === 'events' ? 'active' : ''}`}
          onClick={() => setCurrentPage('events')}
        >
          Events
        </button>
        <button
          className={`nav-btn ${currentPage === 'recommendations' ? 'active' : ''}`}
          onClick={() => setCurrentPage('recommendations')}
        >
          Recommendations
        </button>
      </nav>

      <main className="app-main">
        {loading && <div className="loading">Loading...</div>}

        {currentPage === 'dashboard' && (
          <Dashboard
            stats={stats}
            recentEvents={events.slice(0, 5)}
            topRecommendations={recommendations.slice(0, 5)}
            onAnalyzeNews={handleAnalyzeNews}
          />
        )}

        {currentPage === 'events' && (
          <EventsList
            events={events}
            onAnalyzeNews={handleAnalyzeNews}
          />
        )}

        {currentPage === 'recommendations' && (
          <Recommendations recommendations={recommendations} />
        )}
      </main>

      <footer className="app-footer">
        <p>Market News Analyzer • Last updated: {new Date().toLocaleTimeString()}</p>
      </footer>
    </div>
  );
}

export default App;
