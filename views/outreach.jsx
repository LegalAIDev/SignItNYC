// Outreach composer view
const { useState: useOutState } = React;

function OutreachView({ onSelect }) {
  const { TEMPLATES, PERMITS } = window.VESTIBULE_DATA;
  const [active, setActive] = useOutState(TEMPLATES[0].id);
  const tpl = TEMPLATES.find(t=>t.id===active);

  // Sample recipient — Goldfinch
  const samplePermit = PERMITS.find(p=>p.biz==='Goldfinch Bar') || PERMITS[0];
  const arch = ARCH_BY_ID[samplePermit.arch];

  const fill = (s) => s
    .replace(/{archFirst}/g, arch.name.split(' ')[0])
    .replace(/{biz}/g, samplePermit.biz)
    .replace(/{addr}/g, samplePermit.addr)
    .replace(/{filed}/g, samplePermit.filed)
    .replace(/{arch}/g, arch.name);

  // Sample log
  const log = [
    { when:'2h ago',   to:'Felix Ortega',     biz:'Goldfinch Bar',     status:'opened' },
    { when:'1d ago',   to:'Daniel Cho',       biz:'Carmine Sons Pizza',status:'replied'},
    { when:'2d ago',   to:'Maya Rosenfeld',   biz:'Heron Wine',        status:'sent'   },
    { when:'3d ago',   to:'Lina Brennan',     biz:'Honey & Salt',      status:'opened' },
    { when:'4d ago',   to:'Felix Ortega',     biz:'Slate Bar',         status:'replied'},
    { when:'5d ago',   to:'Jin Park',         biz:'Hudson Oyster Bar', status:'sent'   },
    { when:'1w ago',   to:'Sophie Chan',      biz:'Walker Wine Bar',   status:'opened' },
    { when:'1w ago',   to:'Tomás Vidal',      biz:'Sake Bar Rin',      status:'replied'},
  ];

  return (
    <div className="content" style={{display:'flex', flexDirection:'column'}}>
      <div className="compose" style={{flex:1, minHeight:0}}>
        <div className="template-list">
          <div style={{padding:'14px 16px 8px', borderBottom:'1px solid var(--rule)'}}>
            <div className="serif" style={{fontSize:18, letterSpacing:'-0.2px'}}>Templates</div>
            <div className="mono" style={{fontSize:10, color:'var(--ink-mute)', textTransform:'uppercase', letterSpacing:0.5}}>4 active</div>
          </div>
          {TEMPLATES.map(t=>(
            <div key={t.id} className={`template-item ${t.id===active?'active':''}`} onClick={()=>setActive(t.id)}>
              <div className="name">{t.name}</div>
              <div className="sub">used 23× · 41% reply</div>
            </div>
          ))}
          <div style={{padding:'14px 16px'}}><button className="btn small">+ New template</button></div>
        </div>

        <div className="compose-edit">
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
            <h3 className="serif" style={{margin:0, fontSize:26, letterSpacing:'-0.3px'}}>{tpl.name}</h3>
            <span style={{flex:1}}></span>
            <span className="mono" style={{fontSize:10.5, color:'var(--ink-mute)'}}>VARIABLES AUTO-FILLED FOR PREVIEW</span>
          </div>

          <div className="field">
            <label>To</label>
            <div className="recipients">
              <span className="recipient-chip">{arch.name} <span className="mono" style={{color:'var(--ink-mute)'}}>· {arch.email}</span> <span className="x">✕</span></span>
              <button className="btn small ghost" style={{padding:'2px 8px'}}>+ Add recipient</button>
            </div>
          </div>
          <div className="field">
            <label>Subject</label>
            <input defaultValue={fill(tpl.subject)}/>
          </div>
          <div className="field" style={{flex:1, display:'flex', flexDirection:'column'}}>
            <label>Body</label>
            <textarea defaultValue={fill(tpl.body)} style={{flex:1}}/>
          </div>
          <div style={{display:'flex', gap:8, marginTop:10}}>
            <button className="btn primary">Send to {arch.name.split(' ')[0]}</button>
            <button className="btn">Save as draft</button>
            <button className="btn ghost">Schedule…</button>
            <span style={{flex:1}}></span>
            <span className="mono" style={{fontSize:10.5, color:'var(--ink-mute)'}}>VESTIBULE • SENT VIA YOUR GMAIL</span>
          </div>
        </div>
      </div>

      <div style={{borderTop:'1px solid var(--rule)', background:'var(--paper)'}}>
        <div className="card-head" style={{borderBottom:'1px solid var(--rule)'}}>
          <h3>Sent log</h3>
          <span className="head-sub">Last 7 days · 8 sent · 38% reply</span>
        </div>
        {log.map((l,i)=>(
          <div key={i} className="log-row">
            <div className="mono">{l.when}</div>
            <div><strong>{l.to}</strong> <span style={{color:'var(--ink-mute)'}}>— re: {l.biz}</span></div>
            <div style={{display:'flex', justifyContent:'flex-end'}}><span className={`log-status ${l.status}`}>{l.status.toUpperCase()}</span></div>
            <div style={{textAlign:'right'}}><button className="btn small ghost">Open</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.OutreachView = OutreachView;
