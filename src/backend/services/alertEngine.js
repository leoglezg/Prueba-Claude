import { query } from '../../database/connection.js';
import nodemailer from 'nodemailer';
import config from '../../config/index.js';

export class AlertEngine {
  constructor() {
    this.setupEmailTransporter();
  }

  setupEmailTransporter() {
    this.emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.alerts.email.user,
        pass: config.alerts.email.password
      }
    });
  }

  async sendAlert(eventId, event, recommendations) {
    try {
      const alertContent = this.formatAlertContent(event, recommendations);

      const methods = [];

      if (config.alerts.telegram.token && config.alerts.telegram.chatId) {
        await this.sendTelegramAlert(alertContent);
        methods.push('telegram');
      }

      if (config.alerts.email.user && config.alerts.email.to) {
        await this.sendEmailAlert(event, alertContent);
        methods.push('email');
      }

      await this.logAlert(eventId, 'event_alert', methods);

      return {
        sent: true,
        methods,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error sending alert:', error);
      return {
        sent: false,
        error: error.message
      };
    }
  }

  formatAlertContent(event, recommendations) {
    const recs = recommendations.slice(0, 5);
    const recText = recs.map(r =>
      `• ${r.asset}: ${r.action.toUpperCase()} (Confidence: ${(r.confidence * 100).toFixed(0)}%, Risk: ${r.risk_level})`
    ).join('\n');

    return {
      title: `🚨 Market Alert: ${event.event_type.toUpperCase()}`,
      summary: `${event.title}`,
      sentiment: `${event.sentiment_label.toUpperCase()} (${(event.sentiment_score * 100).toFixed(0)}%)`,
      magnitude: `${event.magnitude}/10`,
      recommendations: recText,
      source: event.source,
      url: event.url
    };
  }

  async sendTelegramAlert(content) {
    try {
      const message = `
${content.title}

📰 ${content.summary}

💭 Sentiment: ${content.sentiment}
⚡ Magnitude: ${content.magnitude}

📊 Recommendations:
${content.recommendations}

🔗 Source: ${content.source}
      `;

      const telegramUrl = `https://api.telegram.org/bot${config.alerts.telegram.token}/sendMessage`;

      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.alerts.telegram.chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Telegram alert error:', error);
      throw error;
    }
  }

  async sendEmailAlert(event, content) {
    try {
      const mailOptions = {
        from: config.alerts.email.user,
        to: config.alerts.email.to,
        subject: content.title,
        html: this.generateEmailHTML(content)
      };

      await this.emailTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email alert error:', error);
      throw error;
    }
  }

  generateEmailHTML(content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; padding: 20px; border-radius: 8px; }
          .header { background: #667eea; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .section { margin: 15px 0; }
          .label { font-weight: bold; color: #333; }
          .recommendations { background: #f9f9f9; padding: 10px; border-left: 4px solid #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${content.title}</h2>
          </div>

          <div class="section">
            <p class="label">📰 Summary:</p>
            <p>${content.summary}</p>
          </div>

          <div class="section">
            <p class="label">💭 Sentiment:</p>
            <p>${content.sentiment}</p>
          </div>

          <div class="section">
            <p class="label">⚡ Magnitude:</p>
            <p>${content.magnitude}</p>
          </div>

          <div class="section recommendations">
            <p class="label">📊 Recommendations:</p>
            <pre>${content.recommendations}</pre>
          </div>

          <div class="section">
            <p class="label">🔗 Source:</p>
            <p>${content.source} - <a href="${content.url}">Read more</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async logAlert(eventId, alertType, methods) {
    try {
      await query(
        `INSERT INTO alerts (event_id, alert_type, status, sent_via, sent_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [eventId, alertType, 'sent', methods]
      );
    } catch (error) {
      console.error('Error logging alert:', error);
    }
  }
}

export default new AlertEngine();
