// Lead detail panel
const { useState: useLeadState } = React;

function LeadDetail({ permit, onClose, goTo }) {
  const [tab, setTab] = useLeadState('overview');
  if (!permit) return null;
  const arch = ARCH_BY_ID[permit.arch];
  const initials = arch ? arch.name.split(' ').map(x=>x[0]).slice(0,2).join('') : '?';
  const jump = (v, opts) => { if (goTo) { onClose(); goTo(v, opts); } };

  return (
    <div className="lead-overlay" onClick={onClose}>
      <div className="lead-panel" onClick={e=>e.stopPropagation()}>
        <div className="lead-panel-head">
          <div className="row1">
            <span className="id">{permit.id}</span>
            <JobStamp job={permit.job}/>
            <BoroChip boro={permit.boro}/>
            <SlaBadge sla={permit.sla}/>
            <SiteBadge site={permit.site}/>
            <span style={{flex:1}}></span>
            <button className="btn small ghost" onClick={onClose}>Close ✕</button>
          </div>
          <h2>{permit.biz}</h2>
          <div className="addr">{permit.addr}, {permit.boro} · {permit.llc}</div>
          <div className="row-actions">
            <button className="btn small accent">Draft outreach</button>
            <button className="btn small">Promote stage →</button>
            <button className="btn small">Log call</button>
            <button className="btn small ghost">Snooze</button>
            <button className="btn small ghost" style={{color:'var(--red)'}}>Drop</button>
            <span style={{flex:1}}></span>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <span className="mono" style={{fontSize:10, color:'var(--ink-mute)'}}>STAGE</span>
              <StagePill stage={permit.stage}/>
              <span className="mono" style={{fontSize:10, color:'var(--ink-mute)', marginLeft:8}}>HEAT</span>
              <Score value={permit.score}/>
            </div>
          </div>
        </div>

        <div className="tabs">
          {['overview','permit','site','architect','outreach','timeline'].map(t => (
            <div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</div>
          ))}
        </div>

        <div className="lead-panel-body">
          {tab === 'overview' && (
            <div className="lead-grid">
              <div>
                <div className="lead-section">
                  <h4>Street View — auto-fetched</h4>
                  <StreetViewPlaceholder permit={permit} w={560} h={300}/>
                  <div className="mono" style={{fontSize:10.5, color:'var(--ink-mute)', marginTop:8, display:'flex', justifyContent:'space-between'}}>
                    <span>Pulled 2026-05-22 · Heading 142° · 40.7218, -73.9978</span>
                    <a style={{color:'var(--blue)', textDecoration:'none', cursor:'pointer'}}>Open in Google Maps ↗</a>
                  </div>
                </div>

                <div className="lead-section">
                  <h4>Stakeholder map</h4>
                  <StakeholderMap permit={permit} jump={jump}/>
                </div>

                <div className="lead-section">
                  <h4>Site assessment</h4>
                  <dl className="kv">
                    <dt>Existing vestibule</dt><dd>{permit.site === 'has-vest' ? 'YES — disqualified' : 'No'}</dd>
                    <dt>Sidewalk width</dt><dd className="mono">{permit.site === 'tight' ? '~6 ft (TIGHT)' : '~12 ft'}</dd>
                    <dt>Door type</dt><dd>Double swing, glass</dd>
                    <dt>Frontage</dt><dd>{permit.sqft && (permit.sqft/100).toFixed(0)} ft estimated</dd>
                    <dt>ADA path</dt><dd>Clear, flush threshold</dd>
                    <dt>Awning / overhang</dt><dd>Existing — can integrate</dd>
                  </dl>
                </div>

                <div className="lead-section">
                  <h4>Owner / contact</h4>
                  <dl className="kv">
                    <dt>LLC</dt><dd>{permit.llc}</dd>
                    <dt>Owner of record</dt><dd>{permit.biz.includes('&') || permit.biz.includes('Sons') ? 'Multi-member' : 'Single member'}</dd>
                    <dt>Phone</dt><dd className="mono">(347) 555-{(parseInt(permit.id.slice(-4))%10000).toString().padStart(4,'0')}</dd>
                    <dt>Filing contact</dt><dd>{arch?.name} · <span className="mono" style={{color:'var(--ink-mute)'}}>{arch?.email}</span></dd>
                  </dl>
                </div>
              </div>

              <div>
                <div className="lead-section">
                  <h4>Permit (DOB)</h4>
                  <div className="card" style={{padding:14}}>
                    <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between'}}>
                      <div>
                        <div className="mono" style={{fontSize:10.5, color:'var(--ink-mute)'}}>JOB NUMBER</div>
                        <div className="mono" style={{fontSize:13, fontWeight:500, marginBottom:8}}>{permit.id}</div>
                        <div className="mono" style={{fontSize:10.5, color:'var(--ink-mute)'}}>FILED</div>
                        <div style={{fontSize:13, marginBottom:8}}>{permit.filedOn} <span className="mono" style={{color:'var(--ink-mute)', fontSize:11}}>({permit.filed===0?'today':permit.filed+'d ago'})</span></div>
                        <div className="mono" style={{fontSize:10.5, color:'var(--ink-mute)'}}>USE GROUP</div>
                        <div style={{fontSize:13}}>{permit.use}</div>
                      </div>
                      <JobStamp job={permit.job}/>
                    </div>
                  </div>
                </div>

                <div className="lead-section">
                  <h4>SLA cross-reference</h4>
                  <div className="card" style={{padding:14}}>
                    {permit.sla === 'pending' && <>
                      <SlaBadge sla="pending"/>
                      <div style={{marginTop:10, fontSize:13}}>On-premises license <strong>pending</strong> — applied to SLA 9d before DOB filing. Strong signal of imminent opening.</div>
                      <div className="mono" style={{fontSize:10.5, color:'var(--ink-mute)', marginTop:6}}>Likely opening: 60–90 days</div>
                    </>}
                    {permit.sla === 'approved' && <>
                      <SlaBadge sla="approved"/>
                      <div style={{marginTop:10, fontSize:13}}>License already <strong>approved</strong>. Opening soon — high urgency.</div>
                    </>}
                    {permit.sla === 'none' && <>
                      <SlaBadge sla="none"/>
                      <div style={{marginTop:10, fontSize:13, color:'var(--ink-3)'}}>No matching liquor license filing. Could be BYOB, coffee, or earlier-stage. Longer cycle.</div>
                    </>}
                  </div>
                </div>

                <div className="lead-section">
                  <h4>Filing contact — pitch here first</h4>
                  <div className="arch-card" onClick={()=>arch && jump('architects', { archId: arch.id })} style={{cursor: arch ? 'pointer' : 'default'}} title={arch ? `Open ${arch.name} →` : ''}>
                    <div className="row">
                      <div className="arch-avatar">{initials}</div>
                      <div style={{flex:1}}>
                        <div className="arch-name">{arch?.name}</div>
                        <div className="arch-firm">{arch?.firm}</div>
                      </div>
                      <RelationshipPill rel={arch?.relationship}/>
                    </div>
                    <div style={{fontSize:11.5, color:'var(--ink-3)', marginBottom:8, fontStyle:'italic'}}>"{arch?.intro}"</div>
                    <div className="mono" style={{fontSize:10.5, color:'var(--ink-mute)'}}>{arch?.email}</div>
                    <div className="mono" style={{fontSize:10.5, color:'var(--ink-mute)'}}>{arch?.phone}</div>
                    <div className="arch-stats">
                      <div className="arch-stat"><div className="v">{arch?.projects}</div><div className="l">Projects</div></div>
                      <div className="arch-stat"><div className="v">{arch?.replied}</div><div className="l">Replied</div></div>
                      <div className="arch-stat"><div className="v">{Math.round((arch?.replied||0)/Math.max(arch?.projects||1,1)*100)}%</div><div className="l">Rate</div></div>
                    </div>
                  </div>
                </div>

                <div className="lead-section">
                  <h4>Deal math</h4>
                  <div className="card" style={{padding:14}}>
                    <dl className="kv">
                      <dt>Est. project</dt><dd className="mono" style={{fontWeight:500, fontSize:14}}>{permit.est}</dd>
                      <dt>Avg ticket</dt><dd className="mono">$10.4k</dd>
                      <dt>Lead time</dt><dd>2 weeks</dd>
                      <dt>Margin</dt><dd>~38%</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'permit' && <PermitTab permit={permit}/>}
          {tab === 'site' && <div className="lead-section"><h4>Site survey</h4><StreetViewPlaceholder permit={permit} w={860} h={400}/></div>}
          {tab === 'architect' && <ArchitectTab arch={arch} jump={jump} currentPermitId={permit.id}/>}
          {tab === 'outreach' && <OutreachTab permit={permit}/>}
          {tab === 'timeline' && <TimelineTab permit={permit}/>}
        </div>
      </div>
    </div>
  );
}

function PermitTab({ permit }) {
  return (
    <div className="lead-section">
      <h4>Permit document</h4>
      <div className="card" style={{padding:24, fontFamily:'var(--font-mono)', fontSize:12, lineHeight:1.7}}>
        <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1.5px solid var(--ink)', paddingBottom:8, marginBottom:12}}>
          <div>
            <div style={{fontWeight:600, fontSize:11, letterSpacing:1}}>NEW YORK CITY DEPARTMENT OF BUILDINGS</div>
            <div style={{fontSize:10, color:'var(--ink-mute)'}}>ALTERATION PERMIT — {permit.job}</div>
          </div>
          <div className="job-stamp" style={{padding:'6px 12px', fontSize:14}}>{permit.job}</div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 24px'}}>
          <div><span style={{color:'var(--ink-mute)'}}>JOB NO.</span> {permit.id}</div>
          <div><span style={{color:'var(--ink-mute)'}}>FILED</span> {permit.filedOn}</div>
          <div><span style={{color:'var(--ink-mute)'}}>OWNER</span> {permit.llc}</div>
          <div><span style={{color:'var(--ink-mute)'}}>BIN</span> 100{permit.id.slice(-4)}</div>
          <div><span style={{color:'var(--ink-mute)'}}>BLOCK / LOT</span> 0482 / 023</div>
          <div><span style={{color:'var(--ink-mute)'}}>SQ FT</span> {permit.sqft}</div>
          <div><span style={{color:'var(--ink-mute)'}}>USE GROUP</span> {permit.use}</div>
          <div><span style={{color:'var(--ink-mute)'}}>OCCUPANCY</span> 74</div>
          <div style={{gridColumn:'1/-1', paddingTop:8, borderTop:'1px solid var(--rule)'}}>
            <span style={{color:'var(--ink-mute)'}}>WORK DESCRIPTION</span><br/>
            Interior alteration to existing eating &amp; drinking establishment. New bar, kitchen reconfig, ADA bathroom, partition walls, MEP work. No change in use group, no change in egress.
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchitectTab({ arch, jump, currentPermitId }) {
  if (!arch) return null;
  const { PERMITS } = window.VESTIBULE_DATA;
  const archPermits = PERMITS.filter(p => p.arch === arch.id);
  return (
    <div>
      <div className="lead-section">
        <h4>Filing contact</h4>
        <div className="arch-card" style={{padding:18, cursor: jump ? 'pointer' : 'default'}} onClick={()=>jump && jump('architects', { archId: arch.id })} title={jump ? `Open ${arch.name} →` : ''}>
          <div className="row">
            <div className="arch-avatar" style={{width:48, height:48, fontSize:18}}>{arch.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</div>
            <div style={{flex:1}}>
              <div className="arch-name" style={{fontSize:16}}>{arch.name}</div>
              <div className="arch-firm">{arch.firm}</div>
            </div>
            <RelationshipPill rel={arch.relationship}/>
            {jump && <span className="mono" style={{fontSize:10.5, color:'var(--ink-mute)', marginLeft:8}}>OPEN →</span>}
          </div>
          <div className="mono" style={{fontSize:11.5, color:'var(--ink-3)', marginTop:10}}>{arch.email} · {arch.phone}</div>
          <div style={{fontSize:13, color:'var(--ink-2)', marginTop:10}}>{arch.notes}</div>
        </div>
      </div>
      <div className="lead-section">
        <h4>Other permits filed by {arch.name.split(' ')[0]}</h4>
        <div className="card" style={{padding:0}}>
          <table className="data-table">
            <thead><tr><th>Business</th><th>Address</th><th>Job</th><th>SLA</th><th>Stage</th></tr></thead>
            <tbody>
              {archPermits.slice(0,8).map(p=>(
                <tr key={p.id}
                    onClick={()=>jump && p.id !== currentPermitId && jump(null, { permitId: p.id })}
                    style={{opacity: p.id===currentPermitId ? 0.5 : 1, cursor: p.id===currentPermitId ? 'default' : 'pointer'}}>
                  <td><div className="biz">{p.biz}{p.id===currentPermitId && <span className="mono" style={{marginLeft:6, fontSize:10, color:'var(--ink-mute)'}}>(this lead)</span>}</div></td>
                  <td className="mono addr">{p.addr}</td>
                  <td><JobStamp job={p.job}/></td>
                  <td><SlaBadge sla={p.sla}/></td>
                  <td><StagePill stage={p.stage}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OutreachTab({ permit }) {
  const arch = ARCH_BY_ID[permit.arch];
  return (
    <div className="lead-section">
      <h4>Suggested first touch — {arch?.name.split(' ')[0]}</h4>
      <div className="card" style={{padding:18, fontFamily:'var(--font-mono)', fontSize:12.5, lineHeight:1.6, whiteSpace:'pre-line'}}>
{`Subject: Quick question on the ${permit.biz} permit on ${permit.addr}

Hi ${arch?.name.split(' ')[0]} —

Saw your name on the ${permit.job} filing for ${permit.biz} at ${permit.addr}. I run Vestibule — we design + install entry vestibules for restaurants, usually billed back to the build budget. Avg add: $9–12k, 2-week lead time, ADA + DOB compliant.

Two questions:
1. Are they planning a vestibule already?
2. Open to a quick intro call? Happy to come by the site Tuesday if you're there.

— [you]`}
      </div>
      <div style={{display:'flex', gap:6, marginTop:10}}>
        <button className="btn small accent">Send</button>
        <button className="btn small">Edit</button>
        <button className="btn small ghost">Use a different template</button>
      </div>
    </div>
  );
}

function TimelineTab({ permit }) {
  const events = [
    { d: permit.filedOn, t: 'DOB permit filed', sub: permit.id },
    { d: '2026-04-30',  t: 'SLA application matched', sub: 'Cross-ref pulled — pending On-Premises' },
    { d: '2026-05-19',  t: 'Site check passed',  sub: 'Street View — sidewalk width OK' },
    { d: '2026-05-20',  t: 'Auto-enriched',      sub: 'Owner LLC matched to NYC DOS records' },
    { d: '2026-05-22',  t: 'Sent to triage queue', sub: 'Weekly pull · Hot · Score ' + permit.score },
  ];
  return (
    <div className="lead-section">
      <h4>Timeline</h4>
      <div style={{position:'relative', paddingLeft:28}}>
        <div style={{position:'absolute', left:7, top:6, bottom:6, width:1.5, background:'var(--rule-2)'}}></div>
        {events.map((e,i)=>(
          <div key={i} style={{position:'relative', marginBottom:18}}>
            <div style={{position:'absolute', left:-26, top:4, width:14, height:14, borderRadius:'50%', background: i===0?'var(--orange)':'var(--paper)', border:'2px solid var(--ink)'}}></div>
            <div className="mono" style={{fontSize:10.5, color:'var(--ink-mute)'}}>{e.d}</div>
            <div style={{fontSize:13.5, fontWeight:500}}>{e.t}</div>
            <div className="mono" style={{fontSize:11, color:'var(--ink-3)'}}>{e.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StakeholderMap({ permit, jump }) {
  const arch = ARCH_BY_ID[permit.arch];
  const account = permit.accountId ? window.ACCOUNT_BY_ID[permit.accountId] : null;
  const property = permit.propertyId ? window.PROPERTY_BY_ID[permit.propertyId] : null;
  const contact = permit.contactId ? window.CONTACT_BY_ID[permit.contactId] : null;

  const lanes = [
    {
      label: 'FILING CONTACT',
      strategy: 'Pitch first — already on site',
      color: 'var(--orange)',
      who: arch ? { name: arch.name, sub: arch.firm, kind: arch.kind === 'expediter' ? 'Expediter' : 'Architect', rel: arch.relationship, badge: arch.kind?.toUpperCase() } : null,
      onOpen: arch && jump ? () => jump('architects', { archId: arch.id }) : null,
    },
    {
      label: account ? (account.kind === 'hotel' ? 'HOTEL GROUP' : 'RESTAURANT GROUP') : 'OPERATOR',
      strategy: account ? `Master spec across ${account.locations} locations` : (contact ? 'Solo operator — direct touch' : 'No group affiliation detected'),
      color: account?.kind === 'hotel' ? 'var(--blue)' : 'var(--orange-deep)',
      who: account
        ? { name: account.name, sub: `${account.locations} locations · ${account.openings} live`, kind: account.kind === 'hotel' ? 'Hotel group' : 'Restaurant group', rel: account.relationship, badge: account.short.toUpperCase() }
        : contact ? { name: contact.name, sub: contact.title + ' · ' + contact.org, kind: 'Solo operator', rel: contact.relationship, badge: 'SOLO' } : null,
      onOpen: account && jump ? () => jump('accounts', { acctId: account.id }) : null,
    },
    {
      label: 'PROPERTY OWNER',
      strategy: property ? (property.kind === 'reit' ? 'Through asset manager' : 'Direct — small portfolio') : 'Landlord not yet identified',
      color: 'var(--ink-2)',
      who: property
        ? { name: property.name, sub: property.portfolio + ' · ' + property.primary, kind: property.kind === 'reit' ? 'REIT' : property.kind === 'family' ? 'Family office' : 'Private', rel: property.relationship, badge: property.kind.toUpperCase() }
        : null,
      onOpen: property && jump ? () => jump('properties', { propId: property.id }) : null,
    },
  ];

  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
      {lanes.map((lane, i) => (
        <div key={i} className="card stakeholder-lane" onClick={lane.onOpen || undefined}
             style={{padding:12, borderTop:`3px solid ${lane.color}`, display:'flex', flexDirection:'column', cursor: lane.onOpen ? 'pointer' : 'default'}}
             title={lane.onOpen ? `Open ${lane.who?.name} →` : ''}>
          <div className="mono" style={{fontSize:9.5, letterSpacing:0.6, color:lane.color, fontWeight:600, marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span>{lane.label}</span>
            {lane.onOpen && <span style={{color:'var(--ink-mute)', fontWeight:400}}>OPEN →</span>}
          </div>
          {lane.who ? (
            <>
              <div style={{display:'flex', gap:10, alignItems:'flex-start'}}>
                <div className="avatar" style={{width:32, height:32, fontSize:11, background:lane.color, flexShrink:0}}>
                  {lane.who.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}
                </div>
                <div style={{minWidth:0, flex:1}}>
                  <div style={{fontWeight:500, fontSize:12.5, lineHeight:1.2}}>{lane.who.name}</div>
                  <div className="mono" style={{fontSize:10, color:'var(--ink-mute)', marginTop:2}}>{lane.who.sub}</div>
                </div>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:6, marginTop:8}}>
                <RelationshipPill rel={lane.who.rel}/>
                <span className="mono" style={{fontSize:9.5, color:'var(--ink-mute)'}}>{lane.who.kind}</span>
              </div>
              <div style={{flex:1}}></div>
              <div style={{marginTop:10, paddingTop:8, borderTop:'1px solid var(--rule)', fontSize:11, color:'var(--ink-3)', fontStyle:'italic'}}>
                {lane.strategy}
              </div>
            </>
          ) : (
            <>
              <div style={{padding:'10px 0', fontSize:11.5, color:'var(--ink-mute)', fontStyle:'italic'}}>
                Not identified for this lead.
              </div>
              <div style={{flex:1}}></div>
              <div style={{marginTop:8, paddingTop:8, borderTop:'1px solid var(--rule)', fontSize:11, color:'var(--ink-3)'}}>
                {lane.strategy}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

window.StakeholderMap = StakeholderMap;
window.LeadDetail = LeadDetail;