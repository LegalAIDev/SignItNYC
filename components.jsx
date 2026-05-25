// Shared components for Vestibule
const { useState, useEffect, useRef, useMemo } = React;

const STAGE_BY_ID = {};
window.VESTIBULE_DATA.STAGES.forEach(s => { STAGE_BY_ID[s.id] = s; });
const ARCH_BY_ID = {};
window.VESTIBULE_DATA.ARCHITECTS.forEach(a => { ARCH_BY_ID[a.id] = a; });

// Stage pill
function StagePill({ stage, small }) {
  const s = STAGE_BY_ID[stage] || { label: stage, color: '#999' };
  return (
    <span className="stage-pill" style={{
      '--c': s.color,
      fontSize: small ? 10 : 11,
      padding: small ? '2px 6px' : '3px 8px',
    }}>
      <span className="stage-dot" style={{ background: s.color }}></span>
      {s.label}
    </span>
  );
}

// SLA badge
function SlaBadge({ sla }) {
  const map = {
    pending:  { label:'SLA Pending',  cls:'sla-pending'  },
    approved: { label:'SLA Approved', cls:'sla-approved' },
    none:     { label:'No SLA',       cls:'sla-none'     },
  };
  const m = map[sla] || map.none;
  return <span className={`sla-badge ${m.cls}`}>{m.label}</span>;
}

// Site-check icon
function SiteBadge({ site }) {
  const map = {
    good:     { label:'Sidewalk OK',   cls:'site-good',  glyph:'●' },
    tight:    { label:'Tight',         cls:'site-tight', glyph:'◐' },
    'has-vest':{label:'Has Vestibule', cls:'site-has',   glyph:'⊘' },
  };
  const m = map[site] || map.good;
  return <span className={`site-badge ${m.cls}`} title={m.label}><span className="site-glyph">{m.glyph}</span>{m.label}</span>;
}

// Score: 0-100 with bar
function Score({ value }) {
  if (value === 0) return <span className="score-dash">—</span>;
  const hue = value > 80 ? 14 : value > 65 ? 35 : value > 50 ? 50 : 200;
  return (
    <span className="score">
      <span className="score-num" style={{ color: `oklch(0.55 0.18 ${hue})` }}>{value}</span>
      <span className="score-bar"><span className="score-fill" style={{ width: value + '%', background: `oklch(0.6 0.16 ${hue})` }}></span></span>
    </span>
  );
}

// Job stamp
function JobStamp({ job }) {
  return <span className={`job-stamp job-${job.toLowerCase()}`}>{job}</span>;
}

// Borough chip
function BoroChip({ boro }) {
  const abbr = { Manhattan:'MN', Brooklyn:'BK', Queens:'QN', Bronx:'BX', 'Staten Island':'SI' }[boro] || boro;
  return <span className="boro-chip" title={boro}>{abbr}</span>;
}

// Relationship pill
function RelationshipPill({ rel }) {
  const map = {
    hot:  { label:'HOT',   c:'#E85C2A' },
    warm: { label:'WARM',  c:'#C49A3D' },
    cool: { label:'COOL',  c:'#7A8FA8' },
    cold: { label:'COLD',  c:'#9B9088' },
    new:  { label:'NEW',   c:'#5A8A4C' },
  };
  const m = map[rel] || map.cold;
  return <span className="rel-pill" style={{ '--c': m.c }}>{m.label}</span>;
}

// Inline sparkline (SVG)
function Sparkline({ data, w=80, h=24, color='#0F1419', fill=false }) {
  if (!data || data.length < 2) return <svg width={w} height={h}/>;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v,i) => [i*step, h - ((v - min)/range) * (h-4) - 2]);
  const d = 'M ' + pts.map(p => p.join(' ')).join(' L ');
  const fillD = d + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="sparkline">
      {fill && <path d={fillD} fill={color} opacity="0.12"/>}
      <path d={d} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.2" fill={color}/>
    </svg>
  );
}

// Street View placeholder (procedural SVG looking like a stylized storefront)
function StreetViewPlaceholder({ permit, w=400, h=240 }) {
  // generate a deterministic seed from permit id
  const seed = permit.id.split('').reduce((a,c)=>a + c.charCodeAt(0), 0);
  const rng = (n) => {
    const x = Math.sin(seed * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  const sky = `oklch(${0.78 + rng(1)*0.08} 0.03 ${230 + rng(2)*40})`;
  const wallBase = `oklch(${0.45 + rng(3)*0.2} 0.04 ${30 + rng(4)*40})`;
  const wallTrim = `oklch(${0.35 + rng(5)*0.15} 0.04 ${30 + rng(6)*30})`;
  const awning = `oklch(${0.4 + rng(7)*0.2} 0.12 ${rng(8) > 0.5 ? 14 : 200})`;
  const buildings = Math.floor(2 + rng(9)*2);
  const hasVestibule = permit.site === 'has-vest';
  const tight = permit.site === 'tight';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="streetview" preserveAspectRatio="xMidYMid slice">
      {/* sky */}
      <rect width={w} height={h*0.55} fill={sky}/>
      {/* upper buildings */}
      {Array.from({length: buildings}).map((_,i) => {
        const bw = w / buildings;
        const bh = 40 + rng(10+i)*60;
        return <rect key={i} x={i*bw} y={h*0.55 - bh} width={bw - 2} height={bh} fill={`oklch(${0.5 + rng(20+i)*0.15} 0.03 ${30 + rng(30+i)*60})`}/>;
      })}
      {/* windows upper */}
      {Array.from({length: buildings*6}).map((_,i) => {
        const bw = w / buildings;
        const b = Math.floor(i/6);
        const wy = h*0.55 - 30 - (i % 3) * 12;
        const wx = b*bw + 8 + ((i % 6) > 2 ? bw*0.5 : 0) + ((i%2)*16);
        return <rect key={'w'+i} x={wx} y={wy} width={8} height={6} fill="oklch(0.7 0.05 70)" opacity="0.6"/>;
      })}
      {/* main facade */}
      <rect x="0" y={h*0.55} width={w} height={h*0.32} fill={wallBase}/>
      {/* trim */}
      <rect x="0" y={h*0.55} width={w} height="3" fill={wallTrim}/>
      <rect x="0" y={h*0.87 - 3} width={w} height="3" fill={wallTrim}/>
      {/* awning */}
      <rect x={w*0.25} y={h*0.55 + 6} width={w*0.5} height="14" fill={awning}/>
      <polygon points={`${w*0.25},${h*0.55+20} ${w*0.75},${h*0.55+20} ${w*0.7},${h*0.55+28} ${w*0.3},${h*0.55+28}`} fill={awning} opacity="0.7"/>
      {/* door area */}
      <rect x={w*0.42} y={h*0.6} width={w*0.16} height={h*0.27} fill="oklch(0.22 0.02 40)"/>
      {/* door frame */}
      <rect x={w*0.42} y={h*0.6} width={w*0.16} height={h*0.27} fill="none" stroke={wallTrim} strokeWidth="2"/>
      {/* door split */}
      <line x1={w*0.5} y1={h*0.6} x2={w*0.5} y2={h*0.87} stroke={wallTrim} strokeWidth="1"/>
      {/* windows on facade */}
      <rect x={w*0.06} y={h*0.62} width={w*0.3} height={h*0.18} fill="oklch(0.7 0.04 220)" opacity="0.7" stroke={wallTrim} strokeWidth="1.5"/>
      <rect x={w*0.64} y={h*0.62} width={w*0.3} height={h*0.18} fill="oklch(0.7 0.04 220)" opacity="0.7" stroke={wallTrim} strokeWidth="1.5"/>
      {/* sidewalk */}
      <rect x="0" y={h*0.87} width={w} height={h*0.13} fill="oklch(0.65 0.01 80)"/>
      {/* sidewalk line */}
      <line x1="0" y1={h*0.93} x2={w} y2={h*0.93} stroke="oklch(0.5 0.01 80)" strokeWidth="1" strokeDasharray="6 4"/>
      {/* vestibule (if exists) */}
      {hasVestibule && (
        <g>
          <rect x={w*0.38} y={h*0.78} width={w*0.24} height={h*0.13} fill="oklch(0.45 0.05 220)" opacity="0.85" stroke={wallTrim} strokeWidth="1.5"/>
          <rect x={w*0.4} y={h*0.81} width={w*0.2} height={h*0.07} fill="oklch(0.75 0.05 220)" opacity="0.6"/>
        </g>
      )}
      {/* lamppost on tight sites */}
      {tight && (
        <g>
          <rect x={w*0.78} y={h*0.5} width="2" height={h*0.43} fill="oklch(0.25 0.01 40)"/>
          <circle cx={w*0.79} cy={h*0.51} r="6" fill="oklch(0.85 0.06 80)"/>
        </g>
      )}
      {/* address overlay */}
      <g>
        <rect x="8" y="8" width={Math.min(w-16, 220)} height="22" fill="oklch(0.15 0.01 40)" opacity="0.78" rx="2"/>
        <text x="14" y="23" fill="#F6F4EE" fontFamily="'IBM Plex Mono', monospace" fontSize="11">{permit.addr}, {permit.boro}</text>
      </g>
      <g>
        <rect x={w-72} y="8" width="64" height="22" fill="oklch(0.15 0.01 40)" opacity="0.78" rx="2"/>
        <text x={w-40} y="23" fill="#F6F4EE" fontFamily="'IBM Plex Mono', monospace" fontSize="10" textAnchor="middle">STREET VIEW</text>
      </g>
    </svg>
  );
}

// Mini map dot grid showing borough distribution
function BoroMap({ permits }) {
  // very abstract — manhattan/brooklyn/queens dots in rough positions
  const positions = {
    Manhattan: { x: 0.42, y: 0.5 },
    Brooklyn:  { x: 0.62, y: 0.68 },
    Queens:    { x: 0.72, y: 0.4  },
    Bronx:     { x: 0.5,  y: 0.22 },
    'Staten Island': { x: 0.2, y: 0.78 },
  };
  return (
    <div className="boro-map">
      <svg viewBox="0 0 200 140" width="100%" height="100%">
        {/* coastlines abstract */}
        <path d="M 70 30 Q 80 20 95 25 Q 110 30 100 60 Q 95 90 80 100 Q 65 110 70 130" stroke="#0F1419" strokeWidth="1" fill="none" opacity="0.3"/>
        <path d="M 130 30 Q 150 30 160 50 Q 170 70 150 95 Q 130 110 110 100" stroke="#0F1419" strokeWidth="1" fill="none" opacity="0.3"/>
        {permits.map(p => {
          const pos = positions[p.boro] || positions.Manhattan;
          const jitter = (p.id.charCodeAt(p.id.length-1) % 20) - 10;
          const jitter2 = (p.id.charCodeAt(p.id.length-2) % 20) - 10;
          return <circle key={p.id} cx={pos.x*200 + jitter} cy={pos.y*140 + jitter2} r={p.score > 80 ? 3.2 : 2.2} fill={STAGE_BY_ID[p.stage]?.color || '#999'} opacity="0.8"/>;
        })}
        <text x="86" y="55" fontSize="6" fontFamily="'IBM Plex Mono', monospace" opacity="0.5">MN</text>
        <text x="124" y="78" fontSize="6" fontFamily="'IBM Plex Mono', monospace" opacity="0.5">BK</text>
        <text x="148" y="42" fontSize="6" fontFamily="'IBM Plex Mono', monospace" opacity="0.5">QN</text>
      </svg>
    </div>
  );
}

// Keyboard shortcut hint
function Kbd({ children }) {
  return <kbd className="kbd">{children}</kbd>;
}

Object.assign(window, {
  StagePill, SlaBadge, SiteBadge, Score, JobStamp, BoroChip,
  RelationshipPill, Sparkline, StreetViewPlaceholder, BoroMap, Kbd,
  STAGE_BY_ID, ARCH_BY_ID,
});
