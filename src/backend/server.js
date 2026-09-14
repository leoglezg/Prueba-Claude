import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import config from '../config/index.js';
import { newsProcessor } from './services/newsProcessor.js';
import { eventAnalyzer } from '../ml/analyzers/eventAnalyzer.js';
import { patternAnalyzer } from '../ml/patterns/patternAnalyzer.js';
import { scenarioEngine } from '../ml/scenarios/scenarioEngine.js';
import { recommendationEngine } from './services/recommendationEngine.js';
import { alertEngine } from './services/alertEngine.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.post('/api/analyze-event', async (req, res) => {
  try {
    const { news } = req.body;

    if (!news || !news.title) {
      return res.status(400).json({ error: 'Invalid news data' });
    }

    const processed = await newsProcessor.processNews(news);
    const isDuplicate = await newsProcessor.isDuplicate(processed.hash);

    if (isDuplicate) {
      return res.status(409).json({ error: 'Duplicate news already processed' });
    }

    const eventType = newsProcessor.classifyEventType(processed.title + ' ' + processed.description);
    const entities = newsProcessor.extractEntities(processed.title);
    const assets = newsProcessor.extractAssets(processed.title, entities);

    const eventId = await newsProcessor.saveProcessedNews({
      ...processed,
      event_type: eventType,
      affected_assets: assets
    });

    const analyzed = await eventAnalyzer.analyzeEvent(eventId, {
      title: processed.title,
      description: processed.description,
      content: processed.content,
      event_type: eventType,
      confidence: 0.8
    });

    const event = {
      id: eventId,
      ...analyzed
    };

    const similarPatterns = await patternAnalyzer.findSimilarHistoricalEvents(event);
    const scenarios = await scenarioEngine.generateScenarios(eventId, event, similarPatterns);
    const recommendations = await recommendationEngine.generateRecommendations(
      eventId,
      event,
      scenarios
    );

    await alertEngine.sendAlert(eventId, event, recommendations);

    res.json({
      success: true,
      event: {
        id: eventId,
        title: processed.title,
        sentiment: analyzed.sentiment,
        type: eventType,
        magnitude: analyzed.magnitude,
        affectedAssets: assets
      },
      patterns: similarPatterns.slice(0, 3),
      scenarios: scenarios.slice(0, 3),
      recommendations: recommendations.slice(0, 5),
      alert_sent: true
    });
  } catch (error) {
    console.error('Error analyzing event:', error);
    res.status(500).json({ error: 'Failed to analyze event', details: error.message });
  }
});

app.get('/api/recommendations', async (req, res) => {
  try {
    const { limit = 10, asset = null } = req.query;

    let query_text = `SELECT * FROM recommendations WHERE expires_at > NOW() ORDER BY created_at DESC LIMIT $1`;
    const params = [limit];

    if (asset) {
      query_text = `SELECT * FROM recommendations WHERE asset = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT $2`;
      params.unshift(asset);
    }

    const { query } = await import('../database/connection.js');
    const result = await query(query_text, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const { query } = await import('../database/connection.js');

    const result = await query(
      `SELECT * FROM events ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/api/statistics', async (req, res) => {
  try {
    const { query } = await import('../database/connection.js');

    const stats = await query(
      `SELECT
        COUNT(*) as total_events,
        AVG(sentiment_score) as avg_sentiment,
        AVG(magnitude) as avg_magnitude,
        COUNT(DISTINCT event_type) as event_types
       FROM events WHERE created_at > NOW() - INTERVAL '30 days'`
    );

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

const PORT = config.app.port;
app.listen(PORT, () => {
  console.log(`Market News Analyzer running on port ${PORT}`);
  console.log(`Environment: ${config.app.env}`);
});
