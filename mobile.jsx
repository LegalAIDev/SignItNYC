// Mobile companion — 3 screens shown in iOS device frames on a design canvas
const { useState: useMobState } = React;

// ─────────────────────────────────────────────────────────────
// Screen 1 — Today (Monday morning briefing, mobile)
// ─────────────────────────────────────────────────────────────
function MobileToday() {
  const { PERMITS, ACTIVITY } = window.VESTIBULE_DATA;
  const newToday = PERMITS.filter(p=>p.filed===0).slice(0,3);
  const hot      = PERMITS.filter(p=>p.sla==='pending'&&p.filed<=3&&p.stage==='qualified').slice(0,3);
  const awaiting = PERMITS.filter(p=>p.stage==='contacted'&&(p.contactedDays||0)>=4)
                          .sort((a,b)=>(b.contactedDays||0)-(a.contactedDays||0)).slice(0,2);
  const total = newToday.length + hot.length + awaiting.length;

  return (
    <div className="m-screen">
      <div className="m-topbar">
        <svg className="logo-mark" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" stroke="#0F1419" strokeWidth="1.5"/>
          <rect x="9" y="9" width="6" height="12" fill="#0F1419"/>
          <line x1="9" y1="3" x2="9" y2="9" stroke="#0F1419" strokeWidth="1.5"/>
          <line x1="15" y1="3" x2="15" y2="9" stroke="#0F1419" strokeWidth="1.5"/>
        </svg>
        <h1>Vestibule</h1>
        <span className="sub">MON · 7:14</span>
        <div className="bell">◔<div className="dot"></div></div>
      </div>

      <div className="m-body">
        <div className="m-greet">
          <div className="crumb">MORNING BRIEFING</div>
          <h2>Good morning,<br/>Jonah.</h2>
          <p>Overnight: <strong>{newToday.length} new permits</strong>, <strong>{hot.length} fresh SLA matches</strong>, and <strong>{awaiting.length} follow-ups</strong> due. ~{total*4}m to clear.</p>
        </div>

        <div className="m-section-head">
          <div><span className="tag" style={{color:'var(--ink)'}}>DO FIRST</span><h3>New since Friday</h3></div>
          <span className="ct">{newToday.length} permits</span>
        </div>
        <div className="m-card">
          {newToday.map(p => <MRow key={p.id} permit={p} kind="new" right={<><span className="mono">filed today</span><div><Score value={p.score}/></div></>}/>)}
        </div>

        <div className="m-section-head">
          <div><span className="tag" style={{color:'var(--orange)'}}>HOT</span><h3>Liquor licenses matched</h3></div>
          <span className="ct">{hot.length} hot</span>
        </div>
        <div className="m-card">
          {hot.map(p => <MRow key={p.id} permit={p} kind="hot" right={<><SlaBadge sla="pending"/><div className="mono" style={{marginTop:4}}>filed {p.filed}d ago</div></>}/>)}
        </div>

        <div className="m-section-head">
          <div><span className="tag" style={{color:'var(--blue)'}}>NUDGE</span><h3>Awaiting reply</h3></div>
          <span className="ct">{awaiting.length} due</span>
        </div>
        <div className="m-card">
          {awaiting.map(p => <MRow key={p.id} permit={p} right={<><span className="mono" style={{color: (p.contactedDays||0)>=10 ? 'var(--red)' : 'var(--ink-mute)'}}>sent {p.contactedDays}d ago</span><div><JobStamp job={p.job}/></div></>}/>)}
        </div>
      </div>

      <MTabBar active="today" badge={total}/>
    </div>
  );
}

function MRow({ permit, kind, right }) {
  return (
    <div className={`m-row ${kind||''}`}>
      <div className="av">{permit.biz.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</div>
      <div className="meta">
        <div className="biz">{permit.biz}</div>
        <div className="addr">{permit.addr} · {permit.boro}</div>
      </div>
      <div className="right">{right}</div>
    </div>
  );
}

function MTabBar({ active, badge }) {
  const tabs = [
    { id:'today',    ic:'◑', lb:'Today' },
    { id:'pipeline', ic:'▦', lb:'Pipeline' },
    { id:'search',   ic:'⌕', lb:'Search' },
    { id:'me',       ic:'◇', lb:'Me' },
  ];
  return (
    <div className="m-tabbar">
      {tabs.map(t => (
        <div key={t.id} className={`m-tab ${active===t.id?'active':''}`} style={{position:'relative'}}>
          <span className="ic">{t.ic}</span>
          <span className="lb">{t.lb}</span>
          {t.id==='today' && badge>0 && <span className="badge">{badge}</span>}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Screen 2 — Lead detail (mobile)
// ─────────────────────────────────────────────────────────────
function MobileLeadDetail() {
  const { PERMITS } = window.VESTIBULE_DATA;
  // Pick a juicy lead with all relationships filled
  const permit = PERMITS.find(p => p.biz === 'Esquina Mezcal') || PERMITS[7];
  const arch = window.ARCH_BY_ID[permit.arch];
  const account = permit.accountId ? window.ACCOUNT_BY_ID[permit.accountId] : null;
  const property = permit.propertyId ? window.PROPERTY_BY_ID[permit.propertyId] : null;

  return (
    <div className="m-screen">
      <div className="m-topbar">
        <span style={{fontSize:18, color:'var(--ink-2)'}}>‹</span>
        <h1 style={{fontSize:15, fontFamily:'var(--font-mono)', letterSpacing:0.3}}>{permit.id}</h1>
        <span className="sub">SCORE {permit.score}</span>
        <span style={{fontSize:18, color:'var(--ink-mute)'}}>⋯</span>
      </div>

      <div className="m-body" style={{padding:0}}>
        <div className="m-detail-hero">
          <div className="badges">
            <JobStamp job={permit.job}/>
            <BoroChip boro={permit.boro}/>
            <SlaBadge sla={permit.sla}/>
            <SiteBadge site={permit.site}/>
          </div>
          <h2>{permit.biz}</h2>
          <div className="addr">{permit.addr}, {permit.boro}</div>
          <div className="llc">{permit.llc}</div>
        </div>

        <div className="m-stage-row">
          <span className="label">STAGE</span>
          <StagePill stage={permit.stage}/>
          <span className="arrow">→</span>
          <span style={{color:'var(--ink-2)'}}>Contact architect</span>
          <span style={{flex:1}}></span>
          <span style={{color:'var(--ink-mute)'}}>{permit.est}</span>
        </div>

        <div className="m-detail-actions">
          <button className="primary">Draft</button>
          <button>Log call</button>
          <button>Snooze</button>
        </div>

        <div style={{padding:'14px 16px 0'}}>
          <div className="m-section-head" style={{margin:'0 0 8px'}}>
            <h3 style={{fontSize:17}}>Site — Street View</h3>
            <span className="ct">pulled 2d ago</span>
          </div>
          <div className="m-streetview">
            <div className="m-sv-tag">Heading 142° · 40.7218</div>
            <div className="m-sv-storefront">
              <div className="m-sv-sign">{permit.biz}</div>
              <div className="m-sv-door"></div>
            </div>
          </div>
          <div className="mono" style={{fontSize:10.5, color:'var(--ink-mute)', marginBottom:4}}>
            Sidewalk ~12ft · ADA clear · no existing vestibule
          </div>
        </div>

        <div style={{padding:'14px 16px 0'}}>
          <div className="m-section-head" style={{margin:'0 0 8px'}}>
            <h3 style={{fontSize:17}}>Stakeholder map</h3>
          </div>
          {arch && (
            <div className="m-stake-card" style={{borderTopColor:'var(--orange)'}}>
              <div className="av" style={{background:'var(--orange)'}}>
                {arch.name.split(' ').map(x=>x[0]).slice(0,2).join('')}
              </div>
              <div style={{minWidth:0, flex:1}}>
                <div className="ki">FILING CONTACT · {arch.kind==='expediter'?'Expediter':'Architect'}</div>
                <div className="nm">{arch.name}</div>
                <div style={{fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-mute)', marginTop:2}}>{arch.firm}</div>
              </div>
              <RelationshipPill rel={arch.relationship}/>
            </div>
          )}
          {account && (
            <div className="m-stake-card" style={{borderTopColor: account.kind==='hotel'?'var(--blue)':'var(--orange-deep)'}}>
              <div className="av" style={{background: account.kind==='hotel'?'var(--blue)':'var(--orange-deep)'}}>
                {account.short.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}
              </div>
              <div style={{minWidth:0, flex:1}}>
                <div className="ki">{account.kind==='hotel'?'HOTEL GROUP':'RESTAURANT GROUP'}</div>
                <div className="nm">{account.name}</div>
                <div style={{fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-mute)', marginTop:2}}>{account.locations} loc · {account.openings} live</div>
              </div>
              <RelationshipPill rel={account.relationship}/>
            </div>
          )}
          {property && (
            <div className="m-stake-card" style={{borderTopColor:'var(--ink-2)'}}>
              <div className="av" style={{background:'var(--ink-2)'}}>
                {property.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}
              </div>
              <div style={{minWidth:0, flex:1}}>
                <div className="ki">PROPERTY · {property.kind.toUpperCase()}</div>
                <div className="nm">{property.name}</div>
                <div style={{fontFamily:'var(--font-mono)', fontSize:10, color:'var(--ink-mute)', marginTop:2}}>{property.primary}</div>
              </div>
              <RelationshipPill rel={property.relationship}/>
            </div>
          )}
        </div>

        <div style={{padding:'14px 16px 0'}}>
          <div className="m-section-head" style={{margin:'0 0 4px'}}>
            <h3 style={{fontSize:17}}>Permit details</h3>
          </div>
        </div>
        <dl className="m-kv">
          <dt>Job no.</dt><dd className="mono">{permit.id}</dd>
          <dt>Filed</dt><dd>{permit.filedOn} <span style={{color:'var(--ink-mute)', fontFamily:'var(--font-mono)', fontSize:11}}>({permit.filed}d ago)</span></dd>
          <dt>Use group</dt><dd>{permit.use}</dd>
          <dt>Sq ft</dt><dd className="mono">{permit.sqft}</dd>
          <dt>SLA</dt><dd>On-Prem · pending · est. 60–90d</dd>
          <dt>Heat</dt><dd><Score value={permit.score}/></dd>
        </dl>
      </div>

      <MTabBar active="pipeline" badge={0}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Screen 3 — Pipeline list (mobile)
// ─────────────────────────────────────────────────────────────
function MobilePipeline() {
  const { PERMITS } = window.VESTIBULE_DATA;
  const list = [...PERMITS]
    .filter(p=>!['won','dropped'].includes(p.stage))
    .sort((a,b)=>b.score-a.score)
    .slice(0,9);

  return (
    <div className="m-screen">
      <div className="m-topbar">
        <svg className="logo-mark" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" stroke="#0F1419" strokeWidth="1.5"/>
          <rect x="9" y="9" width="6" height="12" fill="#0F1419"/>
          <line x1="9" y1="3" x2="9" y2="9" stroke="#0F1419" strokeWidth="1.5"/>
          <line x1="15" y1="3" x2="15" y2="9" stroke="#0F1419" strokeWidth="1.5"/>
        </svg>
        <h1>Pipeline</h1>
        <span className="sub">{list.length} OPEN</span>
        <span style={{fontSize:18, color:'var(--ink-mute)'}}>⌕</span>
      </div>

      <div className="m-search">
        <span className="ic">⌕</span>
        <input placeholder="Permits, addresses, IDs…"/>
        <span className="mono" style={{fontSize:10, color:'var(--ink-mute)'}}>SCAN</span>
      </div>

      <div className="m-filterbar">
        <span className="m-chip on">All · {list.length}</span>
        <span className="m-chip">Hot · {list.filter(p=>p.sla==='pending').length}</span>
        <span className="m-chip">A1 · {list.filter(p=>p.job==='A1').length}</span>
        <span className="m-chip">Manhattan</span>
        <span className="m-chip">Brooklyn</span>
        <span className="m-chip">Queens</span>
      </div>

      <div className="m-body" style={{padding:'4px 0 100px'}}>
        {list.map((p,i) => {
          const arch = window.ARCH_BY_ID[p.arch];
          const isHot = p.sla==='pending' && p.score >= 85;
          return (
            <div key={p.id} className={`m-row ${isHot?'hot':''}`} style={{padding:'14px 16px'}}>
              <div className="av">{p.biz.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</div>
              <div className="meta">
                <div className="biz">
                  {p.biz}
                  <Score value={p.score}/>
                </div>
                <div className="addr">{p.addr} · {p.boro} · {arch?.name.split(',')[0].split(' ').slice(-1)[0]}</div>
                <div style={{display:'flex', gap:6, marginTop:6}}>
                  <SlaBadge sla={p.sla}/>
                  <JobStamp job={p.job}/>
                  <StagePill stage={p.stage}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="m-fab">+</div>
      <MTabBar active="pipeline" badge={0}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// App — wrap in a design canvas with 3 iOS frames
// ─────────────────────────────────────────────────────────────
const W = 402, H = 874;

function MobileApp() {
  return (
    <DesignCanvas>
      <DCSection id="vestibule-mobile" title="Vestibule — Mobile companion" subtitle="Field-use views · iPhone 14 Pro · 402×874">
        <DCArtboard id="today" label="① Morning briefing" width={W} height={H}>
          <IOSDevice width={W} height={H}>
            <MobileToday/>
          </IOSDevice>
        </DCArtboard>
        <DCArtboard id="lead" label="② Lead detail" width={W} height={H}>
          <IOSDevice width={W} height={H}>
            <MobileLeadDetail/>
          </IOSDevice>
        </DCArtboard>
        <DCArtboard id="pipeline" label="③ Pipeline" width={W} height={H}>
          <IOSDevice width={W} height={H}>
            <MobilePipeline/>
          </IOSDevice>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(MobileApp));
