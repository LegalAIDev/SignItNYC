// New Restaurants — DOHMH first-inspection feed with Google Places + Hunter enrichment
const { useState: useRState, useEffect: useREffect, useRef: useRRef } = React;

function RestaurantsView() {
  const raw = (window.VESTIBULE_DATA && window.VESTIBULE_DATA.RESTAURANTS) || [];
  const [rows, setRows]           = useRState(raw);
  const [search, setSearch]       = useRState('');
  const [borFilter, setBorFilter] = useRState('all');
  const [cusFilter, setCusFilter] = useRState('all');
  const [enriching, setEnriching] = useRState(false);
  const [progress, setProgress]   = useRState({ done: 0, total: 0 });
  const [hunterKey, setHunterKey] = useRState(() => localStorage.getItem('hunterApiKey') || '');
  const [showKeyInput, setShowKeyInput] = useRState(false);
  const stopRef = useRRef(false);

  // --- Multi-select for bulk Hunter fetch ----------------------------------
  const [selected, setSelected] = useRState(() => new Set());
  const toggleSelect = (camis) => setSelected(prev => {
    const next = new Set(prev);
    next.has(camis) ? next.delete(camis) : next.add(camis);
    return next;
  });
  const toggleSelectAll = (visibleRows) => setSelected(prev => {
    const next = new Set(prev);
    const allOn = visibleRows.length > 0 && visibleRows.every(r => next.has(r.camis));
    if (allOn) visibleRows.forEach(r => next.delete(r.camis));
    else       visibleRows.forEach(r => next.add(r.camis));
    return next;
  });
  const clearSelection = () => setSelected(new Set());

  // --- Outreach tracking (persisted to localStorage, keyed by CAMIS) -------
  const [statusFilter, setStatusFilter] = useRState('all');
  const [outreach, setOutreach] = useRState(() => {
    try { return JSON.parse(localStorage.getItem('vestibule.outreach') || '{}'); }
    catch (e) { return {}; }
  });
  const [noteOpen, setNoteOpen] = useRState(null);

  const updateOutreach = (camis, patch) => {
    setOutreach(prev => {
      const merged = { ...(prev[camis] || {}), ...patch, updatedAt: new Date().toISOString() };
      // Drop the entry if it carries no signal, so the cache stays tidy.
      const empty = !merged.called && !merged.emailed && !(merged.note && merged.note.trim());
      const next = { ...prev };
      if (empty) delete next[camis]; else next[camis] = merged;
      try { localStorage.setItem('vestibule.outreach', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };
  const toggleOutreach = (camis, field) =>
    updateOutreach(camis, { [field]: !((outreach[camis] || {})[field]) });

  const boroughs  = [...new Set(raw.map(r => r.borough).filter(Boolean))].sort();
  const cuisines  = [...new Set(raw.map(r => r.cuisine).filter(Boolean))].sort();

  const filtered = rows.filter(r => {
    if (borFilter !== 'all' && r.borough !== borFilter) return false;
    if (cusFilter !== 'all' && r.cuisine !== cusFilter) return false;
    if (statusFilter !== 'all') {
      const o = outreach[r.camis] || {};
      const contacted = !!(o.called || o.emailed);
      if (statusFilter === 'contacted'   && !contacted) return false;
      if (statusFilter === 'uncontacted' &&  contacted) return false;
      if (statusFilter === 'called'      && !o.called)  return false;
      if (statusFilter === 'emailed'     && !o.emailed) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.street.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q);
    }
    return true;
  });

  const allFilteredSelected = filtered.length > 0 && filtered.every(r => selected.has(r.camis));
  const someFilteredSelected = filtered.some(r => selected.has(r.camis));

  const withWebsite = rows.filter(r => r.website).length;
  const withEmail   = rows.filter(r => r.email).length;
  const needsHunter = rows.filter(r => r.domain && !r.email).length;
  const contactedCount = rows.filter(r => { const o = outreach[r.camis] || {}; return o.called || o.emailed; }).length;
  // Selected leads that still need an email (what the bulk-selected fetch will target).
  const selectedNeedingEmail = rows.filter(r => selected.has(r.camis) && !r.email);

  const saveHunterKey = (k) => {
    setHunterKey(k);
    localStorage.setItem('hunterApiKey', k);
  };

  // Shared Hunter.io runner. Accepts any list of lead rows and fills in emails.
  const runHunter = async (targets) => {
    if (enriching) return;
    if (!hunterKey) { setShowKeyInput(true); return; }
    targets = (targets || []).filter(t => t && (t.domain || t.name));
    if (!targets.length) return;
    stopRef.current = false;
    setEnriching(true);
    setProgress({ done: 0, total: targets.length });

    for (const target of targets) {
      if (stopRef.current) break;
      try {
        // Prefer domain search; fall back to company-name search when a lead has no website.
        const q = target.domain
          ? `domain=${encodeURIComponent(target.domain)}`
          : `company=${encodeURIComponent(target.name)}`;
        const resp = await fetch(
          `https://api.hunter.io/v2/domain-search?${q}&api_key=${hunterKey}&limit=10`
        );
        const data = await resp.json();
        const emails = (data.data?.emails || []).map(e => e.value).filter(Boolean);
        const foundDomain = data.data?.domain || '';
        if (emails.length) {
          setRows(prev => prev.map(r =>
            r.camis === target.camis
              ? { ...r, email: emails[0], allEmails: emails.join('; '), domain: r.domain || foundDomain }
              : r
          ));
        }
      } catch (e) {
        console.warn('Hunter error for', target.domain || target.name, e);
      }
      setProgress(p => ({ ...p, done: p.done + 1 }));
      await new Promise(res => setTimeout(res, 200));
    }
    setEnriching(false);
  };

  // Bulk: every lead with a domain but no email yet.
  const findEmails = () => runHunter(rows.filter(r => r.domain && !r.email));
  // One specific company (by domain if known, else by company name).
  const findEmailOne = (row) => runHunter([row]);
  // Just the checked leads that still need an email.
  const findEmailsSelected = () => runHunter(selectedNeedingEmail);

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  // Export the CURRENT filtered view (incl. outreach status) to Excel.
  const exportList = () => {
    if (!filtered.length) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const data = filtered.map(r => {
      const o = outreach[r.camis] || {};
      return {
        'First Inspection': r.firstInspection || '',
        'Name': r.name || '',
        'Cuisine': r.cuisine || '',
        'Borough': r.borough || '',
        'Address': `${r.building || ''} ${r.street || ''}`.trim(),
        'Zipcode': r.zipcode || '',
        'Phone': r.phone || '',
        'Website': r.website || '',
        'Email': r.email || '',
        'All Emails': r.allEmails || '',
        'Called': o.called ? 'Yes' : '',
        'Emailed': o.emailed ? 'Yes' : '',
        'Last Contact': o.updatedAt ? o.updatedAt.slice(0, 10) : '',
        'Note': o.note || '',
        'CAMIS': r.camis || '',
      };
    });

    // Preferred: real .xlsx via SheetJS (loaded from CDN in the host page).
    if (window.XLSX) {
      const ws = window.XLSX.utils.json_to_sheet(data);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, 'Leads');
      window.XLSX.writeFile(wb, `vestibule-leads-${stamp}.xlsx`);
      return;
    }

    // Fallback: CSV (opens in Excel) if SheetJS isn't available.
    const headers = Object.keys(data[0]);
    const esc = (v) => {
      const s = String(v == null ? '' : v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(','), ...data.map(row => headers.map(h => esc(row[h])).join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `vestibule-leads-${stamp}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!raw.length) {
    return (
      <div className="content">
        <div className="subpane" style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:300}}>
          <div style={{textAlign:'center', color:'var(--ink-mute)'}}>
            <div style={{fontSize:32, marginBottom:12}}>⊡</div>
            <div style={{fontWeight:500, marginBottom:6}}>No restaurant data loaded</div>
            <div style={{fontSize:12}}>Run <span className="mono">python enrich_restaurants.py</span> to generate data-restaurants.jsx</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      {/* Header bar */}
      <div className="weekly-head">
        <div className="left">
          <h3>New restaurants — DOHMH first inspections</h3>
          <div className="sub">
            {rows.length} establishments · {withWebsite} with website · {withEmail} with email
            {' · '}last 90 days · Brooklyn + Manhattan
          </div>
        </div>
        <div className="stats">
          <div className="stat"><div className="v">{rows.length}</div><div className="l">Total</div></div>
          <div className="stat"><div className="v">{withWebsite}</div><div className="l">Website</div></div>
          <div className="stat"><div className="v" style={{color: withEmail ? 'var(--green)' : undefined}}>{withEmail}</div><div className="l">Email</div></div>
          <div className="stat"><div className="v" style={{color: contactedCount ? 'var(--blue)' : 'var(--ink-mute)'}}>{contactedCount}</div><div className="l">Contacted</div></div>
          <div className="stat"><div className="v" style={{color:'var(--ink-mute)'}}>{needsHunter}</div><div className="l">Remaining</div></div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{padding:'10px 22px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid var(--rule)'}}>
        <input
          style={{padding:'5px 10px', border:'1px solid var(--rule)', borderRadius:4, fontSize:12, width:220, fontFamily:'var(--font-sans)'}}
          placeholder="Search name, street, cuisine…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          style={{padding:'5px 8px', border:'1px solid var(--rule)', borderRadius:4, fontSize:12, fontFamily:'var(--font-sans)'}}
          value={borFilter} onChange={e => setBorFilter(e.target.value)}
        >
          <option value="all">All boroughs</option>
          {boroughs.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select
          style={{padding:'5px 8px', border:'1px solid var(--rule)', borderRadius:4, fontSize:12, fontFamily:'var(--font-sans)', maxWidth:180}}
          value={cusFilter} onChange={e => setCusFilter(e.target.value)}
        >
          <option value="all">All cuisines</option>
          {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          style={{padding:'5px 8px', border:'1px solid var(--rule)', borderRadius:4, fontSize:12, fontFamily:'var(--font-sans)'}}
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          title="Filter by outreach status"
        >
          <option value="all">All status</option>
          <option value="uncontacted">Not contacted</option>
          <option value="contacted">Contacted</option>
          <option value="called">Called</option>
          <option value="emailed">Emailed</option>
        </select>
        <span style={{color:'var(--ink-mute)', fontSize:12}} className="mono">{filtered.length} shown</span>
        <button className="btn small" onClick={exportList} disabled={!filtered.length} title="Export current view to Excel">⬇ Export</button>
        <span style={{flex:1}}/>

        {/* Hunter key input */}
        {showKeyInput && (
          <input
            style={{padding:'5px 10px', border:'1px solid var(--orange)', borderRadius:4, fontSize:12, width:280, fontFamily:'var(--font-mono)'}}
            placeholder="Paste Hunter.io API key…"
            defaultValue={hunterKey}
            onBlur={e => { saveHunterKey(e.target.value); setShowKeyInput(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { saveHunterKey(e.target.value); setShowKeyInput(false); }}}
            autoFocus
          />
        )}

        {/* Progress bar */}
        {enriching && (
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <div style={{width:120, height:6, background:'var(--rule)', borderRadius:3, overflow:'hidden'}}>
              <div style={{width:`${pct}%`, height:'100%', background:'var(--green)', transition:'width 0.2s'}}/>
            </div>
            <span className="mono" style={{fontSize:11, color:'var(--ink-mute)'}}>{progress.done}/{progress.total}</span>
            <button className="btn small ghost" style={{color:'var(--red)'}} onClick={() => stopRef.current = true}>Stop</button>
          </div>
        )}

        {selected.size > 0 && (
          <button
            className={`btn small ${enriching ? '' : 'accent'}`}
            disabled={enriching || selectedNeedingEmail.length === 0}
            onClick={findEmailsSelected}
            title="Fetch emails for the checked leads via Hunter.io"
          >
            {enriching ? 'Finding…' : `Find emails · ${selectedNeedingEmail.length} of ${selected.size} selected`}
          </button>
        )}
        {selected.size > 0 && (
          <button className="btn small ghost" onClick={clearSelection} title="Clear selection">✕ Clear</button>
        )}
        <button className="btn small" onClick={() => setShowKeyInput(v => !v)} title="Set Hunter API key">⚙ Hunter key</button>
        <button
          className={`btn small ${enriching ? '' : 'primary'}`}
          disabled={enriching || needsHunter === 0}
          onClick={findEmails}
          title="Fetch emails for every lead that has a website but no email yet"
        >
          {enriching ? 'Finding…' : `Find all (${needsHunter})`}
        </button>
      </div>

      {/* Table */}
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
          <thead>
            <tr style={{borderBottom:'2px solid var(--rule)', textAlign:'left'}}>
              <th style={{padding:'8px 8px 8px 12px', width:28}}>
                <input type="checkbox"
                  style={{accentColor:'var(--ink)', cursor:'pointer'}}
                  checked={allFilteredSelected}
                  ref={el => { if (el) el.indeterminate = !allFilteredSelected && someFilteredSelected; }}
                  onChange={() => toggleSelectAll(filtered)}
                  title="Select all (current view)"/>
              </th>
              {['First inspection','Name','Cuisine','Borough','Address','Phone','Website','Email','Outreach'].map(h => (
                <th key={h} style={{padding:'8px 12px', fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, color:'var(--ink-mute)', whiteSpace:'nowrap'}}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.camis} style={{borderBottom:'1px solid var(--rule)', background: selected.has(r.camis) ? 'var(--blue-pale,#e8f0fe)' : (i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.012)')}}>
                <td style={{padding:'8px 8px 8px 12px', width:28}}>
                  <input type="checkbox"
                    style={{accentColor:'var(--ink)', cursor:'pointer'}}
                    checked={selected.has(r.camis)}
                    onChange={() => toggleSelect(r.camis)}
                    title="Select for bulk email fetch"/>
                </td>
                <td style={{padding:'8px 12px', whiteSpace:'nowrap', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-mute)'}}>{r.firstInspection}</td>
                <td style={{padding:'8px 12px', fontWeight:500, maxWidth:200}}>{r.name}</td>
                <td style={{padding:'8px 12px', color:'var(--ink-mute)', whiteSpace:'nowrap'}}>{r.cuisine}</td>
                <td style={{padding:'8px 12px', whiteSpace:'nowrap'}}>
                  <span style={{
                    padding:'2px 6px', borderRadius:3, fontSize:10, fontFamily:'var(--font-mono)', fontWeight:600,
                    background: r.borough === 'Brooklyn' ? 'var(--blue-pale,#e8f0fe)' : 'var(--amber-pale,#fef3e0)',
                    color: r.borough === 'Brooklyn' ? 'var(--blue,#1a56db)' : 'var(--amber,#b45309)',
                  }}>{r.borough}</span>
                </td>
                <td style={{padding:'8px 12px', color:'var(--ink-mute)', whiteSpace:'nowrap'}}>{r.building} {r.street}</td>
                <td style={{padding:'8px 12px', fontFamily:'var(--font-mono)', fontSize:11, whiteSpace:'nowrap'}}>{r.phone || '—'}</td>
                <td style={{padding:'8px 12px', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                  {r.website
                    ? <a href={r.website} target="_blank" rel="noopener noreferrer" style={{color:'var(--blue)', textDecoration:'none', fontSize:11}}>{r.domain}</a>
                    : <span style={{color:'var(--ink-mute)'}}>—</span>
                  }
                </td>
                <td style={{padding:'8px 12px', fontFamily:'var(--font-mono)', fontSize:11, verticalAlign:'top'}}>
                  {(() => {
                    const emails = (r.allEmails ? r.allEmails.split(/;\s*/) : (r.email ? [r.email] : []))
                      .map(s => s.trim()).filter(Boolean);
                    if (!emails.length) {
                      return (
                        <button className="track-chip find"
                          disabled={enriching}
                          onClick={() => findEmailOne(r)}
                          title={r.domain
                            ? `Find emails for ${r.domain} via Hunter.io`
                            : `Find emails for "${r.name}" via Hunter.io (by company name)`}>
                          ✦ Find email{r.domain ? '' : 's'}
                        </button>
                      );
                    }
                    return (
                      <div style={{display:'flex', flexDirection:'column', gap:2, whiteSpace:'nowrap'}}>
                        {emails.map((em, idx) => (
                          <a key={em} href={`mailto:${em}`}
                            style={{color:'var(--green-deep)', textDecoration:'none', opacity: idx === 0 ? 1 : 0.72}}
                            title={idx === 0 ? 'Primary contact' : 'Additional contact'}>{em}</a>
                        ))}
                        {emails.length > 1 && (
                          <span style={{fontSize:9.5, color:'var(--ink-mute)', fontFamily:'var(--font-mono)'}}>
                            {emails.length} addresses
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td style={{padding:'8px 12px', whiteSpace:'nowrap'}}>
                  {(() => {
                    const o = outreach[r.camis] || {};
                    return (
                      <div style={{display:'flex', alignItems:'center', gap:6}}>
                        <button className={`track-chip ${o.called ? 'on' : ''}`}
                          onClick={() => toggleOutreach(r.camis, 'called')}
                          title={o.called && o.updatedAt ? `Called · ${o.updatedAt.slice(0,10)}` : 'Mark as called'}>📞 Called</button>
                        <button className={`track-chip ${o.emailed ? 'on' : ''}`}
                          onClick={() => toggleOutreach(r.camis, 'emailed')}
                          title={o.emailed && o.updatedAt ? `Emailed · ${o.updatedAt.slice(0,10)}` : 'Mark as emailed'}>✉ Emailed</button>
                        <button className={`track-chip note ${o.note ? 'on' : ''}`}
                          onClick={() => setNoteOpen(noteOpen === r.camis ? null : r.camis)}
                          title={o.note || 'Add note'}>📝</button>
                        {noteOpen === r.camis && (
                          <input autoFocus defaultValue={o.note || ''} placeholder="Note…"
                            onBlur={e => { updateOutreach(r.camis, { note: e.target.value }); setNoteOpen(null); }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { updateOutreach(r.camis, { note: e.target.value }); setNoteOpen(null); }
                              if (e.key === 'Escape') setNoteOpen(null);
                            }}
                            style={{padding:'3px 7px', border:'1px solid var(--orange)', borderRadius:4, fontSize:11, width:150, fontFamily:'var(--font-sans)'}}/>
                        )}
                      </div>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{padding:40, textAlign:'center', color:'var(--ink-mute)', fontSize:12}}>No results match your filters.</div>
        )}
      </div>
    </div>
  );
}

window.RestaurantsView = RestaurantsView;
