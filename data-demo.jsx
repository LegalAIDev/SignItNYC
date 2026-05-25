// Demo data — loaded into window.DEMO_DATA only; does NOT populate VESTIBULE_DATA automatically.
// Use the "Load demo data" button in Settings to activate.
// All names/permits/LLCs are fictional but follow real NYC formatting.

(function () {
  function daysAgo(n) {
    const d = new Date('2026-05-24');
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  const ARCHITECTS = [
    { id:'a1', name:'Daniel Cho, RA', firm:'Cho Studio',           phone:'(212) 555-0142', email:'dan@chostudio.nyc',   projects:14, replied:8,  intro:'Replied 3×, referred Cafe Linda',                    relationship:'warm', notes:'Prefers SMS. Always at site Tuesdays.' },
    { id:'a2', name:'Maya Rosenfeld', firm:'Rosenfeld + Vega',     phone:'(646) 555-0118', email:'maya@rv-arch.com',    projects:9,  replied:4,  intro:'Cold email opened, no reply yet',                    relationship:'cool', notes:'Big LES bar portfolio.' },
    { id:'a3', name:'Felix Ortega',   firm:'Ortega Expediting',    phone:'(347) 555-0193', email:'felix@ortegaexp.nyc', projects:21, replied:11, intro:'Closed 2 deals via Felix',                           relationship:'hot',  notes:'Expediter, not architect. Knows everyone in BK + Manhattan south of 14th.' },
    { id:'a4', name:'Jin Park, AIA',  firm:'Park & Lee Architects',phone:'(212) 555-0177', email:'jin@parklee.co',      projects:6,  replied:1,  intro:'One reply, polite brush-off',                        relationship:'cool', notes:'High-end only. Pass unless project >$2M build.' },
    { id:'a5', name:'Lina Brennan',   firm:'Brennan Studio',       phone:'(917) 555-0166', email:'lina@brennanstudio.com', projects:11, replied:6, intro:'Met at LES Bar Owners mixer',                   relationship:'warm', notes:'Will hand off if you bring her a bottle of mezcal.' },
    { id:'a6', name:'Tomás Vidal',    firm:'Vidal Permitting',     phone:'(718) 555-0102', email:'t.vidal@vidalpermit.com', projects:18, replied:9, intro:'Cold call → 20min chat → referred Sake Bar Rin', relationship:'hot',  notes:'Expediter. Bronx + upper Manhattan.' },
    { id:'a7', name:'Priya Aggarwal', firm:'PAA Architecture',     phone:'(212) 555-0188', email:'priya@paa-arch.com',  projects:7,  replied:2,  intro:'No response to 2 emails',                           relationship:'cold', notes:'Try LinkedIn next.' },
    { id:'a8', name:'Marcus Reeves',  firm:'Reeves Design Office', phone:'(646) 555-0155', email:'marcus@reevesdo.com', projects:5,  replied:0,  intro:'New name on permits — fresh contact',                relationship:'new',  notes:'No prior touch yet.' },
    { id:'a9', name:'Sophie Chan',    firm:'Chan Lin Studio',      phone:'(212) 555-0131', email:'sophie@chanlin.studio', projects:13, replied:7, intro:'Referred The Walker',                              relationship:'warm', notes:'Specializes in adaptive reuse — many vestibule retrofits.' },
    { id:'a10',name:'Eduardo Marín',  firm:'Marín Expediting',     phone:'(347) 555-0140', email:'eduardo@marinexp.nyc', projects:16, replied:5, intro:'Met at DOB hearing waiting room',                   relationship:'warm', notes:'Bring coffee.' },
    { id:'a11',name:'Aria Bellini',   firm:'Bellini Atelier',      phone:'(917) 555-0173', email:'aria@bellini-atelier.com', projects:4, replied:1, intro:'One short email reply',                         relationship:'cool', notes:'Tribeca / SoHo restaurant focus.' },
    { id:'a12',name:'Hugo Tanaka',    firm:'Tanaka Studio',        phone:'(646) 555-0109', email:'hugo@tanakastudio.nyc', projects:8, replied:3, intro:'Replied to LinkedIn DM',                            relationship:'warm', notes:'Japanese restaurant specialist.' },
  ];

  const PERMITS = [
    {id:'B00781246',biz:'Cafe Linda',          llc:'Linda Hospitality LLC',      addr:'214 Mulberry St',    boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:3,  arch:'a1', sla:'pending',  site:'good',     score:92, stage:'qualified', est:'$8.4k',  sqft:1820 },
    {id:'B00779812',biz:'Bar Tonic',           llc:'14B Stanton LLC',            addr:'127 Stanton St',     boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:5,  arch:'a3', sla:'pending',  site:'good',     score:88, stage:'qualified', est:'$12.1k', sqft:2400 },
    {id:'B00782104',biz:'Sake Bar Rin',        llc:'Rin Operating LLC',          addr:'89 E 4th St',        boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:8,  arch:'a6', sla:'pending',  site:'good',     score:85, stage:'qualified', est:'$9.2k',  sqft:1640 },
    {id:'B00780994',biz:'Walker Wine Bar',     llc:'Walker Bev LLC',             addr:'18 N Moore St',      boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:6,  arch:'a9', sla:'pending',  site:'tight',    score:74, stage:'qualified', est:'$7.8k',  sqft:1280 },
    {id:'B00781877',biz:'Carmine Sons Pizza',  llc:'Carmine Bros Inc.',          addr:'310 Bleecker St',    boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:2,  arch:'a1', sla:'none',     site:'good',     score:71, stage:'enriched',  est:'$6.9k',  sqft:1100 },
    {id:'B00782339',biz:'Honey & Salt',        llc:'H&S Restaurants LLC',        addr:'462 Smith St',       boro:'Brooklyn',  use:'Eating & Drinking', job:'A1', filed:11, arch:'a5', sla:'pending',  site:'good',     score:90, stage:'qualified', est:'$11.4k', sqft:2200 },
    {id:'B00779441',biz:'Joya Kava',           llc:'Joya Coffee Group LLC',      addr:'88 Orchard St',      boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:14, arch:'a2', sla:'none',     site:'tight',    score:58, stage:'enriched',  est:'$5.2k',  sqft:880  },
    {id:'B00782501',biz:'Esquina Mezcal',      llc:'Esquina Group LLC',          addr:'114 Kenmare St',     boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:1,  arch:'a3', sla:'pending',  site:'good',     score:94, stage:'qualified', est:'$13.6k', sqft:2680 },
    {id:'B00780012',biz:'Beak & Bottle',       llc:'B&B Tribeca LLC',            addr:'76 Reade St',        boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:9,  arch:'a11',sla:'pending',  site:'good',     score:81, stage:'qualified', est:'$9.9k',  sqft:1750 },
    {id:'B00781055',biz:'Otto Gelato',         llc:'Otto Frozen LLC',            addr:'226 Mott St',        boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:7,  arch:'a1', sla:'none',     site:'has-vest', score:0,  stage:'dropped',   est:'—',      sqft:740  },
    {id:'B00782820',biz:'Highline Tap Room',   llc:'Highline F&B LLC',           addr:'511 W 23rd St',      boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:4,  arch:'a4', sla:'pending',  site:'good',     score:83, stage:'qualified', est:'$10.8k', sqft:2050 },
    {id:'B00779210',biz:'Borough Bagel',       llc:'Bagel King LLC',             addr:'2014 Avenue U',      boro:'Brooklyn',  use:'Eating & Drinking', job:'A2', filed:18, arch:'a8', sla:'none',     site:'tight',    score:42, stage:'enriched',  est:'$4.1k',  sqft:620  },
    {id:'B00782188',biz:'Pasture & Vine',      llc:'P&V Restaurants LLC',        addr:'29-15 23rd Ave',     boro:'Queens',    use:'Eating & Drinking', job:'A1', filed:6,  arch:'a12',sla:'pending',  site:'good',     score:87, stage:'qualified', est:'$11.2k', sqft:2310 },
    {id:'B00781633',biz:'Bodega Coffee Bar',   llc:'Astoria Coffee LLC',         addr:'31-14 36th Ave',     boro:'Queens',    use:'Eating & Drinking', job:'A2', filed:12, arch:'a8', sla:'none',     site:'good',     score:64, stage:'enriched',  est:'$5.8k',  sqft:960  },
    {id:'B00782717',biz:'Slate Bar',           llc:'Slate Hospitality LLC',      addr:'159 Ludlow St',      boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:2,  arch:'a3', sla:'pending',  site:'good',     score:91, stage:'qualified', est:'$12.4k', sqft:2480 },
    {id:'B00781400',biz:'Maison Lev',          llc:'Lev Hospitality LLC',        addr:'53 Crosby St',       boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:10, arch:'a11',sla:'pending',  site:'tight',    score:76, stage:'qualified', est:'$8.1k',  sqft:1490 },
    {id:'B00779988',biz:'Greene St. Bakery',   llc:'Greene Baking LLC',          addr:'140 Greene St',      boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:16, arch:'a9', sla:'none',     site:'good',     score:69, stage:'enriched',  est:'$7.2k',  sqft:1180 },
    {id:'B00782456',biz:'Hudson Oyster Bar',   llc:'HOB Restaurants LLC',        addr:'612 Hudson St',      boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:5,  arch:'a4', sla:'pending',  site:'good',     score:86, stage:'qualified', est:'$11.7k', sqft:2150 },
    {id:'B00781921',biz:'Three Owls Coffee',   llc:'Three Owls LLC',             addr:'1188 Bedford Ave',   boro:'Brooklyn',  use:'Eating & Drinking', job:'A2', filed:8,  arch:'a5', sla:'none',     site:'good',     score:67, stage:'enriched',  est:'$6.4k',  sqft:1020 },
    {id:'B00782604',biz:'Marigold Diner',      llc:'Marigold NYC LLC',           addr:'344 Court St',       boro:'Brooklyn',  use:'Eating & Drinking', job:'A2', filed:3,  arch:'a5', sla:'pending',  site:'good',     score:84, stage:'qualified', est:'$10.2k', sqft:1880 },
    {id:'B00780488',biz:'Verbena Wine Cellar', llc:'Verbena LLC',                addr:'77 Forsyth St',      boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:13, arch:'a2', sla:'pending',  site:'tight',    score:72, stage:'qualified', est:'$8.6k',  sqft:1560 },
    {id:'B00782902',biz:'Banh & Beyond',       llc:'B&B Vietnamese LLC',         addr:'82-14 Broadway',     boro:'Queens',    use:'Eating & Drinking', job:'A2', filed:1,  arch:'a12',sla:'pending',  site:'good',     score:89, stage:'qualified', est:'$11.8k', sqft:2210 },
    {id:'B00781766',biz:'Polaris Cocktails',   llc:'Polaris Bar LLC',            addr:'248 W 14th St',      boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:7,  arch:'a4', sla:'pending',  site:'good',     score:80, stage:'qualified', est:'$9.6k',  sqft:1700 },
    {id:'B00779655',biz:'Wren Bistro',         llc:'Wren Group LLC',             addr:'421 5th Ave',        boro:'Brooklyn',  use:'Eating & Drinking', job:'A2', filed:20, arch:'a5', sla:'none',     site:'has-vest', score:0,  stage:'dropped',   est:'—',      sqft:1340 },
    {id:'B00782255',biz:'Tinta Cocina',        llc:'Tinta NYC LLC',              addr:'67 Ave A',           boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:9,  arch:'a3', sla:'pending',  site:'good',     score:85, stage:'qualified', est:'$10.7k', sqft:1920 },
    {id:'B00782788',biz:'Goldfinch Bar',       llc:'Goldfinch Hospitality LLC',  addr:'199 Bowery',         boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:2,  arch:'a3', sla:'pending',  site:'good',     score:93, stage:'qualified', est:'$13.2k', sqft:2540 },
    {id:'B00781544',biz:'Roselle Tea Room',    llc:'Roselle Tea LLC',            addr:'62 Henry St',        boro:'Brooklyn',  use:'Eating & Drinking', job:'A2', filed:11, arch:'a8', sla:'none',     site:'tight',    score:51, stage:'enriched',  est:'$4.9k',  sqft:820  },
    {id:'B00780333',biz:'Cervo Italian',       llc:'Cervo Restaurants LLC',      addr:'88 Charles St',      boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:15, arch:'a11',sla:'pending',  site:'good',     score:78, stage:'qualified', est:'$9.0k',  sqft:1660 },
    {id:'B00782077',biz:'Junction Coffee Co.', llc:'Junction Bev LLC',           addr:'1042 Atlantic Ave',  boro:'Brooklyn',  use:'Eating & Drinking', job:'A2', filed:6,  arch:'a10',sla:'none',     site:'good',     score:66, stage:'enriched',  est:'$6.1k',  sqft:980  },
    {id:'B00782144',biz:'Aster & Oak',         llc:'Aster Hospitality LLC',      addr:'9 9th Ave',          boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:4,  arch:'a4', sla:'pending',  site:'good',     score:88, stage:'qualified', est:'$11.5k', sqft:2080 },
    {id:'B00779099',biz:'Mulberry Sound',      llc:'Mulberry Music LLC',         addr:'171 Mulberry St',    boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:22, arch:'a1', sla:'approved', site:'good',     score:79, stage:'won',       est:'$9.4k',  sqft:1730 },
    {id:'B00781299',biz:'Hadid Falafel',       llc:'Hadid Foods LLC',            addr:'301 1st Ave',        boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:13, arch:'a7', sla:'none',     site:'tight',    score:48, stage:'enriched',  est:'$4.4k',  sqft:710  },
    {id:'B00782611',biz:'Pier & Plate',        llc:'P&P Seafood LLC',            addr:'89 South St',        boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:3,  arch:'a9', sla:'pending',  site:'good',     score:82, stage:'qualified', est:'$10.1k', sqft:1810 },
    {id:'B00782899',biz:'Lark Coffee',         llc:'Lark Coffee LLC',            addr:'515 Court St',       boro:'Brooklyn',  use:'Eating & Drinking', job:'A2', filed:1,  arch:'a5', sla:'pending',  site:'good',     score:86, stage:'new',       est:'$10.5k', sqft:1990 },
    {id:'B00782940',biz:'Daughter Bar',        llc:'Daughter Hospitality LLC',   addr:'132 Elizabeth St',   boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:0,  arch:'a3', sla:'pending',  site:'good',     score:95, stage:'new',       est:'$14.1k', sqft:2730 },
    {id:'B00782955',biz:'Trellis Wine',        llc:'Trellis Bev LLC',            addr:'288 Smith St',       boro:'Brooklyn',  use:'Eating & Drinking', job:'A2', filed:0,  arch:'a5', sla:'none',     site:'good',     score:70, stage:'new',       est:'$7.4k',  sqft:1220 },
    {id:'B00782971',biz:'Sable Café',          llc:'Sable Group LLC',            addr:'46 Bond St',         boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:0,  arch:'a11',sla:'pending',  site:'tight',    score:73, stage:'new',       est:'$7.9k',  sqft:1380 },
    {id:'B00782983',biz:'Iron & Ember',        llc:'I&E Restaurants LLC',        addr:'1219 Cortelyou Rd',  boro:'Brooklyn',  use:'Eating & Drinking', job:'A1', filed:0,  arch:'a8', sla:'pending',  site:'good',     score:84, stage:'new',       est:'$10.6k', sqft:1940 },
    {id:'B00782990',biz:'Bluebell Bar',        llc:'Bluebell LLC',               addr:'77 Greenpoint Ave',  boro:'Brooklyn',  use:'Eating & Drinking', job:'A1', filed:0,  arch:'a12',sla:'pending',  site:'good',     score:88, stage:'new',       est:'$11.3k', sqft:2120 },
    {id:'B00783002',biz:'Quill & Page',        llc:'Q&P Bookstore Bar LLC',      addr:'212 Vanderbilt Ave', boro:'Brooklyn',  use:'Eating & Drinking', job:'A2', filed:0,  arch:'a8', sla:'none',     site:'good',     score:62, stage:'new',       est:'$5.9k',  sqft:910  },
    {id:'B00782612',biz:'Heron Wine',          llc:'Heron NYC LLC',              addr:'89 Rivington St',    boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:14, arch:'a2', sla:'pending',  site:'good',     score:77, stage:'contacted', est:'$8.8k',  sqft:1610, contactedDays:4  },
    {id:'B00781088',biz:'Brassica Vegan',      llc:'Brassica LLC',               addr:'401 Court St',       boro:'Brooklyn',  use:'Eating & Drinking', job:'A2', filed:17, arch:'a5', sla:'pending',  site:'good',     score:81, stage:'contacted', est:'$9.7k',  sqft:1750, contactedDays:6  },
    {id:'B00779733',biz:'Cuvee 17',            llc:'Cuvee LLC',                  addr:'17 Cleveland Pl',    boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:21, arch:'a1', sla:'pending',  site:'good',     score:83, stage:'contacted', est:'$10.3k', sqft:1860, contactedDays:9  },
    {id:'B00779555',biz:'Marrow & Bone',       llc:'M&B Restaurants LLC',        addr:'412 W 14th St',      boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:23, arch:'a4', sla:'approved', site:'good',     score:75, stage:'contacted', est:'$8.9k',  sqft:1690, contactedDays:11 },
    {id:'B00778999',biz:'Camille Patisserie',  llc:'Camille Sweets LLC',         addr:'232 W 79th St',      boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:25, arch:'a7', sla:'none',     site:'tight',    score:55, stage:'contacted', est:'$5.4k',  sqft:820,  contactedDays:14 },
    {id:'B00778812',biz:'Foundry Bar',         llc:'Foundry Hospitality LLC',    addr:'66 Greenpoint Ave',  boro:'Brooklyn',  use:'Eating & Drinking', job:'A1', filed:27, arch:'a12',sla:'approved', site:'good',     score:89, stage:'meeting',   est:'$12.2k', sqft:2290, contactedDays:18 },
    {id:'B00778622',biz:'Vela Spanish',        llc:'Vela Restaurants LLC',       addr:'112 W 13th St',      boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:29, arch:'a4', sla:'approved', site:'good',     score:91, stage:'meeting',   est:'$12.8k', sqft:2400, contactedDays:21 },
    {id:'B00778455',biz:'Tower Coffee',        llc:'Tower Bev LLC',              addr:'2233 7th Ave',       boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:30, arch:'a7', sla:'pending',  site:'good',     score:74, stage:'meeting',   est:'$7.6k',  sqft:1240, contactedDays:23 },
    {id:'B00778201',biz:'Salt Cod & Co.',      llc:'Salt Cod LLC',               addr:'381 Atlantic Ave',   boro:'Brooklyn',  use:'Eating & Drinking', job:'A2', filed:28, arch:'a5', sla:'approved', site:'good',     score:86, stage:'won',       est:'$11.4k', sqft:2080, contactedDays:20, wonDays:2 },
    {id:'B00777944',biz:'Tendril Tea',         llc:'Tendril LLC',                addr:'72 Sullivan St',     boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:29, arch:'a9', sla:'approved', site:'good',     score:79, stage:'won',       est:'$9.5k',  sqft:1720, contactedDays:22, wonDays:5 },
    {id:'B00782811',biz:'Sentinel Brewing',    llc:'Sentinel Beer Co.',          addr:'2 Roebling St',      boro:'Brooklyn',  use:'Eating & Drinking', job:'A1', filed:5,  arch:'a12',sla:'pending',  site:'good',     score:87, stage:'qualified', est:'$11.6k', sqft:2180 },
    {id:'B00782477',biz:'Pearl & Tide',        llc:'P&T Restaurants LLC',        addr:'19 Pell St',         boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:8,  arch:'a9', sla:'pending',  site:'good',     score:82, stage:'qualified', est:'$10.0k', sqft:1810 },
    {id:'B00779388',biz:'Almond Block',        llc:'Almond NYC LLC',             addr:'164 Reade St',       boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:19, arch:'a11',sla:'none',     site:'tight',    score:60, stage:'enriched',  est:'$5.6k',  sqft:940  },
    {id:'B00781999',biz:'Vine & Hearth',       llc:'V&H Hospitality LLC',        addr:'88 1st Ave',         boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:7,  arch:'a3', sla:'pending',  site:'good',     score:89, stage:'qualified', est:'$11.9k', sqft:2230 },
    {id:'B00782766',biz:'Heron & Hare',        llc:'H&H Pub LLC',                addr:'1108 Manhattan Ave', boro:'Brooklyn',  use:'Eating & Drinking', job:'A1', filed:3,  arch:'a8', sla:'pending',  site:'good',     score:85, stage:'qualified', est:'$10.9k', sqft:1980 },
    {id:'B00782233',biz:'Petite Marquise',     llc:'Marquise LLC',               addr:'19 Prince St',       boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:9,  arch:'a1', sla:'none',     site:'has-vest', score:0,  stage:'dropped',   est:'—',      sqft:680  },
    {id:'B00780777',biz:'Cathedral Coffee',    llc:'Cathedral Bev LLC',          addr:'1110 Amsterdam Ave', boro:'Manhattan', use:'Eating & Drinking', job:'A2', filed:12, arch:'a7', sla:'none',     site:'good',     score:65, stage:'enriched',  est:'$6.2k',  sqft:1050 },
    {id:'B00782321',biz:'Ember Steakhouse',    llc:'Ember Group LLC',            addr:'58 W 22nd St',       boro:'Manhattan', use:'Eating & Drinking', job:'A1', filed:5,  arch:'a4', sla:'pending',  site:'good',     score:92, stage:'qualified', est:'$13.0k', sqft:2510 },
    {id:'B00782580',biz:'Tilda & Sons',        llc:'Tilda Restaurants LLC',      addr:'237 5th Ave',        boro:'Brooklyn',  use:'Eating & Drinking', job:'A2', filed:4,  arch:'a5', sla:'pending',  site:'good',     score:83, stage:'qualified', est:'$10.4k', sqft:1900 },
  ];

  PERMITS.forEach(p => { p.filedOn = daysAgo(p.filed); });

  const ACTIVITY = [
    { id:1, when:'2h ago',  type:'permit',  text:'4 new A1/A2 permits filed today — auto-pulled from DOB',             ref:'weekly' },
    { id:2, when:'5h ago',  type:'sla',     text:'Goldfinch Bar (199 Bowery) appeared on SLA pending — promote to qualified', ref:'B00782788' },
    { id:3, when:'1d ago',  type:'reply',   text:'Felix Ortega replied — wants to intro you to Tinta Cocina',          ref:'a3' },
    { id:4, when:'1d ago',  type:'meeting', text:'Site walk scheduled — Foundry Bar (Tue 10:30am)',                    ref:'B00778812' },
    { id:5, when:'2d ago',  type:'won',     text:'Salt Cod & Co. signed PO — $11.4k',                                 ref:'B00778201' },
    { id:6, when:'3d ago',  type:'dropped', text:'Petite Marquise dropped — existing vestibule on Street View',        ref:'B00782233' },
    { id:7, when:'4d ago',  type:'send',    text:'Outreach sent — Heron Wine (89 Rivington) → Maya Rosenfeld',        ref:'B00782612' },
    { id:8, when:'5d ago',  type:'reply',   text:'Daniel Cho replied: "send a one-pager, I\'ll forward"',             ref:'a1' },
    { id:9, when:'1w ago',  type:'won',     text:'Tendril Tea signed — $9.5k',                                        ref:'B00777944' },
  ];

  const WEEKLY_METRICS = [
    { wk:'Mar 02', pulled:31, qualified:11, contacted:6,  won:1, revenue:8400  },
    { wk:'Mar 09', pulled:28, qualified:9,  contacted:5,  won:0, revenue:0     },
    { wk:'Mar 16', pulled:35, qualified:14, contacted:8,  won:1, revenue:11400 },
    { wk:'Mar 23', pulled:42, qualified:16, contacted:10, won:2, revenue:19900 },
    { wk:'Mar 30', pulled:38, qualified:13, contacted:9,  won:1, revenue:9500  },
    { wk:'Apr 06', pulled:44, qualified:18, contacted:11, won:2, revenue:21700 },
    { wk:'Apr 13', pulled:39, qualified:15, contacted:9,  won:1, revenue:10300 },
    { wk:'Apr 20', pulled:46, qualified:19, contacted:12, won:3, revenue:32900 },
    { wk:'Apr 27', pulled:41, qualified:17, contacted:10, won:2, revenue:20800 },
    { wk:'May 04', pulled:48, qualified:21, contacted:14, won:2, revenue:22600 },
    { wk:'May 11', pulled:43, qualified:18, contacted:11, won:3, revenue:33100 },
    { wk:'May 18', pulled:51, qualified:22, contacted:8,  won:1, revenue:11400 },
  ];

  window.DEMO_DATA = { ARCHITECTS, PERMITS, ACTIVITY, WEEKLY_METRICS };
})();
