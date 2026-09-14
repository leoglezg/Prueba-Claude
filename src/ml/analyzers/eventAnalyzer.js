import natural from 'natural';
import { query } from '../../database/connection.js';

const { SentimentAnalyzer, PorterStemmer } = natural;
const analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');

export class EventAnalyzer {
  constructor() {
    this.sentimentCache = new Map();
    this.eventMagnitudes = {
      'earnings': { min: 4, max: 8 },
      'merger_acquisition': { min: 7, max: 10 },
      'regulatory': { min: 3, max: 9 },
      'economic': { min: 5, max: 10 },
      'product': { min: 2, max: 6 },
      'leadership': { min: 3, max: 7 },
      'bankruptcy': { min: 8, max: 10 },
      'lawsuit': { min: 4, max: 8 },
      'dividend': { min: 1, max: 3 },
      'market_movement': { min: 2, max: 8 }
    };
  }

  analyzeSentiment(text) {
    try {
      const tokens = text.toLowerCase().split(/\s+/);
      const score = analyzer.getSentiment(tokens);

      const confidence = Math.abs(score) / 5;

      let label = 'neutral';
      if (score > 0.5) label = 'positive';
      else if (score < -0.5) label = 'negative';

      return {
        score: Math.max(-1, Math.min(1, score / 5)),
        label,
        confidence: Math.min(1, confidence),
        raw_score: score
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return { score: 0, label: 'neutral', confidence: 0 };
    }
  }

  determineMagnitude(eventType, sentiment, text) {
    const range = this.eventMagnitudes[eventType] || { min: 3, max: 7 };
    const baseValue = (range.min + range.max) / 2;

    const intensityModifier = this.getIntensityModifier(text);
    const sentimentModifier = Math.abs(sentiment);

    let magnitude = baseValue + (intensityModifier * 2) + (sentimentModifier * 2);
    magnitude = Math.max(1, Math.min(10, Math.round(magnitude)));

    return magnitude;
  }

  getIntensityModifier(text) {
    const intensifiers = ['surge', 'soar', 'plunge', 'crash', 'massive', 'significant', 'dramatic'];
    const count = intensifiers.filter(word => text.toLowerCase().includes(word)).length;
    return Math.min(2, count * 0.5);
  }

  async analyzeEvent(eventId, eventData) {
    try {
      const combinedText = `${eventData.title} ${eventData.description} ${eventData.content}`;

      const sentiment = this.analyzeSentiment(combinedText);
      const eventType = eventData.event_type || 'other';
      const magnitude = this.determineMagnitude(eventType, sentiment.score, combinedText);

      const affectedAssets = this.extractAffectedAssets(combinedText);

      await query(
        `UPDATE events
         SET sentiment_score = $1,
             sentiment_label = $2,
             confidence = $3,
             event_type = $4,
             magnitude = $5,
             affected_assets = $6,
             processed_at = NOW()
         WHERE id = $7`,
        [
          sentiment.score,
          sentiment.label,
          sentiment.confidence,
          eventType,
          magnitude,
          affectedAssets,
          eventId
        ]
      );

      return {
        eventId,
        sentiment,
        eventType,
        magnitude,
        affectedAssets,
        processed: true
      };
    } catch (error) {
      console.error('Error analyzing event:', error);
      throw error;
    }
  }

  extractAffectedAssets(text) {
    const commonSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'SPY', 'QQQ', 'IWM', 'EEM', 'GLD', 'TLT'];
    const regex = /\b([A-Z]{1,5})\b/g;
    const matches = text.match(regex) || [];

    return [...new Set(matches.filter(m => commonSymbols.includes(m)))];
  }
}

export default new EventAnalyzer();
