// Accounts view — multi-location operators (hotel & restaurant groups)
const { useState: useAcctState } = React;

function AccountsView({ onSelect, initialAcctId, goTo }) {
  const { ACCOUNTS, PERMITS } = window.VESTIBULE_DATA;
  const [kind, setKind] = useAcctState('all');
  const [activeId, setActiveId] = useAcctState(initialAcctId || ACCOUNTS[0].id);

  const filtered = ACCOUNTS.filter(a => kind === 'all' || a.kind === kind)
    .sort((a,b)=>b.openings - a.openings || b.locations - a.locations);
  const active = ACCOUNT_BY_ID[activeId];
  const activePermits = PERMITS.filter(p => p.accountId === activeId);

  return (
    <div className="content">
      <div className="filters" style={{padding:'10px 22px'}}>
        <div className="seg">
          <button className={kind==='all'?'active':''}        onClick={()=>setKind('all')}>All</button>
          <button className={kind==='hotel'?'active':''}      onClick={()=>setKind('hotel')}>Hotels</button>
          <button className={kind==='restaurant'?'active':''} onClick={()=>setKind('restaurant')}>Restaurant Groups</button>
        </div>
        <span className="mono" style={{fontSize:10.5, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:0.5}}>
          {filtered.length} accounts · {filtered.reduce((s,a)=>s+a.openings,0)} live openings · ${(filtered.reduce((s,a)=>s+a.revenue,0)/1000).toFixed(1)}k closed
        </span>
        <span style={{flex:1}}></span>
        <button className="btn small">Export</button>
        <button className="btn small primary">+ New account</button>
      </div>

      <div className="arch-grid">
        <div className="arch-list">
          {filtered.map(a => {
            const initials = a.short.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
            return (
              <div key={a.id} className={`arch-list-item ${a.id===activeId?'active':''}`} onClick={()=>setActiveId(a.id)}>
                <div className="avatar" style={{width:36, height:36, fontSize:11.5, background: a.kind==='hotel' ? 'var(--blue)' : 'var(--orange)'}}>{initials}</div>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:500, fontSize:13, display:'flex', alignItems:'center', gap:6}}>
                    {a.name}
                    {a.kind === 'hotel' && <span className="boro-chip" style={{background:'oklch(0.94 0.04 240)', color:'var(--blue)', borderColor:'var(--blue)'}}>HOTEL</span>}
                    {a.kind === 'restaurant' && <span className="boro-chip" style={{background:'oklch(0.94 0.05 35)', color:'var(--orange-deep)', borderColor:'var(--orange)'}}>RESTO</span>}
                  </div>
                  <div className="arch-line2">{a.locations} locations · {a.nyLocations} in NYC{a.totalRooms ? ` · ${a.totalRooms} rooms` : ''}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <RelationshipPill rel={a.relationship}/>
                  <div className="mono" style={{fontSize:10.5, color:a.openings>0?'var(--orange)':'var(--ink-mute)', marginTop:3, fontWeight:a.openings>0?600:400}}>
                    {a.openings > 0 ? `${a.openings} opening` : 'no live'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="arch-detail">
          <AccountDetail account={active} permits={activePermits} onSelect={onSelect}/>
        </div>
      </div>
    </div>
  );
}

function AccountDetail({ account, permits, onSelect }) {
  const { CONTACTS } = window.VESTIBULE_DATA;
  const contacts = account.keyContacts.map(id => CONTACT_BY_ID[id]).filter(Boolean);
  const initials = account.short.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();

  return (
    <>
      <div style={{display:'flex', alignItems:'flex-start', gap:14, marginBottom:14}}>
        <div className="avatar" style={{width:72, height:72, fontSize:24, background: account.kind==='hotel' ? 'var(--blue)' : 'var(--orange)'}}>
          {initials}
        </div>
        <div style={{flex:1}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <h3 style={{margin:0}}>{account.name}</h3>
            {account.kind === 'hotel'      && <span className="boro-chip" style={{background:'oklch(0.94 0.04 240)', color:'var(--blue)', borderColor:'var(--blue)'}}>HOTEL GROUP</span>}
            {account.kind === 'restaurant' && <span className="boro-chip" style={{background:'oklch(0.94 0.05 35)', color:'var(--orange-deep)', borderColor:'var(--orange)'}}>RESTAURANT GROUP</span>}
          </div>
          <div className="firm">{account.hq}</div>
          <div style={{display:'flex', gap:10, alignItems:'center', marginTop:4}}>
            <RelationshipPill rel={account.relationship}/>
            <span className="mono" style={{fontSize:11, color:'var(--ink-3)'}}>{account.brands.join(' · ')}</span>
          </div>
        </div>
        <div style={{display:'flex', gap:6}}>
          <button className="btn small">Log touch</button>
          <button className="btn small primary">Pitch master spec</button>
        </div>
      </div>

      <div className="dash-kpis" style={{marginBottom:18}}>
        <div className="kpi">
          <div className="kpi-label">Live openings</div>
          <div className="kpi-value" style={{color: account.openings>0?'var(--orange)':'var(--ink)'}}>{account.openings}</div>
          <div className="kpi-foot">{permits.length} permits filed</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">NYC locations</div>
          <div className="kpi-value">{account.nyLocations}</div>
          <div className="kpi-foot">of {account.locations} total</div>
        </div>
        {account.kind === 'hotel' && (
          <div className="kpi">
            <div className="kpi-label">Total rooms</div>
            <div className="kpi-value">{account.totalRooms.toLocaleString()}</div>
            <div className="kpi-foot">{Math.round(account.totalRooms/account.locations)} avg / property</div>
          </div>
        )}
        {account.kind === 'restaurant' && (
          <div className="kpi">
            <div className="kpi-label">Brands</div>
            <div className="kpi-value">{account.brands.length}</div>
            <div className="kpi-foot">across portfolio</div>
          </div>
        )}
        <div className="kpi">
          <div className="kpi-label">Revenue closed</div>
          <div className="kpi-value">${(account.revenue/1000).toFixed(1)}k</div>
          <div className="kpi-foot">{account.won} install{account.won===1?'':'s'} complete</div>
        </div>
      </div>

      <div className="card" style={{marginBottom:18}}>
        <div className="card-head"><h3>Relationship notes</h3></div>
        <div className="card-body" style={{fontSize:13, color:'var(--ink-2)', lineHeight:1.55}}>{account.notes}</div>
      </div>

      <div className="card" style={{marginBottom:18}}>
        <div className="card-head"><h3>Key contacts</h3><span className="head-sub">Decision makers</span></div>
        <div className="card-body tight">
          {contacts.map(c => (
            <div key={c.id} style={{display:'grid', gridTemplateColumns:'40px 1fr 1fr auto', gap:14, alignItems:'center', padding:'10px 14px', borderBottom:'1px solid var(--rule)'}}>
              <div className="avatar" style={{width:32, height:32, fontSize:11}}>{c.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div>
              <div>
                <div style={{fontWeight:500}}>{c.name}</div>
                <div className="mono" style={{fontSize:10.5, color:'var(--ink-mute)'}}>{c.title}</div>
              </div>
              <div>
                <div className="mono" style={{fontSize:11}}>{c.email || <span style={{color:'var(--ink-mute)'}}>no email</span>}</div>
                <div className="mono" style={{fontSize:10.5, color:'var(--ink-mute)'}}>{c.phone || '—'}</div>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <RelationshipPill rel={c.relationship}/>
                <button className="btn small">Email</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Active permits at portfolio properties</h3>
          <span className="head-sub">{permits.length} linked</span>
        </div>
        <div className="card-body tight">
          {permits.length === 0 ? (
            <div style={{padding:16, color:'var(--ink-mute)', fontSize:12.5}}>No permits filed at portfolio properties this cycle. Worth a check-in call.</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Business</th><th>Address</th><th>Job</th><th>SLA</th><th>Heat</th><th>Stage</th></tr></thead>
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

window.AccountsView = AccountsView;
