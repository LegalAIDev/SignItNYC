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

  const boroughs  = [...new Set(raw.map(r => r.borough).filter(Boolean))].sort();
  const cuisines  = [...new Set(raw.map(r => r.cuisine).filter(Boolean))].sort();

  const filtered = rows.filter(r => {
    if (borFilter !== 'all' && r.borough !== borFilter) return false;
    if (cusFilter !== 'all' && r.cuisine !== cusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.street.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q);
    }
    return true;
  });

  const withWebsite = rows.filter(r => r.website).length;
  const withEmail   = rows.filter(r => r.email).length;
  const needsHunter = rows.filter(r => r.domain && !r.email).length;

  const saveHunterKey = (k) => {
    setHunterKey(k);
    localStorage.setItem('hunterApiKey', k);
  };

  const findEmails = async () => {
    if (!hunterKey) { setShowKeyInput(true); return; }
    const targets = rows.filter(r => r.domain && !r.email);
    if (!targets.length) return;
    stopRef.current = false;
    setEnriching(true);
    setProgress({ done: 0, total: targets.length });

    for (const target of targets) {
      if (stopRef.current) break;
      try {
        const resp = await fetch(
          `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(target.domain)}&api_key=${hunterKey}&limit=10`
        );
        const data = await resp.json();
        const emails = (data.data?.emails || []).map(e => e.value).filter(Boolean);
        if (emails.length) {
          setRows(prev => prev.map(r =>
            r.camis === target.camis
              ? { ...r, email: emails[0], allEmails: emails.join('; ') }
              : r
          ));
        }
      } catch (e) {
        console.warn('Hunter error for', target.domain, e);
      }
      setProgress(p => ({ ...p, done: p.done + 1 }));
      await new Promise(res => setTimeout(res, 200));
    }
    setEnriching(false);
  };

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

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
        <span style={{color:'var(--ink-mute)', fontSize:12}} className="mono">{filtered.length} shown</span>
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

        <button className="btn small" onClick={() => setShowKeyInput(v => !v)} title="Set Hunter API key">⚙ Hunter key</button>
        <button
          className={`btn small ${enriching ? '' : 'primary'}`}
          disabled={enriching || needsHunter === 0}
          onClick={findEmails}
        >
          {enriching ? 'Finding…' : `Find emails (${needsHunter})`}
        </button>
      </div>

      {/* Table */}
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
          <thead>
            <tr style={{borderBottom:'2px solid var(--rule)', textAlign:'left'}}>
              {['First inspection','Name','Cuisine','Borough','Address','Phone','Website','Email'].map(h => (
                <th key={h} style={{padding:'8px 12px', fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, color:'var(--ink-mute)', whiteSpace:'nowrap'}}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.camis} style={{borderBottom:'1px solid var(--rule)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.012)'}}>
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
                <td style={{padding:'8px 12px', fontFamily:'var(--font-mono)', fontSize:11, whiteSpace:'nowrap'}}>
                  {r.email
                    ? <a href={`mailto:${r.email}`} style={{color:'var(--green-deep)', textDecoration:'none'}}>{r.email}</a>
                    : r.domain
                      ? <span style={{color:'var(--ink-mute)'}}>—</span>
                      : <span style={{color:'var(--rule)'}}>no site</span>
                  }
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
