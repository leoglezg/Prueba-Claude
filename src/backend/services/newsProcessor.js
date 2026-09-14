import { query } from '../../database/connection.js';
import crypto from 'crypto';

export class NewsProcessor {
  constructor() {
    this.processedIds = new Set();
  }

  async processNews(rawNews) {
    const processed = {
      title: this.cleanText(rawNews.title),
      description: this.cleanText(rawNews.description || ''),
      content: this.cleanText(rawNews.content || ''),
      source: rawNews.source?.name || 'Unknown',
      url: rawNews.url,
      originalPublishedAt: rawNews.publishedAt,
      hash: this.generateHash(rawNews)
    };

    return processed;
  }

  cleanText(text) {
    if (!text) return '';

    return text
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[^\w\s\-.,!?]/g, '');
  }

  generateHash(news) {
    const content = `${news.title}${news.source?.name || ''}${news.publishedAt || ''}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async isDuplicate(hash) {
    try {
      const result = await query(
        'SELECT id FROM events WHERE raw_data->>"hash" = $1 LIMIT 1',
        [hash]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
  }

  classifyEventType(text) {
    const textLower = text.toLowerCase();

    const classifications = {
      'earnings': /earnings|results|revenue|profit|loss|guidance|forecast/i,
      'merger_acquisition': /merger|acquisition|acquire|acquired|bought|buyout/i,
      'regulatory': /regulation|fda|sec|regulatory|approved|denied|filed/i,
      'economic': /gdp|inflation|unemployment|interest rate|fed|central bank/i,
      'product': /launch|product|release|announce|new product|unveiled/i,
      'leadership': /ceo|cfo|cto|executive|resignation|appointed|new role/i,
      'bankruptcy': /bankrupt|insolvency|liquidation|debt|default/i,
      'lawsuit': /lawsuit|sued|settlement|legal|court|verdict/i,
      'dividend': /dividend|buyback|share repurchase|cash return/i,
      'market_movement': /surge|plunge|soar|crash|rally|decline|gain|loss/i
    };

    for (const [type, regex] of Object.entries(classifications)) {
      if (regex.test(textLower)) {
        return type;
      }
    }

    return 'other';
  }

  extractEntities(text) {
    const entityPatterns = {
      symbols: /\b[A-Z]{1,5}\b/g,
      currencies: /\$|€|¥|£/g,
      percentages: /\d+\.?\d*%/g,
      numbers: /\b\d+(?:,\d{3})*(?:\.\d+)?\b/g
    };

    const entities = {};
    for (const [type, regex] of Object.entries(entityPatterns)) {
      entities[type] = text.match(regex) || [];
    }

    return entities;
  }

  extractAssets(text, entities) {
    const symbols = entities.symbols || [];
    const commonSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'SPY', 'QQQ', 'IWM', 'EEM'];

    return symbols.filter(s => commonSymbols.includes(s) || s.length <= 5);
  }

  async saveProcessedNews(news) {
    try {
      const result = await query(
        `INSERT INTO events (title, description, content, source, url, raw_data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id`,
        [
          news.title,
          news.description,
          news.content,
          news.source,
          news.url,
          JSON.stringify({ ...news, hash: news.hash })
        ]
      );

      return result.rows[0].id;
    } catch (error) {
      console.error('Error saving processed news:', error);
      throw error;
    }
  }
}

export default new NewsProcessor();
