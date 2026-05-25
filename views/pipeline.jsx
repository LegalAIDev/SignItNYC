// Pipeline view — table + kanban toggle, filters
const { useState: usePipeState, useMemo: usePipeMemo } = React;

function PipelineView({ onSelect, filters, setFilters }) {
  const { PERMITS } = window.VESTIBULE_DATA;
  const [mode, setMode] = usePipeState('table');
  const [sortBy, setSortBy] = usePipeState('score');
  const [q, setQ] = usePipeState('');

  const list = usePipeMemo(() => {
    let l = PERMITS;
    if (filters.boro.length)  l = l.filter(p => filters.boro.includes(p.boro));
    if (filters.sla !== 'all')l = l.filter(p => p.sla === filters.sla);
    if (filters.job !== 'all')l = l.filter(p => p.job === filters.job);
    if (filters.stage.length) l = l.filter(p => filters.stage.includes(p.stage));
    if (q) {
      const qq = q.toLowerCase();
      l = l.filter(p => p.biz.toLowerCase().includes(qq) || p.addr.toLowerCase().includes(qq) || p.id.toLowerCase().includes(qq));
    }
    l = [...l].sort((a,b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'filed') return a.filed - b.filed;
      if (sortBy === 'biz') return a.biz.localeCompare(b.biz);
      if (sortBy === 'est') return parseFloat(b.est.replace(/[^0-9.]/g,'')||0) - parseFloat(a.est.replace(/[^0-9.]/g,'')||0);
      return 0;
    });
    return l;
  }, [filters, sortBy, q]);

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="filters">
        <div className="search">
          <span className="search-icon">⌕</span>
          <input placeholder="Search permits, addresses, IDs…" value={q} onChange={e=>setQ(e.target.value)}/>
          <Kbd>/</Kbd>
        </div>
        <div className="seg">
          {['all','pending','approved','none'].map(v=>(
            <button key={v} className={filters.sla===v?'active':''} onClick={()=>setFilters({...filters, sla:v})}>{v==='all'?'All SLA':v==='pending'?'Pending':v==='approved'?'Approved':'No SLA'}</button>
          ))}
        </div>
        <div className="seg">
          {['all','A1','A2'].map(v=>(
            <button key={v} className={filters.job===v?'active':''} onClick={()=>setFilters({...filters, job:v})}>{v==='all'?'All jobs':v}</button>
          ))}
        </div>
        {['Manhattan','Brooklyn','Queens','Bronx'].map(b=>(
          <span key={b} className={`filter-chip ${filters.boro.includes(b)?'active':''}`}
            onClick={()=>{const has=filters.boro.includes(b);setFilters({...filters, boro: has?filters.boro.filter(x=>x!==b):[...filters.boro,b]});}}>
            {b}
          </span>
        ))}
        <span style={{flex:1}}></span>
        <div className="seg">
          <button className={mode==='table'?'active':''} onClick={()=>setMode('table')}>TABLE</button>
          <button className={mode==='kanban'?'active':''} onClick={()=>setMode('kanban')}>KANBAN</button>
        </div>
      </div>
      <div style={{flex:1, overflow:'auto'}}>
        {mode==='table'
          ? <PipelineTable list={list} sortBy={sortBy} setSortBy={setSortBy} onSelect={onSelect}/>
          : <PipelineKanban list={list} onSelect={onSelect}/>}
      </div>
      <div style={{padding:'8px 22px', borderTop:'1px solid var(--rule)', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--ink-mute)', display:'flex', justifyContent:'space-between'}}>
        <span>{list.length} of {PERMITS.length} permits · sort: {sortBy}</span>
        <span>Last DOB sync: <strong style={{color:'var(--ink-2)'}}>2h ago</strong> · Next: in 5d 22h</span>
      </div>
    </div>
  );
}

function PipelineTable({ list, sortBy, setSortBy, onSelect }) {
  return (
    <table className="data-table">
      <thead><tr>
        <th style={{width:38}}></th>
        <th onClick={()=>setSortBy('biz')} style={{cursor:'pointer'}}>Business</th>
        <th>Address</th>
        <th>LLC / Owner</th>
        <th>Job</th>
        <th>SLA</th>
        <th>Site</th>
        <th>Architect / Expediter</th>
        <th onClick={()=>setSortBy('filed')} style={{cursor:'pointer'}}>Filed</th>
        <th onClick={()=>setSortBy('est')} style={{cursor:'pointer', textAlign:'right'}}>Est. value</th>
        <th onClick={()=>setSortBy('score')} style={{cursor:'pointer'}}>Heat</th>
        <th>Stage</th>
      </tr></thead>
      <tbody>
        {list.map(p => {
          const arch = ARCH_BY_ID[p.arch];
          return (
            <tr key={p.id} onClick={()=>onSelect(p)}>
              <td><BoroChip boro={p.boro}/></td>
              <td><div className="biz">{p.biz}</div><div className="mono muted" style={{fontSize:10}}>{p.id}</div></td>
              <td className="mono addr" style={{fontSize:11.5}}>{p.addr}</td>
              <td className="mono" style={{fontSize:10.5, color:'var(--ink-3)'}}>{p.llc}</td>
              <td><JobStamp job={p.job}/></td>
              <td><SlaBadge sla={p.sla}/></td>
              <td><SiteBadge site={p.site}/></td>
              <td><div style={{fontSize:12}}>{arch?.name.split(',')[0]}</div><div className="mono muted" style={{fontSize:10}}>{arch?.firm}</div></td>
              <td className="mono" style={{fontSize:11, color:'var(--ink-3)'}}>{p.filed === 0 ? 'today' : p.filed + 'd'}</td>
              <td className="mono" style={{fontWeight:500, textAlign:'right'}}>{p.est}</td>
              <td><Score value={p.score}/></td>
              <td><StagePill stage={p.stage}/></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function PipelineKanban({ list, onSelect }) {
  const { STAGES } = window.VESTIBULE_DATA;
  return (
    <div className="kanban">
      {STAGES.map(col => {
        const items = list.filter(p => p.stage === col.id);
        return (
          <div key={col.id} className="kanban-col">
            <div className="kanban-head" style={{borderColor: col.color}}>
              <span className="dot" style={{background: col.color}}></span>
              <span className="label">{col.label}</span>
              <span className="count">{items.length}</span>
            </div>
            <div style={{flex:1, overflow:'auto', paddingRight:4}}>
              {items.map(p=>(
                <div key={p.id} className="kanban-card" onClick={()=>onSelect(p)}>
                  <div className="kc-top">
                    <div className="biz">{p.biz}</div>
                    <JobStamp job={p.job}/>
                  </div>
                  <div className="addr">{p.addr}</div>
                  <div className="kc-bot">
                    <Score value={p.score}/>
                    <span className="mono">{p.est}</span>
                  </div>
                  <div className="kc-bot" style={{marginTop:6}}>
                    <SlaBadge sla={p.sla}/>
                    <span className="mono">{p.filed === 0 ? 'today' : p.filed + 'd'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

window.PipelineView = PipelineView;
