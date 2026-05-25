// Briefing view — what to do Monday at 7am
const { useState: useBriefState } = React;

function BriefingView({ onSelect, goTo }) {
  const { PERMITS, ARCHITECTS, ACTIVITY } = window.VESTIBULE_DATA;

  // The Monday-morning queue, grouped by what action it demands.
  const newToday   = PERMITS.filter(p => p.filed === 0);
  const slaHot     = PERMITS.filter(p => p.sla === 'pending' && p.filed > 0 && p.filed <= 3 && p.stage === 'qualified');
  const awaiting   = PERMITS.filter(p => p.stage === 'contacted' && (p.contactedDays || 0) >= 4)
                            .sort((a,b)=>(b.contactedDays||0)-(a.contactedDays||0));
  const replies    = ACTIVITY.filter(a => a.type === 'reply');
  const meetings   = PERMITS.filter(p => p.stage === 'meeting');
  const stale      = PERMITS.filter(p => p.stage === 'enriched' && p.filed >= 12);
  const dropped    = ACTIVITY.filter(a => a.type === 'dropped');

  const total = newToday.length + slaHot.length + awaiting.length + replies.length + meetings.length + stale.length;

  const greeting = (() => {
    const h = 7; // mock "now"
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="content briefing-view">
      <div className="briefing-hero">
        <div>
          <div className="mono" style={{fontSize:11, color:'var(--ink-mute)', letterSpacing:0.5}}>MONDAY · MAY 25 · 7:14 AM</div>
          <h1 className="briefing-hello">{greeting}, Jonah.</h1>
          <p className="briefing-sub">
            Overnight: <strong>{newToday.length}</strong> new permits, <strong>{slaHot.length}</strong> matched a fresh liquor license,
            and <strong>{awaiting.length}</strong> {awaiting.length===1?'lead is':'leads are'} waiting on you to follow up.
            Below is the order I'd work them in.
          </p>
        </div>
        <div className="briefing-hero-meta">
          <div className="briefing-stat">
            <div className="num">{total}</div>
            <div className="lbl">items in queue</div>
          </div>
          <div className="briefing-stat alt">
            <div className="num">~{Math.round(total * 4)}m</div>
            <div className="lbl">est. to clear</div>
          </div>
        </div>
      </div>

      <div className="briefing-grid">
        <Block
          tag="DO FIRST"
          accent="var(--orange)"
          title="New permits filed since Friday"
          subtitle={`${newToday.length} pulled overnight from DOB · review + triage`}
          cta={{label:'Open weekly pull →', onClick:()=>goTo('weekly')}}
        >
          {newToday.map(p => (
            <BriefRow key={p.id} permit={p} onSelect={onSelect}
              right={<span className="mono brief-time">filed today</span>}/>
          ))}
        </Block>

        <Block
          tag="HOT"
          accent="var(--orange-deep)"
          title="SLA cross-ref overnight"
          subtitle={`${slaHot.length} permit${slaHot.length===1?'':'s'} matched a pending liquor license · these are opening 60–90 days`}
          cta={{label:'Open pipeline →', onClick:()=>goTo('pipeline', { filters:{ sla:'pending' } })}}
        >
          {slaHot.map(p => (
            <BriefRow key={p.id} permit={p} onSelect={onSelect}
              right={<><span className="brief-pulse"></span><span className="mono brief-time">SLA pending</span></>}/>
          ))}
        </Block>

        <Block
          tag="AWAITING REPLY"
          accent="var(--blue)"
          title="Follow-ups due"
          subtitle="You sent outreach 4+ days ago — time to nudge"
          cta={{label:'Draft batch follow-ups →', onClick:()=>goTo('outreach')}}
        >
          {awaiting.length === 0
            ? <div className="brief-empty">All caught up — nothing waiting longer than 4 days.</div>
            : awaiting.map(p => (
              <BriefRow key={p.id} permit={p} onSelect={onSelect}
                right={<span className="mono brief-time" style={{color: (p.contactedDays||0) >= 10 ? 'var(--red)' : 'var(--ink-mute)'}}>
                  sent {p.contactedDays}d ago
                </span>}/>
            ))
          }
        </Block>

        <Block
          tag="REPLIES IN"
          accent="var(--green)"
          title="Architects who wrote back"
          subtitle="React fast — replies cool quickly"
          cta={null}
        >
          {replies.map(a => {
            const arch = window.ARCH_BY_ID[a.ref];
            if (!arch) return null;
            return (
              <div key={a.id} className="brief-row" onClick={()=>goTo('architects', { archId: arch.id })}>
                <div className="brief-avatar" style={{background:'var(--green)'}}>
                  {arch.name.split(' ').map(x=>x[0]).slice(0,2).join('')}
                </div>
                <div style={{minWidth:0, flex:1}}>
                  <div className="brief-biz">{arch.name}</div>
                  <div className="mono brief-addr">{a.text.replace(/^[^—]*—\s*/,'').slice(0,80)}</div>
                </div>
                <RelationshipPill rel={arch.relationship}/>
                <span className="mono brief-time">{a.when}</span>
              </div>
            );
          })}
        </Block>

        <Block
          tag="ON THE CALENDAR"
          accent="var(--green-deep)"
          title="Site walks + meetings this week"
          subtitle="Confirm 24h before — bring tape measure"
          cta={null}
        >
          {meetings.map(p => (
            <BriefRow key={p.id} permit={p} onSelect={onSelect}
              right={<span className="mono brief-time">Tue 10:30am</span>}/>
          ))}
        </Block>

        <Block
          tag="GOING STALE"
          accent="var(--amber)"
          title="Enriched but never reached"
          subtitle="Decide: pitch them, or auto-drop after 14 days"
          cta={null}
        >
          {stale.slice(0,5).map(p => (
            <BriefRow key={p.id} permit={p} onSelect={onSelect}
              right={<span className="mono brief-time">enriched {p.filed}d ago</span>}/>
          ))}
          {stale.length > 5 && (
            <div className="brief-more" onClick={()=>goTo('pipeline', { filters:{ stage:['enriched'] } })}>
              + {stale.length - 5} more · review in pipeline →
            </div>
          )}
        </Block>
      </div>

      <div className="briefing-foot">
        <div className="mono" style={{fontSize:10.5, color:'var(--ink-mute)'}}>
          BRIEFING ASSEMBLED AT 7:00 AM · NEXT REFRESH MONDAY 7:00 AM · UNSUBSCRIBE FROM EMAIL DIGEST
        </div>
      </div>
    </div>
  );
}

function Block({ tag, accent, title, subtitle, cta, children }) {
  return (
    <div className="brief-block">
      <div className="brief-block-head" style={{borderLeftColor: accent}}>
        <div>
          <div className="mono brief-tag" style={{color: accent}}>{tag}</div>
          <h3>{title}</h3>
          <div className="brief-block-sub">{subtitle}</div>
        </div>
        {cta && <button className="btn small" onClick={cta.onClick}>{cta.label}</button>}
      </div>
      <div className="brief-block-body">
        {children}
      </div>
    </div>
  );
}

function BriefRow({ permit, onSelect, right }) {
  const arch = window.ARCH_BY_ID[permit.arch];
  return (
    <div className="brief-row" onClick={()=>onSelect(permit)}>
      <div className="brief-avatar">{permit.biz.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</div>
      <div style={{minWidth:0, flex:1}}>
        <div className="brief-biz">
          {permit.biz}
          <Score value={permit.score}/>
        </div>
        <div className="mono brief-addr">
          {permit.addr} · {permit.boro} · {arch?.name.split(',')[0]}
        </div>
      </div>
      <SlaBadge sla={permit.sla}/>
      <JobStamp job={permit.job}/>
      {right}
    </div>
  );
}

window.BriefingView = BriefingView;
