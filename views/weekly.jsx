// Weekly pull — triage queue for new permits
function WeeklyView({ onSelect, goTo }) {
  const { PERMITS } = window.VESTIBULE_DATA;
  const fresh = PERMITS.filter(p => p.filed <= 7).sort((a,b)=> a.filed - b.filed || b.score - a.score);
  const hot = fresh.filter(p => p.sla === 'pending');
  const permitOnly = fresh.filter(p => p.sla === 'none');
  const dropped = PERMITS.filter(p => p.stage === 'dropped' && p.filed <= 14);

  return (
    <div className="content">
      <div className="weekly-head">
        <div className="left">
          <h3>Week of May 18 — DOB pull</h3>
          <div className="sub">{fresh.length} new permits · {hot.length} SLA-matched · {dropped.length} site-dropped · 88 minutes saved this week</div>
        </div>
        <div className="stats">
          <div className="stat"><div className="v" style={{color:'var(--orange)'}}>{hot.length}</div><div className="l">Hot</div></div>
          <div className="stat"><div className="v">{permitOnly.length}</div><div className="l">Permit only</div></div>
          <div className="stat"><div className="v" style={{color:'var(--ink-mute)'}}>{dropped.length}</div><div className="l">Dropped</div></div>
          <div className="stat"><div className="v" style={{color:'var(--green-deep)'}}>${(fresh.reduce((s,p)=>s+parseFloat(p.est.replace(/[^0-9.]/g,'')||0),0)).toFixed(0)}k</div><div className="l">TAM</div></div>
        </div>
      </div>

      <div style={{padding:'14px 22px 6px', display:'flex', alignItems:'center', gap:10}}>
        <h4 className="serif" style={{margin:0, fontSize:22, fontWeight:400, letterSpacing:'-0.3px'}}>Triage queue</h4>
        <span className="mono" style={{fontSize:10.5, color:'var(--ink-mute)'}}>HOT FIRST — REVIEW + PROMOTE / CONTACT / DROP</span>
        <span style={{flex:1}}></span>
        <button className="btn small">Export CSV</button>
        <button className="btn small primary">Run pull now</button>
      </div>

      <div className="triage">
        <div className="triage-list">
          {hot.map(p => (
            <div key={p.id} className="triage-card">
              <div className="left">
                <div className="meta">
                  <JobStamp job={p.job}/>
                  <BoroChip boro={p.boro}/>
                  <SlaBadge sla={p.sla}/>
                  <SiteBadge site={p.site}/>
                  <span className="mono" style={{fontSize:10.5, color:'var(--ink-mute)'}}>{p.filed===0?'filed today':'filed '+p.filed+'d ago'}</span>
                </div>
                <h4>{p.biz}</h4>
                <div className="addr">{p.addr} · {p.llc}</div>
                <div className="meta">
                  <span style={{display:'flex', alignItems:'center', gap:6}}>
                    <span className="mono" style={{fontSize:10, color:'var(--ink-mute)'}}>HEAT</span>
                    <Score value={p.score}/>
                  </span>
                  <span style={{display:'flex', alignItems:'center', gap:6}}>
                    <span className="mono" style={{fontSize:10, color:'var(--ink-mute)'}}>EST</span>
                    <span className="mono" style={{fontWeight:500}}>{p.est}</span>
                  </span>
                  <span style={{display:'flex', alignItems:'center', gap:6}}>
                    <span className="mono" style={{fontSize:10, color:'var(--ink-mute)'}}>ARCH</span>
                    <span>{ARCH_BY_ID[p.arch]?.name.split(',')[0]}</span>
                    <RelationshipPill rel={ARCH_BY_ID[p.arch]?.relationship}/>
                  </span>
                </div>
                <div className="actions">
                  <button className="btn small accent" onClick={()=>onSelect(p)}>Open lead</button>
                  <button className="btn small">Draft outreach</button>
                  <button className="btn small ghost">Snooze 1w</button>
                  <button className="btn small ghost" style={{color:'var(--red)'}}>Drop</button>
                </div>
              </div>
              <div className="right">
                <StreetViewPlaceholder permit={p} w={200} h={130}/>
                <div className="mono" style={{fontSize:9.5, color:'var(--ink-mute)', marginTop:6, textAlign:'center'}}>STREET VIEW — Auto-fetched</div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="card" style={{marginBottom:14}}>
            <div className="card-head"><h3>Skipped — permit only</h3><span className="head-sub">Long cycle. Reminder in 30d.</span></div>
            <div className="card-body tight">
              {permitOnly.map(p => (
                <div key={p.id} style={{padding:'10px 14px', borderBottom:'1px solid var(--rule)', cursor:'pointer'}} onClick={()=>onSelect(p)}>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:2}}>
                    <span style={{fontWeight:500, fontSize:13}}>{p.biz}</span>
                    <JobStamp job={p.job}/>
                  </div>
                  <div className="mono" style={{fontSize:10.5, color:'var(--ink-mute)'}}>{p.addr} · {p.filed===0?'today':p.filed+'d ago'}</div>
                </div>
              ))}
              {permitOnly.length === 0 && <div style={{padding:14, color:'var(--ink-mute)', fontSize:12}}>Nothing skipped this week.</div>}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Dropped on site check</h3><span className="head-sub">Recorded for next time</span></div>
            <div className="card-body tight">
              {dropped.map(p => (
                <div key={p.id} style={{padding:'10px 14px', borderBottom:'1px solid var(--rule)'}}>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:2}}>
                    <span style={{fontWeight:500, fontSize:13, textDecoration:'line-through', color:'var(--ink-mute)'}}>{p.biz}</span>
                  </div>
                  <div className="mono" style={{fontSize:10.5, color:'var(--ink-mute)'}}>{p.addr} — existing vestibule</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.WeeklyView = WeeklyView;
