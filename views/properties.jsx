// Properties view — landlords / property owners with multi-address portfolios
const { useState: usePropState } = React;

function PropertiesView({ onSelect, initialPropId, goTo }) {
  const { PROPERTIES, PERMITS } = window.VESTIBULE_DATA;
  const [activeId, setActiveId] = usePropState(initialPropId || PROPERTIES.sort((a,b)=>b.permits-a.permits)[0].id);

  const sorted = [...PROPERTIES].sort((a,b)=>b.permits-a.permits);
  const active = PROPERTY_BY_ID[activeId];
  const activePermits = PERMITS.filter(p => p.propertyId === activeId);

  return (
    <div className="content">
      <div className="filters" style={{padding:'10px 22px'}}>
        <span className="mono" style={{fontSize:10.5, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:0.5}}>
          {sorted.length} landlords tracked · {sorted.reduce((s,p)=>s+p.permits,0)} active permits across portfolio
        </span>
        <span style={{flex:1}}></span>
        <button className="btn small">Export</button>
        <button className="btn small primary">+ New landlord</button>
      </div>

      <div className="arch-grid">
        <div className="arch-list">
          {sorted.map(p => (
            <div key={p.id} className={`arch-list-item ${p.id===activeId?'active':''}`} onClick={()=>setActiveId(p.id)}>
              <div className="avatar" style={{width:36, height:36, fontSize:11, background:'var(--ink-2)'}}>
                {p.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontWeight:500, fontSize:13}}>{p.name}</div>
                <div className="arch-line2">{p.portfolio}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <RelationshipPill rel={p.relationship}/>
                <div className="mono" style={{fontSize:10.5, color:'var(--ink-mute)', marginTop:3}}>{p.permits} permits</div>
              </div>
            </div>
          ))}
        </div>

        <div className="arch-detail">
          <PropertyDetail property={active} permits={activePermits} onSelect={onSelect}/>
        </div>
      </div>
    </div>
  );
}

function PropertyDetail({ property, permits, onSelect }) {
  return (
    <>
      <div style={{display:'flex', alignItems:'flex-start', gap:14, marginBottom:14}}>
        <div className="avatar" style={{width:72, height:72, fontSize:22, background:'var(--ink-2)'}}>
          {property.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}
        </div>
        <div style={{flex:1}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <h3 style={{margin:0}}>{property.name}</h3>
            <span className="boro-chip" style={{textTransform:'uppercase'}}>{property.kind}</span>
          </div>
          <div className="firm">{property.portfolio} · Principal: {property.primary}</div>
          <div style={{marginTop:4}}><RelationshipPill rel={property.relationship}/></div>
        </div>
        <div style={{display:'flex', gap:6}}>
          <button className="btn small">Log touch</button>
          <button className="btn small primary">Portfolio pitch</button>
        </div>
      </div>

      <div className="dash-kpis" style={{marginBottom:18}}>
        <div className="kpi">
          <div className="kpi-label">Permits in portfolio</div>
          <div className="kpi-value">{permits.length}</div>
          <div className="kpi-foot">Across {property.addresses.length} known addresses</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Hot leads</div>
          <div className="kpi-value" style={{color:'var(--orange)'}}>{permits.filter(p=>p.sla==='pending').length}</div>
          <div className="kpi-foot">SLA pending across buildings</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Avg heat</div>
          <div className="kpi-value">{permits.length ? Math.round(permits.reduce((s,p)=>s+p.score,0)/permits.length) : '—'}</div>
          <div className="kpi-foot">across portfolio leads</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Strategy</div>
          <div className="kpi-value" style={{fontSize:18, lineHeight:1.2, fontFamily:'var(--font-sans)'}}>
            {property.kind === 'reit' ? 'Through asset mgr' : property.relationship === 'hot' ? 'Direct to principal' : 'Build slowly'}
          </div>
          <div className="kpi-foot">based on size + relationship</div>
        </div>
      </div>

      <div className="card" style={{marginBottom:18}}>
        <div className="card-head"><h3>Notes</h3></div>
        <div className="card-body" style={{fontSize:13, color:'var(--ink-2)', lineHeight:1.55}}>{property.notes}</div>
      </div>

      <div className="card" style={{marginBottom:18}}>
        <div className="card-head"><h3>Known addresses in portfolio</h3></div>
        <div className="card-body tight">
          {property.addresses.map((addr,i)=>(
            <div key={i} style={{padding:'10px 14px', borderBottom:'1px solid var(--rule)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span className="mono">{addr}</span>
              <span className="mono" style={{fontSize:10.5, color:'var(--ink-mute)'}}>{permits.filter(p=>p.addr.includes(addr.split(',')[0])).length} active</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Active permits</h3><span className="head-sub">All buildings owned</span></div>
        <div className="card-body tight">
          {permits.length === 0 ? (
            <div style={{padding:16, color:'var(--ink-mute)', fontSize:12.5}}>No permits this cycle.</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Tenant</th><th>Address</th><th>Job</th><th>SLA</th><th>Heat</th><th>Stage</th></tr></thead>
              <tbody>
                {permits.map(p => (
                  <tr key={p.id} onClick={()=>onSelect(p)}>
                    <td><div className="biz">{p.biz}</div></td>
                    <td className="mono addr">{p.addr}</td>
                    <td><JobStamp job={p.job}/></td>
                    <td><SlaBadge sla={p.sla}/></td>
                    <td><Score value={p.score}/></td>
                    <td><StagePill stage={p.stage}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

window.PropertiesView = PropertiesView;
