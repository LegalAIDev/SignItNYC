// Main app shell
const { useState: useAppState, useEffect: useAppEffect } = React;

class ViewErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e) { console.error('View error:', e); }
  render() {
    if (this.state.error) {
      return (
        <div className="content">
          <div className="subpane" style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:300}}>
            <div style={{textAlign:'center', color:'var(--ink-mute)'}}>
              <div style={{fontSize:28, marginBottom:12}}>⚠</div>
              <div style={{fontWeight:500, marginBottom:6}}>This view needs data to render</div>
              <div style={{fontSize:12}}>Go to <strong>Settings → Load demo data</strong>, or run <span className="mono">pull_dob.py</span> and reload.</div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const hasData = () => (window.VESTIBULE_DATA?.PERMITS?.length || 0) > 0;
  const [view, setView] = useAppState(() => hasData() ? 'dashboard' : 'settings');
  const [archInitial, setArchInitial] = useAppState(null);
  const [acctInitial, setAcctInitial] = useAppState(null);
  const [propInitial, setPropInitial] = useAppState(null);
  const [selectedPermit, setSelectedPermit] = useAppState(null);
  const [filters, setFilters] = useAppState({ boro: [], sla: 'all', job: 'all', stage: [] });
  const [demoActive, setDemoActive] = useAppState(false);
  const [dataRev, setDataRev] = useAppState(0);

  const toggleDemo = () => {
    if (!demoActive) {
      window.loadDemoData && window.loadDemoData();
      setDemoActive(true);
    } else {
      window._resetData && window._resetData();
      setDemoActive(false);
    }
    setDataRev(r => r + 1);
  };

  const { PERMITS } = window.VESTIBULE_DATA;
  // Briefing: things needing attention Monday morning
  const newToday      = PERMITS.filter(p=>p.filed===0).length;
  const slaToday      = PERMITS.filter(p=>p.sla==='pending' && p.filed<=2 && p.stage==='qualified').length;
  const awaitingReply = PERMITS.filter(p=>p.stage==='contacted' && (p.contactedDays||0) >= 4).length;
  const briefingCount = newToday + slaToday + awaitingReply;

  const restaurants = (window.VESTIBULE_DATA.RESTAURANTS || []);

  const counts = {
    dashboard: null,
    briefing: briefingCount,
    weekly: PERMITS.filter(p=>p.filed<=7).length,
    pipeline: PERMITS.filter(p=>!['won','dropped'].includes(p.stage)).length,
    architects: window.VESTIBULE_DATA.ARCHITECTS.length,
    accounts: window.VESTIBULE_DATA.ACCOUNTS.length,
    properties: window.VESTIBULE_DATA.PROPERTIES.length,
    outreach: 4,
    restaurants: restaurants.length,
  };

  const goTo = (v, opts) => {
    // Back-compat: goTo('architects', 'a3') still works
    const o = (typeof opts === 'string') ? { archId: opts } : (opts || {});
    setSelectedPermit(null);
    setView(v);
    setArchInitial(o.archId || null);
    setAcctInitial(o.acctId || null);
    setPropInitial(o.propId || null);
    if (o.filters) setFilters({ boro:[], sla:'all', job:'all', stage:[], ...o.filters });
    if (o.permitId) {
      const p = window.VESTIBULE_DATA.PERMITS.find(x => x.id === o.permitId);
      if (p) setSelectedPermit(p);
    }
  };

  useAppEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && selectedPermit) setSelectedPermit(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedPermit]);

  const titles = {
    dashboard:   { crumb: 'OVERVIEW', title: 'Today' },
    briefing:    { crumb: 'OVERVIEW · MONDAY 7:14 AM', title: 'Morning briefing' },
    weekly:      { crumb: 'STAGE 1 — PULL', title: 'Weekly DOB pull' },
    pipeline:    { crumb: 'STAGE 2–4 — QUALIFY · ENRICH · OUTREACH', title: 'Lead pipeline' },
    architects:  { crumb: 'RELATIONSHIPS · FILING CONTACTS',  title: 'Architects & expediters' },
    accounts:    { crumb: 'RELATIONSHIPS · MULTI-LOCATION',   title: 'Hotel & restaurant groups' },
    properties:  { crumb: 'RELATIONSHIPS · LANDLORDS',        title: 'Property owners' },
    outreach:    { crumb: 'STAGE 4 — OUTREACH', title: 'Outreach' },
    restaurants: { crumb: 'STAGE 1 — DOHMH PULL', title: 'New restaurants' },
    settings:    { crumb: 'CONFIG', title: 'Sources & rules' },
  };
  const t = titles[view];

  return (
    <div className="app">
      <Sidebar view={view} setView={(v)=>{ setView(v); setArchInitial(null); setAcctInitial(null); setPropInitial(null); }} counts={counts}/>
      <div className="main">
        <div className="topbar">
          <div>
            <div className="crumb">{t.crumb}</div>
            <h2>{t.title}</h2>
          </div>
          <span className="spacer"></span>
          <div className="top-meta">
            <span style={{display:'inline-flex', alignItems:'center', gap:6}}>
              <span style={{width:6, height:6, borderRadius:'50%', background:'var(--green)'}}></span>
              DOB sync 2h ago
            </span>
            <span style={{marginLeft:14}}>SLA sync 4h ago</span>
          </div>
          <button className="top-action" onClick={()=>{ setView('briefing'); setArchInitial(null); setAcctInitial(null); setPropInitial(null); }} title="Morning briefing" style={{position:'relative', padding:'5px 9px'}}>
            <span style={{fontSize:13}}>◔</span> Briefing
            {briefingCount > 0 && <span style={{
              position:'absolute', top:-4, right:-4, minWidth:16, height:16, padding:'0 4px',
              borderRadius:8, background:'var(--orange)', color:'#fff',
              fontFamily:'var(--font-mono)', fontSize:9.5, fontWeight:600,
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              border:'1.5px solid var(--paper)'
            }}>{briefingCount}</span>}
          </button>
          <a href="Vestibule Mobile.html" className="top-action" title="Mobile companion" style={{textDecoration:'none', padding:'5px 9px'}}>
            <span style={{fontSize:13}}>▯</span> Mobile
          </a>
          <button className="top-action"><span style={{fontSize:13}}>⌘K</span> Search</button>
          <button className="top-action primary">+ New lead</button>
        </div>

        <ViewErrorBoundary key={dataRev}>
        <div key={dataRev}>
          {view === 'dashboard' && <DashboardView onSelect={setSelectedPermit} goTo={goTo}/>}
          {view === 'weekly'    && <WeeklyView onSelect={setSelectedPermit} goTo={goTo}/>}
          {view === 'pipeline'  && <PipelineView onSelect={setSelectedPermit} filters={filters} setFilters={setFilters}/>}
          {view === 'architects'&& <ArchitectsView onSelect={setSelectedPermit} initialArchId={archInitial} goTo={goTo}/>}
          {view === 'accounts'  && <AccountsView onSelect={setSelectedPermit} initialAcctId={acctInitial} goTo={goTo}/>}
          {view === 'properties'&& <PropertiesView onSelect={setSelectedPermit} initialPropId={propInitial} goTo={goTo}/>}
          {view === 'outreach'     && <OutreachView onSelect={setSelectedPermit}/>}
          {view === 'briefing'     && <BriefingView onSelect={setSelectedPermit} goTo={goTo}/>}
          {view === 'restaurants'  && <RestaurantsView/>}
          {view === 'settings'     && <SettingsView demoActive={demoActive} onToggleDemo={toggleDemo}/>}
        </div>
        </ViewErrorBoundary>
      </div>
      {selectedPermit && <LeadDetail permit={selectedPermit} onClose={()=>setSelectedPermit(null)} goTo={goTo}/>}
    </div>
  );
}

function Sidebar({ view, setView, counts }) {
  const main = [
    { id:'dashboard',   icon:'◑', label:'Today' },
    { id:'briefing',    icon:'◔', label:'Briefing',       count: counts.briefing,     flag:true },
    { id:'weekly',      icon:'⊟', label:'Weekly pull',    count: counts.weekly },
    { id:'pipeline',    icon:'▦', label:'Pipeline',       count: counts.pipeline },
    { id:'restaurants', icon:'⊕', label:'New restaurants',count: counts.restaurants },
    { id:'outreach',    icon:'✎', label:'Outreach',       count: counts.outreach },
  ];
  const rel = [
    { id:'architects', icon:'◇', label:'Architects',   count: counts.architects, sub:'Filing contacts' },
    { id:'accounts',   icon:'⬢', label:'Accounts',     count: counts.accounts,   sub:'Hotels · Restaurant groups' },
    { id:'properties', icon:'▢', label:'Properties',   count: counts.properties, sub:'Landlords · REITs' },
  ];
  const aux = [
    { id:'settings',   icon:'⚙', label:'Sources & rules' },
  ];
  return (
    <div className="sidebar">
      <div className="sidebar-head">
        <div className="logo">
          <svg className="logo-mark" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" stroke="#0F1419" strokeWidth="1.5"/>
            <rect x="9" y="9" width="6" height="12" fill="#0F1419"/>
            <line x1="9" y1="3" x2="9" y2="9" stroke="#0F1419" strokeWidth="1.5"/>
            <line x1="15" y1="3" x2="15" y2="9" stroke="#0F1419" strokeWidth="1.5"/>
          </svg>
          <h1>Vestibule</h1>
        </div>
        <div className="tag">DOB → SLA → Pitch · NYC</div>
      </div>
      <div className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-label">Workspace</div>
          {main.map(n => (
            <div key={n.id} className={`nav-item ${view===n.id?'active':''}`} onClick={()=>setView(n.id)}>
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-text">{n.label}</span>
              {n.count != null && <span className="nav-count">{n.count}</span>}
            </div>
          ))}
        </div>
        <div className="nav-section">
          <div className="nav-label">Relationships</div>
          {rel.map(n => (
            <div key={n.id} className={`nav-item ${view===n.id?'active':''}`} onClick={()=>setView(n.id)}>
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-text">{n.label}</span>
              {n.count != null && <span className="nav-count">{n.count}</span>}
            </div>
          ))}
        </div>
        <div className="nav-section">
          <div className="nav-label">Saved Views</div>
          <div className="nav-item"><span className="nav-icon" style={{color:'var(--orange)'}}>●</span><span className="nav-text">Hot · SLA pending</span><span className="nav-count">22</span></div>
          <div className="nav-item"><span className="nav-icon" style={{color:'var(--amber)'}}>●</span><span className="nav-text">Mulberry / Mott corridor</span><span className="nav-count">7</span></div>
          <div className="nav-item"><span className="nav-icon" style={{color:'var(--blue)'}}>●</span><span className="nav-text">Awaiting reply</span><span className="nav-count">5</span></div>
          <div className="nav-item"><span className="nav-icon" style={{color:'var(--green)'}}>●</span><span className="nav-text">Site walks this week</span><span className="nav-count">2</span></div>
        </div>
        <div className="nav-section">
          <div className="nav-label">System</div>
          {aux.map(n => (
            <div key={n.id} className={`nav-item ${view===n.id?'active':''}`} onClick={()=>setView(n.id)}>
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-text">{n.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="sidebar-foot">
        <div className="row">
          <div className="avatar">JL</div>
          <div style={{flex:1, minWidth:0}}>
            <div className="name">J. Lavin</div>
            <div className="sub">Founder · Solo</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsView({ demoActive, onToggleDemo }) {
  return (
    <div className="content">
      <div className="subpane">

        {/* Demo mode banner */}
        <div style={{
          marginBottom:18, padding:'14px 18px', borderRadius:6,
          background: demoActive ? 'var(--amber-pale,#fef3e0)' : 'var(--rule)',
          border: `1.5px solid ${demoActive ? 'var(--amber,#b45309)' : 'var(--rule)'}`,
          display:'flex', alignItems:'center', gap:14,
        }}>
          <div style={{flex:1}}>
            <div style={{fontWeight:600, fontSize:13, color: demoActive ? 'var(--amber,#b45309)' : 'var(--ink)'}}>
              {demoActive ? 'Demo mode active' : 'No data loaded'}
            </div>
            <div style={{fontSize:11, color:'var(--ink-mute)', marginTop:3}}>
              {demoActive
                ? '57 fictional permits, 12 architects, accounts and properties — for layout preview only. Clear before entering real data.'
                : 'Run pull_dob.py and reload to populate with live DOB permits. Or load demo data to preview the layout.'}
            </div>
          </div>
          <button
            className={`btn small ${demoActive ? 'ghost' : 'primary'}`}
            onClick={onToggleDemo}
            style={demoActive ? {color:'var(--amber,#b45309)', borderColor:'var(--amber,#b45309)'} : {}}
          >
            {demoActive ? 'Clear demo data' : 'Load demo data'}
          </button>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
          <div className="card">
            <div className="card-head"><h3>DOB pull</h3><span className="head-sub">Stage 1 source</span></div>
            <div className="card-body">
              <dl className="kv">
                <dt>Source</dt><dd>NYC Open Data · DOB Permit Issuance</dd>
                <dt>Filter</dt><dd className="mono">job_type IN (A1,A2)</dd>
                <dt>Use group</dt><dd>Eating &amp; Drinking (occupancy keywords)</dd>
                <dt>Borough</dt><dd>All 5 (configurable)</dd>
                <dt>Window</dt><dd>Rolling 30 days (configurable)</dd>
                <dt>Trigger</dt><dd>Manual — run pull_dob.py, then reload</dd>
                <dt>Last pull</dt><dd className="mono">{(window.VESTIBULE_DATA && window.VESTIBULE_DATA._dobPulledAt) || '—'}</dd>
              </dl>
              <div style={{marginTop:10, padding:'8px 10px', background:'var(--rule)', borderRadius:4, fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-mute)'}}>
                python pull_dob.py
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>SLA cross-ref</h3><span className="head-sub">Stage 2 enrichment</span></div>
            <div className="card-body">
              <dl className="kv">
                <dt>Source</dt><dd>NY State Liquor Authority · Pending Applications</dd>
                <dt>Match key</dt><dd>Address normalization + LLC fuzzy match</dd>
                <dt>Threshold</dt><dd className="mono">≥ 0.85 confidence</dd>
                <dt>License types</dt><dd>Full · On-Premises · Beer/Wine</dd>
                <dt>Run</dt><dd>Daily 6am</dd>
              </dl>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Site filter</h3><span className="head-sub">Stage 3 — auto-drop</span></div>
            <div className="card-body">
              <dl className="kv">
                <dt>Provider</dt><dd>Google Street View Static API</dd>
                <dt>Heading</dt><dd>Auto-detected from BIN orientation</dd>
                <dt>Manual gate</dt><dd>Yes — you review every site image</dd>
                <dt>Auto-drop</dt><dd>Existing vestibule visible (~20% of leads)</dd>
              </dl>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Heat score</h3><span className="head-sub">Ranking formula</span></div>
            <div className="card-body" style={{fontFamily:'var(--font-mono)', fontSize:12, lineHeight:1.8}}>
              <div>+ 40  · SLA pending (Full/On-Prem)</div>
              <div>+ 20  · SLA pending (Beer/Wine)</div>
              <div>+ 20  · A1 (vs A2)</div>
              <div>+ 15  · Sidewalk OK</div>
              <div>+ 10  · Architect = warm/hot relationship</div>
              <div>+  5  · Filed in last 7 days</div>
              <div style={{borderTop:'1px solid var(--rule)', paddingTop:6, marginTop:6}}>− 30  · Tight sidewalk</div>
              <div>−100  · Existing vestibule</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.App = App;

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
