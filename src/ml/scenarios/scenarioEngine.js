import { query } from '../../database/connection.js';

export class ScenarioEngine {
  constructor() {
    this.scenarioTypes = ['bullish', 'bearish', 'consolidation', 'volatile', 'stable'];
    this.confidenceLevels = {
      high: { min: 8, max: 10 },
      medium: { min: 5, max: 7 },
      low: { min: 1, max: 4 }
    };
  }

  async generateScenarios(eventId, event, historicalPatterns) {
    try {
      const baseScenarios = this.createBaseScenarios(event);
      const scenarios = baseScenarios.map(scenario =>
        this.enrichScenarioWithHistoricalData(scenario, historicalPatterns, event)
      );

      await this.storeScenarios(eventId, scenarios);
      return scenarios;
    } catch (error) {
      console.error('Error generating scenarios:', error);
      throw error;
    }
  }

  createBaseScenarios(event) {
    const scenarios = [];

    if (event.sentiment_score > 0.3) {
      scenarios.push({
        type: 'bullish',
        probability: 0.5,
        expected_return: 2 + (event.sentiment_score * 5),
        expected_volatility: event.magnitude / 10,
        description: 'Market responds positively to the news'
      });

      scenarios.push({
        type: 'consolidation',
        probability: 0.3,
        expected_return: 0.5,
        expected_volatility: event.magnitude / 15,
        description: 'Market digests news with mild positive movement'
      });
    } else if (event.sentiment_score < -0.3) {
      scenarios.push({
        type: 'bearish',
        probability: 0.5,
        expected_return: -2 + (event.sentiment_score * 5),
        expected_volatility: event.magnitude / 10,
        description: 'Market responds negatively to the news'
      });

      scenarios.push({
        type: 'volatile',
        probability: 0.35,
        expected_return: -1,
        expected_volatility: event.magnitude / 8,
        description: 'Market shows increased volatility and uncertainty'
      });
    } else {
      scenarios.push({
        type: 'stable',
        probability: 0.6,
        expected_return: 0,
        expected_volatility: event.magnitude / 20,
        description: 'Market remains relatively stable'
      });

      scenarios.push({
        type: 'consolidation',
        probability: 0.4,
        expected_return: 0.5,
        expected_volatility: event.magnitude / 15,
        description: 'Mild market movement as uncertainty decreases'
      });
    }

    return scenarios;
  }

  enrichScenarioWithHistoricalData(scenario, patterns, event) {
    if (patterns.length === 0) {
      scenario.confidence = 4;
      scenario.affected_assets = event.affected_assets || [];
      return scenario;
    }

    const relevantPatterns = patterns.filter(p =>
      p.market_reactions && p.similarity > 0.6
    );

    if (relevantPatterns.length === 0) {
      scenario.confidence = 5;
      scenario.affected_assets = event.affected_assets || [];
      return scenario;
    }

    const avgReturn = relevantPatterns.reduce((sum, p) =>
      sum + (p.market_reactions?.return_1d || 0), 0
    ) / relevantPatterns.length;

    scenario.confidence = Math.min(10, 6 + Math.ceil(relevantPatterns.length / 2));
    scenario.affected_assets = event.affected_assets || [];

    if (Math.sign(avgReturn) === Math.sign(scenario.expected_return)) {
      scenario.probability = Math.min(0.9, scenario.probability + 0.2);
    } else {
      scenario.probability = Math.max(0.1, scenario.probability - 0.15);
    }

    return scenario;
  }

  async storeScenarios(eventId, scenarios) {
    try {
      for (const scenario of scenarios) {
        await query(
          `INSERT INTO scenarios
           (event_id, scenario_type, probability, expected_return, expected_volatility,
            confidence, affected_assets, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            eventId,
            scenario.type,
            scenario.probability,
            scenario.expected_return,
            scenario.expected_volatility,
            scenario.confidence,
            scenario.affected_assets || [],
            scenario.description
          ]
        );
      }
    } catch (error) {
      console.error('Error storing scenarios:', error);
      throw error;
    }
  }

  calculateProbabilityAdjustment(historicalAccuracy, patternSimilarity) {
    return (historicalAccuracy * 0.6) + (patternSimilarity * 0.4);
  }
}

export default new ScenarioEngine();
