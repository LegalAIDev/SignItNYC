// Dashboard view — KPIs, activity, funnel sparkline, mini map
function DashboardView({ onSelect, goTo }) {
  const { PERMITS, ARCHITECTS, ACTIVITY, WEEKLY_METRICS } = window.VESTIBULE_DATA;

  const handleActivityClick = (a) => {
    if (!a.ref) return;
    // Permit ID pattern: B00... ; architect: a1, a2...; otherwise treat as view name
    if (/^B\d/.test(a.ref)) {
      const p = PERMITS.find(x => x.id === a.ref);
      if (p) onSelect(p);
    } else if (/^a\d/.test(a.ref)) {
      goTo('architects', { archId: a.ref });
    } else {
      goTo(a.ref);
    }
  };

  const newThisWeek = PERMITS.filter(p => p.filed <= 7).length;
  const hot = PERMITS.filter(p => p.sla === 'pending' && p.stage !== 'dropped').length;
  const inFlight = PERMITS.filter(p => ['contacted','meeting'].includes(p.stage)).length;
  const wonValue = PERMITS.filter(p => p.stage === 'won').reduce((s,p)=>s+parseFloat(p.est.replace(/[^0-9.]/g,'')||0),0);

  const topArchs = [...ARCHITECTS].sort((a,b)=>b.projects-a.projects).slice(0,5);

  const activityColor = {
    permit: '#7A7268', sla:'#E85C2A', reply:'#3D6FB0',
    meeting:'#C49A3D', won:'#5A8A4C', dropped:'#9B9088', send:'#3D6FB0',
  };

  return (
    <div className="content">
      <div className="dash-kpis" style={{padding:'18px 22px 0 22px'}}>
        <div className="kpi">
          <div className="kpi-label">New this week</div>
          <div className="kpi-value">{newThisWeek}</div>
          <div className="kpi-spark"><Sparkline data={WEEKLY_METRICS.map(w=>w.pulled)} w={140} h={28} color="#0F1419" fill/></div>
          <div className="kpi-foot"><span className="kpi-delta up">+24%</span> vs last week · 12-wk trend</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Hot (SLA pending)</div>
          <div className="kpi-value">{hot}</div>
          <div className="kpi-spark"><Sparkline data={WEEKLY_METRICS.map(w=>w.qualified)} w={140} h={28} color="#E85C2A" fill/></div>
          <div className="kpi-foot"><span className="kpi-delta up">+3</span> since Monday · 4 newly matched</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">In conversation</div>
          <div className="kpi-value">{inFlight}</div>
          <div className="kpi-spark"><Sparkline data={WEEKLY_METRICS.map(w=>w.contacted)} w={140} h={28} color="#3D6FB0" fill/></div>
          <div className="kpi-foot">3 awaiting reply · 2 site walks Tue/Wed</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Won this quarter</div>
          <div className="kpi-value">${(wonValue/1000).toFixed(1)}k</div>
          <div className="kpi-spark"><Sparkline data={WEEKLY_METRICS.map(w=>w.revenue/1000)} w={140} h={28} color="#5A8A4C" fill/></div>
          <div className="kpi-foot">3 PO's signed · avg ticket $10.4k</div>
        </div>
      </div>

      <div className="dash-grid">
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <div className="card">
            <div className="card-head">
              <h3>This week's lead flow</h3>
              <span className="head-sub">DOB → SLA → site → outreach</span>
              <span style={{flex:1}}></span>
              <button className="btn small" onClick={()=>goTo('weekly')}>Open weekly pull →</button>
            </div>
            <div className="card-body">
              <Funnel/>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Top relationship leverage</h3>
              <span className="head-sub">One contact = many leads</span>
              <span style={{flex:1}}></span>
            </div>
            <LeverageTabs goTo={goTo}/>
          </div>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <div className="card">
            <div className="card-head">
              <h3>Activity</h3>
              <span className="head-sub">Live</span>
              <span style={{flex:1}}></span>
              <span className="mono" style={{fontSize:10, color:'var(--ink-mute)'}}>auto-refresh 5m</span>
            </div>
            <div className="card-body tight">
              <div className="activity-list">
                {ACTIVITY.map(a => (
                  <div key={a.id} className="activity-item" onClick={()=>handleActivityClick(a)} style={{cursor: a.ref ? 'pointer' : 'default'}}>
                    <div className="when">{a.when}</div>
                    <div className="text">
                      <span className="activity-icon" style={{background: activityColor[a.type] || '#999'}}></span>
                      {a.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Geography</h3><span className="head-sub">Active leads by borough</span></div>
            <div className="card-body">
              <BoroMap permits={PERMITS.filter(p=>p.stage!=='dropped')}/>
              <div style={{display:'flex', gap:12, marginTop:10, flexWrap:'wrap', fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--ink-3)'}}>
                {window.VESTIBULE_DATA.STAGES.filter(s=>s.id!=='dropped').map(s=>(
                  <span key={s.id} style={{display:'inline-flex', alignItems:'center', gap:5}}>
                    <span style={{width:7, height:7, borderRadius:'50%', background:s.color}}></span>
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Funnel() {
  const { PERMITS } = window.VESTIBULE_DATA;
  const stages = [
    { id:'all',       label:'Permits filed (30d)', value: PERMITS.length, color:'#7A7268' },
    { id:'sla',       label:'SLA pending — actively opening', value: PERMITS.filter(p=>p.sla==='pending').length, color:'#E85C2A' },
    { id:'enriched',  label:'Site check passed',   value: PERMITS.filter(p=>p.site!=='has-vest').length, color:'#C49A3D' },
    { id:'contacted', label:'Architect contacted', value: PERMITS.filter(p=>['contacted','meeting','won'].includes(p.stage)).length, color:'#3D6FB0' },
    { id:'won',       label:'PO signed',           value: PERMITS.filter(p=>p.stage==='won').length, color:'#5A8A4C' },
  ];
  const max = stages[0].value;
  return (
    <div style={{display:'flex', flexDirection:'column', gap:10}}>
      {stages.map((s,i) => {
        const w = (s.value / max) * 100;
        return (
          <div key={s.id} style={{display:'grid', gridTemplateColumns:'200px 1fr 60px', gap:14, alignItems:'center'}}>
            <div style={{fontSize:12, color:'var(--ink-2)'}}>{s.label}</div>
            <div style={{height:22, background:'var(--paper-2)', borderRadius:2, position:'relative'}}>
              <div style={{
                position:'absolute', left:0, top:0, bottom:0,
                width: w+'%',
                background: s.color,
                borderRadius:2,
              }}/>
              <div style={{position:'absolute', left:10, top:0, bottom:0, display:'flex', alignItems:'center', fontFamily:'var(--font-mono)', fontSize:11, color:'#fff', mixBlendMode:'screen'}}>
                {i > 0 ? Math.round((s.value/stages[i-1].value)*100) + '% pass' : ''}
              </div>
            </div>
            <div className="mono" style={{textAlign:'right', fontSize:14, fontWeight:500}}>{s.value}</div>
          </div>
        );
      })}
    </div>
  );
}

function LeverageTabs({ goTo }) {
  const { ARCHITECTS, ACCOUNTS, PROPERTIES, PERMITS } = window.VESTIBULE_DATA;
  const [tab, setTab] = React.useState('arch');

  const archs = [...ARCHITECTS].sort((a,b)=>b.projects-a.projects).slice(0,5);
  const accts = [...ACCOUNTS].sort((a,b)=>b.openings-a.openings || b.locations-a.locations).slice(0,5);
  const props = [...PROPERTIES].sort((a,b)=>b.permits-a.permits).slice(0,5);

  return (
    <>
      <div style={{display:'flex', borderBottom:'1px solid var(--rule)', padding:'0 14px', background:'var(--paper-2)'}}>
        {[
          ['arch','Architects + Expediters',ARCHITECTS.length],
          ['acct','Hotel + Resto groups',ACCOUNTS.length],
          ['prop','Property owners',PROPERTIES.length],
        ].map(([id,label,n])=>(
          <div key={id}
               className={`tab ${tab===id?'active':''}`}
               style={{padding:'10px 12px'}}
               onClick={()=>setTab(id)}>
            {label} <span style={{marginLeft:6,color:'var(--ink-mute)'}}>{n}</span>
          </div>
        ))}
        <span style={{flex:1}}></span>
        <button className="btn small ghost" style={{margin:'6px 0'}} onClick={()=>{
          if (tab==='arch') goTo('architects');
          else if (tab==='acct') goTo('accounts');
          else goTo('properties');
        }}>All →</button>
      </div>

      <div className="card-body tight">
        {tab === 'arch' && (
          <div className="arch-mini">
            {archs.map(a => {
              const initials = a.name.split(' ').map(x=>x[0]).slice(0,2).join('');
              const myLeads = PERMITS.filter(p=>p.arch===a.id).length;
              return (
                <div key={a.id} className="arch-mini-row" onClick={()=>goTo('architects', a.id)}>
                  <div className="avatar" style={{width:32, height:32}}>{initials}</div>
                  <div>
                    <div className="arch-mini-name">{a.name}</div>
                    <div className="arch-mini-firm">{a.firm}</div>
                  </div>
                  <RelationshipPill rel={a.relationship}/>
                  <div style={{textAlign:'right'}}>
                    <div className="arch-mini-count">{myLeads} <span style={{color:'var(--ink-mute)'}}>open</span></div>
                    <div className="mono" style={{fontSize:10, color:'var(--ink-mute)'}}>{a.projects} total · {a.replied} replied</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'acct' && (
          <div className="arch-mini">
            {accts.map(a => {
              const initials = a.short.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
              const myLeads = PERMITS.filter(p=>p.accountId===a.id).length;
              return (
                <div key={a.id} className="arch-mini-row" onClick={()=>goTo('accounts', { acctId: a.id })}>
                  <div className="avatar" style={{width:32, height:32, fontSize:11, background: a.kind==='hotel'?'var(--blue)':'var(--orange)'}}>{initials}</div>
                  <div>
                    <div className="arch-mini-name">{a.name}</div>
                    <div className="arch-mini-firm">{a.locations} loc · {a.brands.slice(0,2).join(' · ')}</div>
                  </div>
                  <RelationshipPill rel={a.relationship}/>
                  <div style={{textAlign:'right'}}>
                    <div className="arch-mini-count" style={{color: a.openings>0?'var(--orange)':'var(--ink-2)'}}>
                      {a.openings} <span style={{color:'var(--ink-mute)'}}>live</span>
                    </div>
                    <div className="mono" style={{fontSize:10, color:'var(--ink-mute)'}}>{myLeads} permits · ${(a.revenue/1000).toFixed(1)}k closed</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'prop' && (
          <div className="arch-mini">
            {props.map(p => {
              const initials = p.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
              const myLeads = PERMITS.filter(per=>per.propertyId===p.id).length;
              return (
                <div key={p.id} className="arch-mini-row" onClick={()=>goTo('properties', { propId: p.id })}>
                  <div className="avatar" style={{width:32, height:32, fontSize:11, background:'var(--ink-2)'}}>{initials}</div>
                  <div>
                    <div className="arch-mini-name">{p.name}</div>
                    <div className="arch-mini-firm">{p.portfolio}</div>
                  </div>
                  <RelationshipPill rel={p.relationship}/>
                  <div style={{textAlign:'right'}}>
                    <div className="arch-mini-count">{myLeads} <span style={{color:'var(--ink-mute)'}}>permits</span></div>
                    <div className="mono" style={{fontSize:10, color:'var(--ink-mute)'}}>{p.primary}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

window.DashboardView = DashboardView;