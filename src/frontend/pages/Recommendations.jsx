import React, { useState } from 'react';

function Recommendations({ recommendations }) {
  const [filterAction, setFilterAction] = useState(null);
  const [filterAsset, setFilterAsset] = useState(null);

  const filtered = recommendations.filter(rec => {
    if (filterAction && rec.action !== filterAction) return false;
    if (filterAsset && rec.asset !== filterAsset) return false;
    return true;
  });

  const assets = [...new Set(recommendations.map(r => r.asset))];
  const actions = [...new Set(recommendations.map(r => r.action))];

  return (
    <div className="recommendations-page">
      <h1>💡 Portfolio Recommendations</h1>

      <div className="filters">
        <div className="filter-group">
          <label>Filter by Action:</label>
          <select value={filterAction || ''} onChange={(e) => setFilterAction(e.target.value || null)}>
            <option value="">All Actions</option>
            {actions.map(action => (
              <option key={action} value={action}>{action.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Filter by Asset:</label>
          <select value={filterAsset || ''} onChange={(e) => setFilterAsset(e.target.value || null)}>
            <option value="">All Assets</option>
            {assets.map(asset => (
              <option key={asset} value={asset}>{asset}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="recommendations-grid">
        {filtered.map((rec) => (
          <div key={rec.id} className={`recommendation-detail ${rec.action}`}>
            <div className="rec-top">
              <h2>{rec.asset}</h2>
              <span className={`action-badge ${rec.action}`}>{rec.action.toUpperCase()}</span>
            </div>

            <div className="rec-metrics">
              <div className="metric">
                <span className="label">Confidence:</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${rec.confidence * 100}%` }}
                  />
                </div>
                <span className="value">{(rec.confidence * 100).toFixed(0)}%</span>
              </div>

              <div className="metric">
                <span className="label">Expected Impact:</span>
                <span className={`value ${rec.expected_impact > 0 ? 'positive' : 'negative'}`}>
                  {rec.expected_impact.toFixed(2)}%
                </span>
              </div>

              <div className="metric">
                <span className="label">Risk Level:</span>
                <span className={`risk-badge ${rec.risk_level}`}>{rec.risk_level}</span>
              </div>
            </div>

            <div className="rec-rationale">
              <p>{rec.rationale}</p>
            </div>

            <div className="rec-footer">
              {rec.expires_at && (
                <small>Expires: {new Date(rec.expires_at).toLocaleString()}</small>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>No recommendations match your filters</p>
        </div>
      )}
    </div>
  );
}

export default Recommendations;
