-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  url VARCHAR(1000),
  content TEXT,
  sentiment_score FLOAT CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  sentiment_label VARCHAR(20),
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  event_type VARCHAR(100),
  magnitude INT DEFAULT 5 CHECK (magnitude >= 1 AND magnitude <= 10),
  affected_assets TEXT[] DEFAULT '{}',
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  INDEX idx_created_at ON events(created_at DESC),
  INDEX idx_sentiment ON events(sentiment_label),
  INDEX idx_event_type ON events(event_type)
);

-- Market Data Table
CREATE TABLE IF NOT EXISTS market_data (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  open DECIMAL(10, 2),
  high DECIMAL(10, 2),
  low DECIMAL(10, 2),
  close DECIMAL(10, 2),
  volume BIGINT,
  adjusted_close DECIMAL(10, 2),
  volatility FLOAT,
  change_percent FLOAT,
  UNIQUE(symbol, date),
  INDEX idx_symbol_date ON market_data(symbol, date DESC)
);

-- Historical Patterns Table
CREATE TABLE IF NOT EXISTS historical_patterns (
  id SERIAL PRIMARY KEY,
  event_hash VARCHAR(100) NOT NULL UNIQUE,
  event_signature JSONB NOT NULL,
  event_type VARCHAR(100),
  sentiment_score FLOAT,
  magnitude INT,
  affected_symbols VARCHAR(20)[],
  market_reactions JSONB,
  avg_return_1d FLOAT,
  avg_return_7d FLOAT,
  avg_return_30d FLOAT,
  volatility_change FLOAT,
  occurrences INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_type ON historical_patterns(event_type),
  INDEX idx_sentiment ON historical_patterns(sentiment_score)
);

-- Scenario Engine Results Table
CREATE TABLE IF NOT EXISTS scenarios (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  scenario_type VARCHAR(50),
  probability FLOAT CHECK (probability >= 0 AND probability <= 1),
  expected_return FLOAT,
  expected_volatility FLOAT,
  confidence INT CHECK (confidence >= 1 AND confidence <= 10),
  affected_assets TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_id ON scenarios(event_id)
);

-- Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  asset VARCHAR(20) NOT NULL,
  action VARCHAR(50),
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  expected_impact FLOAT,
  risk_level VARCHAR(20),
  rationale TEXT,
  scenario_id INT REFERENCES scenarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  INDEX idx_event_id ON recommendations(event_id),
  INDEX idx_asset ON recommendations(asset),
  INDEX idx_created_at ON recommendations(created_at DESC)
);

-- Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  alert_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  sent_via TEXT[] DEFAULT '{}',
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status ON alerts(status),
  INDEX idx_created_at ON alerts(created_at DESC)
);

-- User Portfolio Table
CREATE TABLE IF NOT EXISTS user_portfolio (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100),
  symbol VARCHAR(20) NOT NULL,
  quantity FLOAT NOT NULL,
  entry_price DECIMAL(10, 2),
  weight_percent FLOAT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, symbol),
  INDEX idx_user_id ON user_portfolio(user_id)
);

-- Learning Feedback Table
CREATE TABLE IF NOT EXISTS learning_feedback (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  recommendation_id INT REFERENCES recommendations(id) ON DELETE SET NULL,
  actual_outcome JSONB,
  feedback_accuracy FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_id ON learning_feedback(event_id)
);

-- Create indexes for performance
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_market_data_symbol ON market_data(symbol);
CREATE INDEX idx_recommendations_asset ON recommendations(asset);
