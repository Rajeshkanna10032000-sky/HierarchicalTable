import React, { useState } from 'react';
import type { ColumnDef, RowCountEntry } from '../types';
import styles from './BreakdownPanel.module.css';

interface BreakdownColData {
  col: ColumnDef;
  /** all entries across all rows, flattened */
  allEntries: RowCountEntry[];
}

interface Props {
  breakdownCols: BreakdownColData[];
}

const BreakdownPanel: React.FC<Props> = ({ breakdownCols }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (breakdownCols.length === 0) return null;
  if (breakdownCols.every((b) => b.allEntries.length === 0)) return null;

  return (
    <div className={styles.panel}>
      {/* ── Panel header ─────────────────────────────────────────── */}
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderLeft}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#9b59b6" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6"  y1="20" x2="6"  y2="14" />
          </svg>
          <span className={styles.panelTitle}>Breakdown</span>
          <span className={styles.panelSub}>Total split by entries</span>
        </div>
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed((p) => !p)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <svg
            viewBox="0 0 24 24" width="13" height="13" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.18s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* ── Breakdown content ────────────────────────────────────── */}
      {!collapsed && (
        <div className={styles.panelBody}>
          {breakdownCols.map(({ col, allEntries }) => {
            const grandTotal = allEntries.reduce((s, e) => s + (e.amount || 0), 0);

            // Group entries by label — sum same-named entries
            const grouped = allEntries.reduce<Record<string, number>>((acc, e) => {
              const key = e.label.trim() || '(unnamed)';
              acc[key] = (acc[key] ?? 0) + (e.amount || 0);
              return acc;
            }, {});

            const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);

            if (sorted.length === 0) return null;

            return (
              <div key={col.id} className={styles.colBreakdown}>
                {/* Column name */}
                <div className={styles.colBreakdownHeader}>
                  <span className={styles.colName}>{col.label}</span>
                  <span className={styles.grandTotal}>
                    Grand Total: <strong>{grandTotal.toLocaleString()}</strong>
                  </span>
                </div>

                {/* Stacked bar + rows */}
                <div className={styles.barWrap}>
                  <div className={styles.bar}>
                    {sorted.map(([label, amount], idx) => {
                      const pct = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;
                      const hue = (idx * 47 + 260) % 360;
                      return (
                        <div
                          key={label}
                          className={styles.barSegment}
                          style={{ width: `${pct}%`, background: `hsl(${hue}, 65%, 55%)` }}
                          title={`${label}: ${amount.toLocaleString()} (${pct.toFixed(1)}%)`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Entry rows */}
                <div className={styles.entryTable}>
                  {sorted.map(([label, amount], idx) => {
                    const pct = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;
                    const hue = (idx * 47 + 260) % 360;
                    return (
                      <div key={label} className={styles.entryLine}>
                        <span
                          className={styles.entryDot}
                          style={{ background: `hsl(${hue}, 65%, 55%)` }}
                        />
                        <span className={styles.entryName}>{label}</span>
                        <div className={styles.entryBarWrap}>
                          <div
                            className={styles.entryBar}
                            style={{
                              width: `${pct}%`,
                              background: `hsl(${hue}, 65%, 55%)`,
                            }}
                          />
                        </div>
                        <span className={styles.entryPct}>{pct.toFixed(1)}%</span>
                        <span className={styles.entryAmt}>{amount.toLocaleString()}</span>
                      </div>
                    );
                  })}

                  {/* Grand total row */}
                  <div className={`${styles.entryLine} ${styles.totalLine}`}>
                    <span className={styles.entryDot} style={{ background: '#9b59b6' }} />
                    <span className={styles.entryName}><strong>Grand Total</strong></span>
                    <div className={styles.entryBarWrap} />
                    <span className={styles.entryPct}>100%</span>
                    <span className={`${styles.entryAmt} ${styles.totalAmt}`}>
                      {grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BreakdownPanel;