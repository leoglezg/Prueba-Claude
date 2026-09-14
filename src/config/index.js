import dotenv from 'dotenv';

dotenv.config();

export const config = {
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  },

  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost/market_analyzer'
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },

  apis: {
    newsapi: {
      key: process.env.NEWSAPI_KEY,
      baseUrl: 'https://newsapi.org/v2'
    },
    alphaVantage: {
      key: process.env.ALPHA_VANTAGE_KEY,
      baseUrl: 'https://www.alphavantage.co'
    },
    finnhub: {
      key: process.env.FINNHUB_KEY,
      baseUrl: 'https://finnhub.io/api/v1'
    }
  },

  alerts: {
    telegram: {
      token: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID
    },
    email: {
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      to: process.env.SMTP_TO
    }
  },

  ml: {
    updateInterval: parseInt(process.env.MODEL_UPDATE_INTERVAL) || 86400, // 24 hours
    similarityThreshold: parseFloat(process.env.PATTERN_SIMILARITY_THRESHOLD) || 0.75,
    minHistoricalEvents: 10
  }
};

export default config;
