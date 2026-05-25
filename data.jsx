// Data layer — empty until populated by pull scripts or demo mode.
// Real data: run pull_dob.py → reload page.
// Demo data: click "Load demo data" in Settings.

const STAGES = [
  { id:'new',       label:'New',       desc:'Just filed, untouched',    color:'#7A7268' },
  { id:'qualified', label:'Qualified', desc:'SLA pending — hot',         color:'#E85C2A' },
  { id:'enriched',  label:'Enriched',  desc:'Site checked, lower temp',  color:'#C49A3D' },
  { id:'contacted', label:'Contacted', desc:'Outreach sent',             color:'#3D6FB0' },
  { id:'meeting',   label:'Meeting',   desc:'Walk-through scheduled',    color:'#5A8A4C' },
  { id:'won',       label:'Won',       desc:'PO signed',                 color:'#2E6B4F' },
  { id:'dropped',   label:'Dropped',   desc:'Disqualified',              color:'#9B9088' },
];

const TEMPLATES = [
  { id:'t1', name:'Architect — first touch', subject:'Quick question on the {biz} permit on {addr}',
    body:`Hi {archFirst} —

Saw your name on the A1 filing for {biz} at {addr}. I run Vestibule — we design + install entry vestibules for restaurants, usually billed back to the build budget. Avg add: $9–12k, 2-week lead time, ADA + DOB compliant.

Two questions:
1. Are they planning a vestibule already?
2. Open to a quick intro call? Happy to come by the site Tuesday if you're there.

— [you]` },
  { id:'t2', name:'Architect — warm follow-up', subject:'Following up on {biz}',
    body:`Hi {archFirst} — circling back. Any movement on {biz} at {addr}? Took a quick look on Street View, the frontage looks like a clean install. Let me know if it's worth a 10-min call this week.` },
  { id:'t3', name:'Owner — direct', subject:'Vestibule for {biz}',
    body:`Hi — congrats on the new {biz} build. I noticed the permit was filed {filed} days ago. We build entry vestibules — heat retention, sidewalk capture, ADA — and have done {arch}'s last 3 projects in the area. Worth 10 minutes?` },
  { id:'t4', name:'Expediter — referral ask', subject:'Sending you a bottle',
    body:`Hi {archFirst} — owe you one for the last referral. Got anyone new I should know about this month? Buying the next coffee.` },
];

window.VESTIBULE_DATA = {
  ARCHITECTS:     [],
  PERMITS:        [],
  STAGES,
  TEMPLATES,
  ACTIVITY:       [],
  WEEKLY_METRICS: [],
  ACCOUNTS:       [],
  PROPERTIES:     [],
  CONTACTS:       [],
  PERMIT_LINKS:   {},
};

window.ACCOUNT_BY_ID  = {};
window.PROPERTY_BY_ID = {};
window.CONTACT_BY_ID  = {};

// Called by Settings "Load demo data" button
window.loadDemoData = () => {
  const d = window.DEMO_DATA || {};
  const e = window.DEMO_DATA_EXTENDED || {};

  window.VESTIBULE_DATA.ARCHITECTS     = JSON.parse(JSON.stringify(d.ARCHITECTS     || []));
  window.VESTIBULE_DATA.PERMITS        = JSON.parse(JSON.stringify(d.PERMITS        || []));
  window.VESTIBULE_DATA.ACTIVITY       = JSON.parse(JSON.stringify(d.ACTIVITY       || []));
  window.VESTIBULE_DATA.WEEKLY_METRICS = JSON.parse(JSON.stringify(d.WEEKLY_METRICS || []));
  window.VESTIBULE_DATA.ACCOUNTS       = JSON.parse(JSON.stringify(e.ACCOUNTS       || []));
  window.VESTIBULE_DATA.PROPERTIES     = JSON.parse(JSON.stringify(e.PROPERTIES     || []));
  window.VESTIBULE_DATA.CONTACTS       = JSON.parse(JSON.stringify(e.CONTACTS       || []));
  window.VESTIBULE_DATA.PERMIT_LINKS   = JSON.parse(JSON.stringify(e.PERMIT_LINKS   || {}));

  // Apply permit → account/property/contact links
  const links = e.PERMIT_LINKS || {};
  window.VESTIBULE_DATA.PERMITS.forEach(p => {
    const l = links[p.id] || {};
    p.accountId  = l.accountId  || null;
    p.propertyId = l.propertyId || null;
    p.contactId  = l.contactId  || null;
  });

  // Augment architects with kind/title/org shape shared with CONTACTS
  window.VESTIBULE_DATA.ARCHITECTS.forEach(a => {
    const isExp = a.firm.toLowerCase().includes('expedit') || a.firm.toLowerCase().includes('permit');
    a.kind  = isExp ? 'expediter' : 'architect';
    a.title = isExp ? 'Expediter' : (a.name.includes('RA') ? 'Architect, RA' : 'Architect');
    a.org   = a.firm;
  });

  // Rebuild lookups
  window.ACCOUNT_BY_ID  = {};
  window.PROPERTY_BY_ID = {};
  window.CONTACT_BY_ID  = {};
  window.VESTIBULE_DATA.ACCOUNTS.forEach(a   => window.ACCOUNT_BY_ID[a.id]  = a);
  window.VESTIBULE_DATA.PROPERTIES.forEach(p => window.PROPERTY_BY_ID[p.id] = p);
  window.VESTIBULE_DATA.CONTACTS.forEach(c   => window.CONTACT_BY_ID[c.id]  = c);
};

// Called by Settings "Clear data" button
window._resetData = () => {
  window.VESTIBULE_DATA.ARCHITECTS     = [];
  window.VESTIBULE_DATA.PERMITS        = [];
  window.VESTIBULE_DATA.ACTIVITY       = [];
  window.VESTIBULE_DATA.WEEKLY_METRICS = [];
  window.VESTIBULE_DATA.ACCOUNTS       = [];
  window.VESTIBULE_DATA.PROPERTIES     = [];
  window.VESTIBULE_DATA.CONTACTS       = [];
  window.VESTIBULE_DATA.PERMIT_LINKS   = {};
  window.ACCOUNT_BY_ID  = {};
  window.PROPERTY_BY_ID = {};
  window.CONTACT_BY_ID  = {};
};
