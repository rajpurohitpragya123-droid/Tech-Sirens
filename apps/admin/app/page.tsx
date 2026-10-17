'use client';
import { useState } from 'react';
const sections = [
  'Overview',
  'Verification',
  'Diagnosis labelling',
  'Reference prices',
  'State notices',
  'Translation review',
  'CSV import',
];
const initial = [
  {
    id: 1,
    name: 'Pending Dealer',
    type: 'Input seller',
    detail: 'Licence DEMO-2026 · Meerut',
    status: 'Pending',
  },
  {
    id: 2,
    name: 'Harvest Traders',
    type: 'Buyer',
    detail: 'Demo verification documents',
    status: 'Pending',
  },
  {
    id: 3,
    name: 'Village Transport',
    type: 'Transporter',
    detail: 'Vehicle and licence review',
    status: 'Pending',
  },
  {
    id: 4,
    name: 'Village field listing',
    type: 'Land listing',
    detail: 'Owner verification pending',
    status: 'Pending',
  },
  {
    id: 5,
    name: 'Kisan Fresh Storage',
    type: 'Cold storage',
    detail: 'Notified-rate reference required',
    status: 'Pending',
  },
  {
    id: 6,
    name: 'Canal-side plot',
    type: 'Land listing',
    detail: 'Ownership-document check',
    status: 'Pending',
  },
];
export default function Admin() {
  const [section, setSection] = useState('Overview'),
    [queue, setQueue] = useState(initial),
    [message, setMessage] = useState(''),
    [label, setLabel] = useState(''),
    [importCount, setImportCount] = useState(0);
  function review(id: number, status: string) {
    setQueue((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
    setMessage(`Demo decision: ${status}. No backend record changed.`);
  }
  return (
    <div className="shell">
      <aside>
        <a href="/" className="brand">
          🌱 खेत Doctor
        </a>
        <span>OPERATIONS · DEMO</span>
        <nav>
          {sections.map((s) => (
            <button
              className={section === s ? 'active' : ''}
              key={s}
              onClick={() => {
                setSection(s);
                setMessage('');
              }}
            >
              {s}
            </button>
          ))}
        </nav>
        <p>
          Synthetic records only.
          <br />
          Production authentication and role checks are not connected.
        </p>
      </aside>
      <main>
        <header>
          <span>Meerut district / Uttar Pradesh</span>
          <b>ADMIN PREVIEW</b>
        </header>
        <div className="heading">
          <div>
            <p>GROWING TRUST, EVERY DAY</p>
            <h1>{section}</h1>
          </div>
          <span>18 October 2026</span>
        </div>
        {section === 'Overview' ? (
          <>
            <div className="stats">
              {[
                ['12', 'Demo diagnoses'],
                ['40', 'Demo farmers'],
                ['8', 'Land plots'],
                ['6', 'Verified shops'],
              ].map(([v, l]) => (
                <article key={l}>
                  <strong>{v}</strong>
                  <span>{l}</span>
                </article>
              ))}
            </div>
            <section>
              <h2>Trust is the foundation of a good harvest.</h2>
              <p>
                Review partners, keep reference prices sourced and current, and review land notices
                before connecting farmers and owners.
              </p>
              <div className="actions">
                {['Verification', 'Diagnosis labelling', 'State notices'].map((s) => (
                  <button key={s} onClick={() => setSection(s)}>
                    Open {s} →
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h2>Village activity · synthetic demo</h2>
              {[
                ['Rampur', 85],
                ['Kithore', 65],
                ['Mawana', 48],
                ['Kharkhauda', 35],
              ].map(([v, n]) => (
                <div className="bar" key={v}>
                  <span>{v}</span>
                  <i style={{ width: `${n}%` }} />
                  <b>{Math.round(Number(n) / 10)}</b>
                </div>
              ))}
            </section>
          </>
        ) : section === 'Verification' ? (
          <section>
            <h2>Verification queue</h2>
            <p>
              Demo approvals are held in this browser tab only. No production licence has been
              verified.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.name}</strong>
                      <small>{r.detail}</small>
                    </td>
                    <td>{r.type}</td>
                    <td>
                      <em>{r.status}</em>
                    </td>
                    <td>
                      <button
                        disabled={r.status !== 'Pending'}
                        onClick={() => review(r.id, 'Approved')}
                      >
                        Approve
                      </button>
                      <button
                        disabled={r.status !== 'Pending'}
                        onClick={() => review(r.id, 'Rejected')}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : section === 'Diagnosis labelling' ? (
          <section>
            <h2>Expert review · fixed sample</h2>
            <p>Wheat leaf rust · mock confidence 78%. No real farmer image is present.</p>
            <label>
              Expert label
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Crop-qualified label"
              />
            </label>
            <button
              disabled={!label.trim()}
              onClick={() =>
                setMessage(`Demo label saved: ${label}. Not added to a training dataset.`)
              }
            >
              Save demo label
            </button>
          </section>
        ) : section === 'Reference prices' ? (
          <section>
            <h2>Price references need a source and effective date</h2>
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Sample value</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Urea · 45 kg</td>
                  <td>₹266.50 · listing ₹290</td>
                  <td>
                    <em>Above demo MRP</em>
                  </td>
                </tr>
                <tr>
                  <td>Cold storage / quintal / season</td>
                  <td>₹190 · demo reference</td>
                  <td>Authority and notification pending</td>
                </tr>
                <tr>
                  <td>MSP · wheat</td>
                  <td>Not populated</td>
                  <td>Current source and crop season required</td>
                </tr>
              </tbody>
            </table>
            <p>
              All values are illustrative. Publish actual values only after verifying the current
              government notification.
            </p>
          </section>
        ) : section === 'State notices' ? (
          <section>
            <h2>Uttar Pradesh · notice version 1</h2>
            <p>
              Owner and farmer agree lease terms themselves under applicable state law. The app only
              connects them and never creates or stores a lease.
            </p>
            <p>Demo notice only. A state-specific legal review is required before production.</p>
            <button
              onClick={() =>
                setMessage('Notice review saved locally. No production notice was changed.')
              }
            >
              Review notice
            </button>
          </section>
        ) : section === 'Translation review' ? (
          <section>
            <h2>Language review</h2>
            {[
              ['English', 'Draft supplied'],
              ['हिन्दी', 'Independent review required'],
              ['ਪੰਜਾਬੀ', 'Needs translation and review'],
              ['मराठी', 'Needs translation and review'],
            ].map(([l, s]) => (
              <div className="fleet" key={l}>
                <strong>{l}</strong>
                <em>{s}</em>
                <button
                  onClick={() =>
                    setMessage(`${l}: review request preview. No reviewer was notified.`)
                  }
                >
                  Open review
                </button>
              </div>
            ))}
          </section>
        ) : (
          <section>
            <h2>Past-season import preview</h2>
            <p>
              Expected columns: crop, season, yield_per_acre, sowing_offset_days, fertiliser_splits.
              This preview validates numeric values only and never uploads the file.
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 1000000) {
                  setMessage('Choose a CSV below 1 MB.');
                  return;
                }
                const lines = (await file.text()).trim().split(/\r?\n/);
                const headers = lines[0]?.split(',');
                if (
                  headers?.join(',') !==
                  'crop,season,yield_per_acre,sowing_offset_days,fertiliser_splits'
                ) {
                  setMessage('Unexpected headers. Use the documented order.');
                  return;
                }
                const rows = lines
                  .slice(1)
                  .filter(Boolean)
                  .map((l) => l.split(','));
                if (
                  rows.some(
                    (r) =>
                      r.length !== 5 ||
                      r.slice(2).some((v) => v.trim() === '' || !Number.isFinite(Number(v))) ||
                      Number(r[2]) <= 0,
                  )
                ) {
                  setMessage('Invalid row. Numeric values and positive yield required.');
                  return;
                }
                setImportCount(rows.length);
                setMessage(
                  `Validated ${rows.length} synthetic rows locally. Nothing was imported.`,
                );
              }}
            />
            {importCount > 0 && <p>{importCount} valid rows in preview.</p>}
          </section>
        )}
        {message && (
          <div className="message" role="status">
            {message}
          </div>
        )}
        <footer>खेत Doctor · simple choices, private farms, trusted connections.</footer>
      </main>
    </div>
  );
}
