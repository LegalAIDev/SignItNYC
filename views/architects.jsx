// Architects view — list + detail
const { useState: useArchState } = React;

function ArchitectsView({ onSelect, initialArchId }) {
  const { ARCHITECTS, PERMITS } = window.VESTIBULE_DATA;
  const sorted = [...ARCHITECTS].sort((a,b)=>b.projects-a.projects);
  const [activeId, setActiveId] = useArchState(initialArchId || sorted[0].id);
  const active = ARCH_BY_ID[activeId];
  const archPermits = PERMITS.filter(p => p.arch === activeId);
  const won = archPermits.filter(p=>p.stage==='won').length;

  return (
    <div className="content">
      <div className="arch-grid">
        <div className="arch-list">
          {sorted.map(a => {
            const initials = a.name.split(' ').map(x=>x[0]).slice(0,2).join('');
            const cnt = PERMITS.filter(p=>p.arch===a.id).length;
            return (
              <div key={a.id} className={`arch-list-item ${a.id===activeId?'active':''}`} onClick={()=>setActiveId(a.id)}>
                <div className="avatar" style={{width:36, height:36, fontSize:13}}>{initials}</div>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:500, fontSize:13}}>{a.name}</div>
                  <div className="arch-line2">{a.firm}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <RelationshipPill rel={a.relationship}/>
                  <div className="mono" style={{fontSize:10.5, color:'var(--ink-mute)', marginTop:3}}>{cnt} leads</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="arch-detail">
          <div style={{display:'flex', alignItems:'flex-start', gap:14, marginBottom:14}}>
            <div className="avatar" style={{width:64, height:64, fontSize:22}}>
              {active.name.split(' ').map(x=>x[0]).slice(0,2).join('')}
            </div>
            <div style={{flex:1}}>
              <h3>{active.name}</h3>
              <div className="firm">{active.firm}</div>
              <div style={{display:'flex', gap:10, alignItems:'center'}}>
                <RelationshipPill rel={active.relationship}/>
                <span className="mono" style={{fontSize:11, color:'var(--ink-3)'}}>{active.email}</span>
                <span className="mono" style={{fontSize:11, color:'var(--ink-3)'}}>{active.phone}</span>
              </div>
            </div>
            <div style={{display:'flex', gap:6}}>
              <button className="btn small">Log touch</button>
              <button className="btn small primary">Email draft</button>
            </div>
          </div>

          <div className="dash-kpis" style={{marginBottom:18}}>
            <div className="kpi">
              <div className="kpi-label">Open leads</div>
              <div className="kpi-value">{archPermits.filter(p=>!['won','dropped'].includes(p.stage)).length}</div>
              <div className="kpi-foot">{archPermits.length} touched all-time</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Projects filed</div>
              <div className="kpi-value">{active.projects}</div>
              <div className="kpi-foot">DOB activity 12 months</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Replies</div>
              <div className="kpi-value">{active.replied}</div>
              <div className="kpi-foot">{Math.round(active.replied/Math.max(active.projects,1)*100)}% reply rate</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Won via</div>
              <div className="kpi-value">{won}</div>
              <div className="kpi-foot">{won>0?'$'+(won*10).toFixed(1)+'k closed':'No wins yet'}</div>
            </div>
          </div>

          <div className="card" style={{marginBottom:18}}>
            <div className="card-head"><h3>Relationship notes</h3><span className="head-sub">Last touch · {active.intro}</span></div>
            <div className="card-body" style={{fontSize:13, color:'var(--ink-2)', lineHeight:1.55}}>
              {active.notes}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Active projects</h3><span className="head-sub">Leads filed under this name</span></div>
            <div className="card-body tight">
              <table className="data-table">
                <thead><tr><th>Business</th><th>Address</th><th>Job</th><th>SLA</th><th>Heat</th><th>Stage</th></tr></thead>
                <tbody>
                  {archPermits.map(p => (
                    <tr key={p.id} onClick={()=>onSelect(p)}>
                      <td><div className="biz">{p.biz}</div><div className="mono muted" style={{fontSize:10}}>{p.id}</div></td>
                      <td className="mono addr" style={{fontSize:11.5}}>{p.addr}</td>
                      <td><JobStamp job={p.job}/></td>
                      <td><SlaBadge sla={p.sla}/></td>
                      <td><Score value={p.score}/></td>
                      <td><StagePill stage={p.stage}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ArchitectsView = ArchitectsView;
