# Market News Analyzer

🚀 Intelligent market news analysis and portfolio recommendation system based on real-time events and historical patterns.

## 🎯 Overview

This application is NOT a market prediction tool. Instead, it:

1. **Analyzes market news & events** - Processes and classifies news in real-time
2. **Performs sentiment analysis** - Determines the tone and magnitude of events
3. **Finds historical patterns** - Compares current events with similar past occurrences
4. **Generates scenarios** - Creates possible market reactions based on historical data
5. **Recommends actions** - Suggests portfolio moves based on analysis
6. **Sends alerts** - Notifies via Telegram/Email when relevant events occur

## 🏗️ Architecture

```
News/Events
    ↓
News Processor (clean, deduplicate, extract entities)
    ↓
Event Analyzer (sentiment, classification, magnitude)
    ↓
Historical Database + Market Data
    ↓
Pattern Analyzer (find similar historical events)
    ↓
Scenario Engine (generate possible outcomes)
    ↓
Recommendation Engine (portfolio suggestions)
    ↓
Alert Engine (Telegram/Email notifications)
    ↓
Dashboard (visualize & track)
```

## 📋 Components

### Backend Services

- **NewsProcessor** - Cleans, deduplicates, and extracts entities from news
- **EventAnalyzer** - Performs sentiment analysis and event classification
- **PatternAnalyzer** - Finds similar historical patterns
- **ScenarioEngine** - Generates market reaction scenarios
- **RecommendationEngine** - Creates portfolio recommendations
- **AlertEngine** - Sends notifications via Telegram/Email

### Database

- Events table - News and events
- Market data - Historical price/volume data
- Historical patterns - Past events and their market reactions
- Scenarios - Generated possible outcomes
- Recommendations - Portfolio suggestions
- User portfolio - Assets held

### Frontend

- Dashboard - Overview and quick analysis
- Events list - All processed events
- Recommendations - Portfolio suggestions with filters

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- PostgreSQL 13+
- Redis 6+

### Installation

```bash
npm install
cp .env.example .env
```

### Configuration

Edit `.env` with:
- Database URL
- API keys (NewsAPI, Alpha Vantage, Finnhub)
- Alert credentials (Telegram, Email)

### Database Setup

```bash
npm run db:migrate
```

### Development

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Production

```bash
npm start
```

## 📊 Key Features

### Event Analysis

- **Sentiment Analysis** - Positive/Negative/Neutral with confidence score
- **Event Classification** - Earnings, M&A, Regulatory, Economic, etc.
- **Magnitude Scoring** - 1-10 scale indicating event importance
- **Entity Extraction** - Identifies affected assets (stock symbols)

### Pattern Matching

- Finds similar historical events (similarity > 0.75)
- Analyzes market reactions (1-day, 7-day, 30-day returns)
- Volatility impact assessment
- Occurrence tracking for continuous learning

### Scenario Generation

- **Bullish** - Positive market reaction
- **Bearish** - Negative market reaction
- **Volatile** - High uncertainty
- **Consolidation** - Mild movement
- **Stable** - Minimal reaction

Each scenario includes:
- Probability estimate
- Expected return %
- Expected volatility
- Confidence level (1-10)

### Recommendations

- **Actions**: BUY, SELL, HOLD, REDUCE, INCREASE
- **Risk levels**: Very Low → Very High
- **Confidence**: Based on similar patterns
- **Expiration**: 1-48 hours depending on magnitude

### Alerts

Sends notifications via:
- **Telegram** - Real-time bot messages
- **Email** - Detailed analysis reports

## 🎓 Learning System

The system improves over time through:

1. **Pattern Storage** - Stores new event patterns automatically
2. **Feedback Tracking** - Records actual outcomes vs. recommendations
3. **Accuracy Learning** - Adjusts confidence based on historical accuracy
4. **Weighting Adjustment** - Prioritizes more accurate pattern indicators

## 📈 Example Flow

1. **Event occurs**: Apple announces new product
2. **Processor cleans**: Extracts title, removes duplicates
3. **Analyzer scores**: Sentiment +0.7, Magnitude 6/10
4. **Pattern search**: Finds 3 similar product launch events
5. **Historical data**: Those events had avg +2.5% return
6. **Scenarios**: 60% bullish, 25% consolidation, 15% volatile
7. **Recommendation**: BUY Apple-related assets, confidence 75%
8. **Alert**: Sends Telegram & Email notifications
9. **Dashboard**: Shows event with recommended action
10. **Feedback**: Tracks actual market reaction to learn

## 🔧 API Endpoints

### Analyze Event

```bash
POST /api/analyze-event
{
  "news": {
    "title": "...",
    "description": "...",
    "content": "...",
    "source": { "name": "..." },
    "publishedAt": "2024-01-01T..."
  }
}
```

### Get Recommendations

```bash
GET /api/recommendations?limit=10&asset=AAPL
```

### Get Events

```bash
GET /api/events?limit=20&offset=0
```

### Statistics

```bash
GET /api/statistics
```

## 📦 Environment Variables

```
DATABASE_URL=postgresql://user:pass@localhost/market_analyzer
REDIS_URL=redis://localhost:6379

NEWSAPI_KEY=your_key
ALPHA_VANTAGE_KEY=your_key
FINNHUB_KEY=your_key

TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_id

SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_password
SMTP_TO=recipient@example.com

PORT=3000
NODE_ENV=development
```

## 📚 Data Model

### Event
- Sentiment (score + label + confidence)
- Classification (type + magnitude)
- Affected assets
- Source & URL
- Timestamp

### Historical Pattern
- Event signature
- Market reactions (1d/7d/30d returns)
- Volatility impact
- Occurrence count
- Confidence metrics

### Recommendation
- Asset
- Action (buy/sell/hold/reduce/increase)
- Confidence
- Expected impact
- Risk level
- Expiration time

## 🎯 Disclaimer

**This tool is for informational and educational purposes only.** It:

- ❌ Does NOT predict future market prices
- ❌ Does NOT guarantee returns
- ✅ Helps analyze real events and patterns
- ✅ Supports decision-making based on data
- ✅ Learns from historical market behavior

Always conduct your own research and consult with a financial advisor before making investment decisions.

## 📄 License

MIT

## 👨‍💻 Author

Leo Glezberg

---

**Last Updated**: 2024-09-14
