import { query } from '../../database/connection.js';

export class RecommendationEngine {
  constructor() {
    this.actions = ['buy', 'sell', 'hold', 'reduce', 'increase'];
    this.riskLevels = ['very_low', 'low', 'medium', 'high', 'very_high'];
  }

  async generateRecommendations(eventId, event, scenarios, userPortfolio = null) {
    try {
      const recommendations = [];

      for (const scenario of scenarios) {
        for (const asset of (event.affected_assets || [])) {
          const rec = this.createRecommendation(
            asset,
            event,
            scenario,
            userPortfolio
          );
          recommendations.push(rec);
        }
      }

      await this.storeRecommendations(eventId, recommendations);
      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  createRecommendation(asset, event, scenario, portfolio) {
    const currentHolding = portfolio?.[asset];
    const action = this.determineAction(asset, event, scenario, currentHolding);
    const confidence = this.calculateConfidence(scenario, event);
    const riskLevel = this.assessRiskLevel(scenario, event.magnitude);

    return {
      asset,
      action,
      confidence,
      expected_impact: scenario.expected_return,
      risk_level: riskLevel,
      scenario_type: scenario.type,
      rationale: this.generateRationale(asset, action, event, scenario),
      expires_at: this.calculateExpiration(event.magnitude)
    };
  }

  determineAction(asset, event, scenario, currentHolding) {
    const expectedReturn = scenario.expected_return;
    const confidence = scenario.confidence / 10;

    if (scenario.type === 'bullish' && expectedReturn > 1) {
      return confidence > 0.7 ? 'buy' : currentHolding ? 'increase' : 'buy';
    }

    if (scenario.type === 'bearish' && expectedReturn < -1) {
      return confidence > 0.7 ? 'sell' : currentHolding ? 'reduce' : 'hold';
    }

    if (scenario.type === 'volatile') {
      return currentHolding ? 'reduce' : 'hold';
    }

    return 'hold';
  }

  calculateConfidence(scenario, event) {
    const scenarioConfidence = scenario.confidence / 10;
    const eventConfidence = event.confidence || 0.5;
    const probabilityFactor = Math.max(0.3, scenario.probability);

    return Math.min(1, (scenarioConfidence * 0.4 + eventConfidence * 0.3 + probabilityFactor * 0.3));
  }

  assessRiskLevel(scenario, magnitude) {
    const volatilityRisk = scenario.expected_volatility * 2;
    const magnitudeRisk = (magnitude / 10) * 0.5;
    const totalRisk = volatilityRisk + magnitudeRisk;

    if (totalRisk > 0.7) return 'very_high';
    if (totalRisk > 0.55) return 'high';
    if (totalRisk > 0.35) return 'medium';
    if (totalRisk > 0.15) return 'low';
    return 'very_low';
  }

  generateRationale(asset, action, event, scenario) {
    const parts = [
      `${event.event_type.toUpperCase()} event detected`,
      `Sentiment: ${event.sentiment_label} (${(event.sentiment_score * 100).toFixed(0)}%)`,
      `Expected scenario: ${scenario.type}`,
      `Expected return: ${scenario.expected_return.toFixed(2)}%`,
      `Confidence: ${(scenario.confidence / 10 * 100).toFixed(0)}%`
    ];

    if (action === 'buy') {
      parts.push(`Recommendation: INCREASE exposure to ${asset}`);
    } else if (action === 'sell') {
      parts.push(`Recommendation: DECREASE exposure to ${asset}`);
    } else if (action === 'reduce') {
      parts.push(`Recommendation: REDUCE position in ${asset}`);
    } else if (action === 'increase') {
      parts.push(`Recommendation: INCREASE existing position in ${asset}`);
    } else {
      parts.push(`Recommendation: HOLD ${asset}`);
    }

    return parts.join(' | ');
  }

  calculateExpiration(magnitude) {
    const hours = Math.max(1, Math.min(48, magnitude * 5));
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + hours);
    return expirationDate;
  }

  async storeRecommendations(eventId, recommendations) {
    try {
      for (const rec of recommendations) {
        await query(
          `INSERT INTO recommendations
           (event_id, asset, action, confidence, expected_impact, risk_level, rationale, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            eventId,
            rec.asset,
            rec.action,
            rec.confidence,
            rec.expected_impact,
            rec.risk_level,
            rec.rationale,
            rec.expires_at
          ]
        );
      }
    } catch (error) {
      console.error('Error storing recommendations:', error);
      throw error;
    }
  }
}

export default new RecommendationEngine();
