# Market News Analyzer - Detailed Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          INPUT LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│  • NewsAPI Integration                                              │
│  • Manual News Entry                                                │
│  • RSS Feeds                                                        │
│  • Real-time Event Streams                                          │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    NEWS PROCESSOR                                   │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ Text Cleaning & Normalization                                    │
│  ✓ Duplicate Detection (SHA-256 hashing)                            │
│  ✓ Entity Extraction (symbols, currencies, numbers)                 │
│  ✓ Asset Symbol Identification                                      │
│  └─→ Stores cleaned data in DATABASE                                │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   EVENT ANALYZER                                    │
├─────────────────────────────────────────────────────────────────────┤
│  📊 Sentiment Analysis:                                             │
│     • AFINN-based scoring (-1 to +1)                                │
│     • Confidence calculation                                        │
│     • Label: Positive/Negative/Neutral                              │
│                                                                     │
│  🏷️  Event Classification:                                          │
│     • Earnings • M&A • Regulatory • Economic                        │
│     • Product • Leadership • Bankruptcy • Lawsuit                   │
│     • Dividend • Market Movement                                    │
│                                                                     │
│  📈 Magnitude Scoring (1-10):                                        │
│     • Base value per event type                                     │
│     • Intensity modifiers (+/-)                                     │
│     • Sentiment impact adjustment                                   │
│     • Final confidence score                                        │
│                                                                     │
│  └─→ Updates event record with analysis results                     │
└────────────────────────────┬────────────────────────────────────────┘
                    ┌────────┴────────┐
                    ↓                 ↓
    ┌─────────────────────────┐  ┌──────────────────────┐
    │ HISTORICAL DATABASE     │  │  MARKET DATA         │
    │                         │  │                      │
    │ • Past events           │  │ • Price history      │
    │ • Market reactions      │  │ • Volume             │
    │ • Volatility changes    │  │ • Volatility index   │
    │ • Pattern signatures    │  │ • Returns (1D/7D/30D)│
    └─────────────────────────┘  └──────────────────────┘
                    └────────┬────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   PATTERN ANALYZER                                  │
├─────────────────────────────────────────────────────────────────────┤
│  🔍 Pattern Matching Algorithm:                                     │
│     • Event type similarity (30%)                                   │
│     • Sentiment proximity (20%)                                     │
│     • Magnitude range check (20%)                                   │
│     • Affected asset overlap (15%)                                  │
│     • Keyword matching (15%)                                        │
│                                                                     │
│  📊 Similarity Score Calculation:                                   │
│     • Combined score: 0.0 → 1.0                                     │
│     • Filter threshold: > 0.75 (configurable)                       │
│     • Return top N similar patterns                                 │
│                                                                     │
│  📈 Market Reaction Analysis:                                       │
│     • Average 1-day return (%)                                      │
│     • Average 7-day return (%)                                      │
│     • Average 30-day return (%)                                     │
│     • Volatility changes                                            │
│     • By-asset reaction breakdown                                   │
│                                                                     │
│  └─→ Retrieves similar patterns for scenario generation             │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  SCENARIO ENGINE                                    │
├─────────────────────────────────────────────────────────────────────┤
│  🎯 Scenario Type Generation:                                       │
│                                                                     │
│  IF sentiment > 0.3:                                                │
│    └─→ BULLISH (50% prob)        Expected return: +2.5%             │
│    └─→ CONSOLIDATION (30% prob)  Expected return: +0.5%             │
│                                                                     │
│  IF sentiment < -0.3:                                               │
│    └─→ BEARISH (50% prob)        Expected return: -2.5%             │
│    └─→ VOLATILE (35% prob)       Expected return: -1.0%             │
│                                                                     │
│  ELSE (neutral):                                                    │
│    └─→ STABLE (60% prob)         Expected return: 0.0%              │
│    └─→ CONSOLIDATION (40% prob)  Expected return: +0.5%             │
│                                                                     │
│  📊 Historical Enrichment:                                          │
│     • Find relevant patterns (similarity > 0.6)                     │
│     • Adjust probability based on historical accuracy               │
│     • Set confidence level (1-10)                                   │
│     • Calculate expected volatility                                 │
│                                                                     │
│  └─→ Stores scenarios in database                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│              RECOMMENDATION ENGINE                                  │
├─────────────────────────────────────────────────────────────────────┤
│  📋 Recommendation Generation per Asset:                            │
│                                                                     │
│  Decision Tree:                                                     │
│  ┌─ Bullish + Expected Return > 1% + Confidence > 70%              │
│  │  └─→ ACTION: BUY (or INCREASE if already holding)                │
│  │                                                                  │
│  ├─ Bearish + Expected Return < -1% + Confidence > 70%             │
│  │  └─→ ACTION: SELL (or REDUCE if holding)                        │
│  │                                                                  │
│  ├─ Volatile Scenario                                              │
│  │  └─→ ACTION: REDUCE (if holding) or HOLD                        │
│  │                                                                  │
│  └─ Neutral/Uncertain                                              │
│     └─→ ACTION: HOLD                                               │
│                                                                     │
│  🎓 Risk Assessment:                                                │
│     • Risk Score = Volatility * 2 + Magnitude/10 * 0.5              │
│     • Very High: > 0.7   → Red alert                                │
│     • High:      > 0.55  → Orange warning                           │
│     • Medium:    > 0.35  → Yellow notice                            │
│     • Low:       > 0.15  → Blue info                                │
│     • Very Low:  ≤ 0.15  → Green safe                               │
│                                                                     │
│  📊 Confidence Calculation:                                         │
│     • Scenario confidence: 40%                                      │
│     • Event confidence: 30%                                         │
│     • Probability factor: 30%                                       │
│     • Final: Min(1.0, combined)                                     │
│                                                                     │
│  ⏰ Expiration Time:                                                 │
│     • High magnitude (8-10) → 1 hour                                │
│     • Medium magnitude (5-7) → 12-24 hours                          │
│     • Low magnitude (1-4) → 24-48 hours                             │
│                                                                     │
│  └─→ Stores recommendations with rationale                          │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  ALERT ENGINE                                       │
├─────────────────────────────────────────────────────────────────────┤
│  📢 Alert Creation:                                                 │
│     • Alert Type: event_alert                                       │
│     • Severity: Based on magnitude + sentiment                      │
│     • Content: Event summary + top 5 recommendations                │
│                                                                     │
│  🔔 Notification Channels:                                          │
│                                                                     │
│  Telegram Bot:                                                      │
│  ├─ Real-time message delivery                                     │
│  ├─ Formatted with emojis                                          │
│  └─ Includes recommendation summary                                │
│                                                                     │
│  Email (SMTP):                                                      │
│  ├─ Detailed HTML report                                           │
│  ├─ Full analysis breakdown                                        │
│  └─ Source links                                                   │
│                                                                     │
│  └─→ Logs alert in database (sent_at, sent_via)                    │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   FRONTEND DASHBOARD                                │
├─────────────────────────────────────────────────────────────────────┤
│  📊 Dashboard Page:                                                 │
│     • Statistics cards (events, sentiment, magnitude)               │
│     • Quick news analyzer form                                      │
│     • Recent events widget                                          │
│     • Top recommendations widget                                    │
│                                                                     │
│  📰 Events Page:                                                    │
│     • Table view of all events                                      │
│     • Filters: type, sentiment, date range                          │
│     • Click for detailed analysis                                   │
│                                                                     │
│  💡 Recommendations Page:                                           │
│     • Grid/list view                                                │
│     • Filters: action (buy/sell), asset, risk level                 │
│     • Risk meter (visual progress bar)                              │
│     • Expiration countdown                                          │
│     • Detailed rationale                                            │
│                                                                     │
│  └─→ Real-time updates (60s interval)                               │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Model

### Events Table
```sql
events {
  id: INT PRIMARY KEY
  title: VARCHAR(500)
  description: TEXT
  content: TEXT
  source: VARCHAR(50)
  url: VARCHAR(1000)
  sentiment_score: FLOAT [-1, 1]
  sentiment_label: VARCHAR(20) [positive, negative, neutral]
  confidence: FLOAT [0, 1]
  event_type: VARCHAR(100)
  magnitude: INT [1, 10]
  affected_assets: TEXT[] [AAPL, MSFT, ...]
  created_at: TIMESTAMP
  processed_at: TIMESTAMP
}
```

### Historical Patterns Table
```sql
historical_patterns {
  id: INT PRIMARY KEY
  event_hash: VARCHAR(100) UNIQUE
  event_signature: JSONB {
    event_type, sentiment_score, magnitude,
    affected_assets[], keywords[]
  }
  market_reactions: JSONB {
    return_1d, return_7d, return_30d,
    volatility_change, by_asset
  }
  occurrences: INT
  avg_return_1d: FLOAT (%)
  avg_return_7d: FLOAT (%)
  avg_return_30d: FLOAT (%)
  volatility_change: FLOAT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### Scenarios Table
```sql
scenarios {
  id: INT PRIMARY KEY
  event_id: INT FOREIGN KEY
  scenario_type: VARCHAR(50) [bullish, bearish, volatile, consolidation, stable]
  probability: FLOAT [0, 1]
  expected_return: FLOAT (%)
  expected_volatility: FLOAT
  confidence: INT [1, 10]
  affected_assets: TEXT[]
  description: TEXT
  created_at: TIMESTAMP
}
```

### Recommendations Table
```sql
recommendations {
  id: INT PRIMARY KEY
  event_id: INT FOREIGN KEY
  asset: VARCHAR(20)
  action: VARCHAR(50) [buy, sell, hold, reduce, increase]
  confidence: FLOAT [0, 1]
  expected_impact: FLOAT (%)
  risk_level: VARCHAR(20) [very_low, low, medium, high, very_high]
  rationale: TEXT
  created_at: TIMESTAMP
  expires_at: TIMESTAMP
}
```

## Learning System

### Feedback Loop
```
1. Recommendation Created
   ↓
2. User Action (or market reaction tracked)
   ↓
3. Actual Outcome Recorded
   ↓
4. Accuracy Comparison
   - Predicted: +2.5% return
   - Actual: +1.8% return
   - Accuracy: 72%
   ↓
5. Pattern Weight Adjustment
   - Increase weight for accurate indicators
   - Decrease weight for poor predictors
   ↓
6. Model Improvement
   - Recommendation confidence updated
   - Scenario probabilities adjusted
   - Future recommendations more accurate
```

## Configuration Parameters

| Parameter | Default | Range | Purpose |
|-----------|---------|-------|---------|
| `PATTERN_SIMILARITY_THRESHOLD` | 0.75 | 0-1 | Minimum similarity for pattern match |
| `MIN_HISTORICAL_EVENTS` | 10 | 1+ | Minimum patterns for scenario generation |
| `MODEL_UPDATE_INTERVAL` | 86400s | 3600+ | Retraining frequency (seconds) |
| `SENTIMENT_CONFIDENCE_MIN` | 0.5 | 0-1 | Minimum confidence for sentiment |
| `MAGNITUDE_BASE_VALUES` | Per type | 1-10 | Base magnitude per event type |

## Performance Considerations

### Indexing Strategy
```sql
-- Fast event lookup
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_sentiment ON events(sentiment_label);
CREATE INDEX idx_events_type ON events(event_type);

-- Pattern matching optimization
CREATE INDEX idx_patterns_type ON historical_patterns(event_type);
CREATE INDEX idx_patterns_sentiment ON historical_patterns(sentiment_score);

-- Recommendation filtering
CREATE INDEX idx_recommendations_asset ON recommendations(asset);
CREATE INDEX idx_recommendations_expires ON recommendations(expires_at);
```

### Caching Strategy
- Redis cache for recent events (24h TTL)
- Pattern similarity scores cached (1h TTL)
- Asset price data cached (15m TTL)

## Security Considerations

1. **Input Validation**
   - Sanitize all user inputs
   - Validate API responses
   - Rate limiting on endpoints

2. **Database**
   - Use prepared statements (SQL injection prevention)
   - Row-level security for user data
   - Audit logging for sensitive operations

3. **API Keys**
   - Store in .env only (never commit)
   - Rotate periodically
   - Use API key scoping

4. **Alerts**
   - Validate Telegram/Email configurations
   - Encrypt sensitive alert data
   - Rate limit alert sending

---

**Last Updated**: 2024-09-14
