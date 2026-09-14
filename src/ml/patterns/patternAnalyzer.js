import { query } from '../../database/connection.js';
import config from '../../config/index.js';

export class PatternAnalyzer {
  constructor() {
    this.similarityThreshold = config.ml.similarityThreshold;
    this.minHistoricalEvents = config.ml.minHistoricalEvents;
  }

  async findSimilarHistoricalEvents(event) {
    try {
      const signature = this.createEventSignature(event);

      const patterns = await query(
        `SELECT * FROM historical_patterns
         WHERE event_type = $1
         AND ABS(sentiment_score - $2) < 0.3
         AND magnitude BETWEEN $3 AND $4
         ORDER BY occurrences DESC, updated_at DESC
         LIMIT 10`,
        [
          event.event_type,
          event.sentiment_score,
          event.magnitude - 2,
          event.magnitude + 2
        ]
      );

      const similar = patterns.rows.map(pattern => ({
        ...pattern,
        similarity: this.calculateSimilarity(signature, pattern.event_signature)
      })).filter(p => p.similarity >= this.similarityThreshold);

      return similar;
    } catch (error) {
      console.error('Error finding similar patterns:', error);
      return [];
    }
  }

  createEventSignature(event) {
    return {
      event_type: event.event_type,
      sentiment_score: event.sentiment_score,
      sentiment_label: event.sentiment_label,
      magnitude: event.magnitude,
      affected_assets: event.affected_assets || [],
      keywords: this.extractKeywords(event.title, event.description)
    };
  }

  extractKeywords(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 3);
    const stopWords = new Set(['that', 'this', 'from', 'with', 'have', 'been', 'were', 'than']);

    return [...new Set(words.filter(w => !stopWords.has(w)))].slice(0, 10);
  }

  calculateSimilarity(sig1, sig2) {
    let score = 0;

    if (sig1.event_type === sig2.event_type) score += 0.3;
    score += (1 - Math.abs(sig1.sentiment_score - sig2.sentiment_score)) * 0.2;
    score += (1 - Math.abs(sig1.magnitude - sig2.magnitude) / 10) * 0.2;

    const assetOverlap = sig1.affected_assets.filter(a => sig2.affected_assets.includes(a)).length;
    const assetScore = sig1.affected_assets.length > 0
      ? assetOverlap / Math.max(sig1.affected_assets.length, sig2.affected_assets.length)
      : 0;
    score += assetScore * 0.15;

    const keywordOverlap = sig1.keywords.filter(k => sig2.keywords.includes(k)).length;
    const keywordScore = sig1.keywords.length > 0
      ? keywordOverlap / Math.max(sig1.keywords.length, sig2.keywords.length)
      : 0;
    score += keywordScore * 0.15;

    return Math.min(1, score);
  }

  async analyzeMarketReactions(historicalPatterns) {
    const reactions = {
      avg_return_1d: 0,
      avg_return_7d: 0,
      avg_return_30d: 0,
      volatility_change: 0,
      by_asset: {}
    };

    if (historicalPatterns.length === 0) {
      return reactions;
    }

    historicalPatterns.forEach(pattern => {
      reactions.avg_return_1d += pattern.market_reactions?.return_1d || 0;
      reactions.avg_return_7d += pattern.market_reactions?.return_7d || 0;
      reactions.avg_return_30d += pattern.market_reactions?.return_30d || 0;
      reactions.volatility_change += pattern.volatility_change || 0;
    });

    const count = historicalPatterns.length;
    reactions.avg_return_1d /= count;
    reactions.avg_return_7d /= count;
    reactions.avg_return_30d /= count;
    reactions.volatility_change /= count;

    return reactions;
  }

  async updatePattern(event, pattern) {
    try {
      await query(
        `UPDATE historical_patterns
         SET occurrences = occurrences + 1,
             updated_at = NOW(),
             market_reactions = $1
         WHERE id = $2`,
        [JSON.stringify(pattern.market_reactions), pattern.id]
      );
    } catch (error) {
      console.error('Error updating pattern:', error);
    }
  }

  async storeNewPattern(event, marketReactions) {
    try {
      const signature = this.createEventSignature(event);
      const hash = this.generatePatternHash(event);

      await query(
        `INSERT INTO historical_patterns
         (event_hash, event_signature, event_type, sentiment_score, magnitude,
          affected_symbols, market_reactions, avg_return_1d, avg_return_7d,
          avg_return_30d, volatility_change, occurrences)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1)
         ON CONFLICT (event_hash) DO UPDATE SET
         occurrences = historical_patterns.occurrences + 1,
         updated_at = NOW()`,
        [
          hash,
          JSON.stringify(signature),
          event.event_type,
          event.sentiment_score,
          event.magnitude,
          event.affected_assets || [],
          JSON.stringify(marketReactions),
          marketReactions.avg_return_1d,
          marketReactions.avg_return_7d,
          marketReactions.avg_return_30d,
          marketReactions.volatility_change
        ]
      );
    } catch (error) {
      console.error('Error storing new pattern:', error);
    }
  }

  generatePatternHash(event) {
    const content = `${event.event_type}-${event.sentiment_label}-${event.magnitude}`;
    return require('crypto').createHash('sha256').update(content).digest('hex');
  }
}

export default new PatternAnalyzer();
