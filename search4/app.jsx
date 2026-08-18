const DS = window.VeritasDesignSystem_ca019f;
const { NavBarDesktop, Icon } = DS;
const { useState, useMemo, useRef, useCallback, useLayoutEffect } = React;

function norm(s){ return s.toLowerCase().replace(/[łśćźżąęó]/g,c=>({ł:"l",ś:"s",ć:"c",ź:"z",ż:"z",ą:"a",ę:"e",ó:"o"}[c])); }

function findNode(node,id){
  if(node.id===id) return node;
  if(!node.children) return null;
  for(const c of node.children){ const r=findNode(c,id); if(r) return r; }
  return null;
}
function findParent(node,id,parent){
  if(node.id===id) return parent;
  if(!node.children) return null;
  for(const c of node.children){ const r=findParent(c,id,node); if(r!==undefined && r!==null) return r; }
  return null;
}
function pathTo(node,id,acc){
  acc = acc.concat([node]);
  if(node.id===id) return acc;
  if(!node.children) return null;
  for(const c of node.children){ const r=pathTo(c,id,acc); if(r) return r; }
  return null;
}
function collectDeptIds(node){
  let ids = node.dept ? [node.dept] : [];
  if(node.children) node.children.forEach(c=>{ ids = ids.concat(collectDeptIds(c)); });
  return ids;
}

function flattenVisible(tree,expandedIds,width){
  const nodes = [], links = [];
  const walk = (node,depth,parentId)=>{
    const hasChildren = !!(node.children&&node.children.length);
    nodes.push({id:node.id,label:node.label,depth,dept:node.dept||null,hasChildren});
    if(parentId) links.push({source:parentId,target:node.id});
    if(hasChildren && expandedIds.has(node.id)){
      node.children.forEach(c=>walk(c,depth+1,node.id));
    }
  };
  (tree.children||[]).forEach(r=>walk(r,0,null));
  return {nodes,links};
}
const LEVEL_COLOR_VARS = ["--bubble-level-0","--bubble-level-1","--bubble-level-2"];
const LEVEL_RADIUS = [46,30,18];
function readTokens(names){
  const cs = getComputedStyle(document.documentElement);
  const o = {};
  names.forEach(n=>{ o[n] = cs.getPropertyValue(n).trim() || cs.getPropertyValue("--neutral-gray-600").trim(); });
  return o;
}

function fitFontSize(ctx,label,maxWidth,startSize,minSize,weight){
  let size = startSize;
  ctx.font = `${weight} ${size}px Geomanist, sans-serif`;
  while(size > minSize && ctx.measureText(label).width > maxWidth){
    size -= 0.5;
    ctx.font = `${weight} ${size}px Geomanist, sans-serif`;
  }
  return size;
}

function BubbleMap({focusId,onFocus,expandedIds,onToggle,onReset}){
  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const [dims,setDims] = useState({w:1100,h:230});
  const [panelH,setPanelH] = useState(230);
  const lastClickRef = useRef(null);
  const dragRef = useRef(null);
  const [isFullscreen,setIsFullscreen] = useState(false);
  const preFullscreenH = useRef(230);
  const graphData = useMemo(()=>flattenVisible(window.ORG_TREE,expandedIds,dims.w),[expandedIds,dims.w]);

  useLayoutEffect(()=>{
    const el = containerRef.current;
    if(!el) return;
    const update = ()=>setDims({w:el.clientWidth,h:el.clientHeight});
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return ()=>ro.disconnect();
  },[]);

  const ForceGraph2D = window.ForceGraph2D;
  const tokens = useMemo(()=>readTokens(["--gold-gold-500","--neutral-gray-300","--neutral-white",...LEVEL_COLOR_VARS]),[]);

  useLayoutEffect(()=>{
    if(!fgRef.current) return;
    fgRef.current.d3Force("charge").strength(-280);
    const linkForce = fgRef.current.d3Force("link");
    if(linkForce) linkForce.distance(l=>(l.source.depth===0?170:110));
  },[dims.w,dims.h,graphData]);

  const applyView = ()=>{
    if(!fgRef.current) return;
    const clickedId = lastClickRef.current;
    if(clickedId){
      const n = graphData.nodes.find(x=>x.id===clickedId);
      if(n && typeof n.x==="number") fgRef.current.centerAt(n.x,n.y,0);
      return;
    }
    const roots = graphData.nodes.filter(n=>n.depth===0 && typeof n.x==="number" && typeof n.y==="number");
    if(!roots.length) return;
    const r = LEVEL_RADIUS[0];
    const minX = Math.min(...roots.map(n=>n.x))-r, maxX = Math.max(...roots.map(n=>n.x))+r;
    const minY = Math.min(...roots.map(n=>n.y))-r, maxY = Math.max(...roots.map(n=>n.y))+r;
    const spanX = Math.max(maxX-minX,1), spanY = Math.max(maxY-minY,1);
    const cx = (minX+maxX)/2, cy = (minY+maxY)/2;
    const scale = Math.min(dims.w/spanX, dims.h/spanY) * 0.82;
    fgRef.current.centerAt(cx,cy,0);
    fgRef.current.zoom(scale,0);
  };

  const applyViewWhenReady = (attempts)=>{
    if(!fgRef.current) return;
    const clickedId = lastClickRef.current;
    const target = clickedId ? graphData.nodes.find(x=>x.id===clickedId) : graphData.nodes.find(n=>n.depth===0);
    if(target && typeof target.x==="number"){ applyView(); return; }
    if(attempts>0) setTimeout(()=>applyViewWhenReady(attempts-1),80);
  };

  useLayoutEffect(()=>{
    if(!fgRef.current) return;
    lastClickRef.current = focusId;
    const n = graphData.nodes.find(x=>x.id===focusId);
    if(n) fgRef.current.centerAt(n.x,n.y,400);
  },[focusId,graphData]);

  const handleClick = n=>{
    onFocus(n.id);
    if(n.hasChildren) onToggle(n.id);
    lastClickRef.current = n.id;
    if(fgRef.current) fgRef.current.centerAt(n.x,n.y,600);
  };

  const onHandleDown = ev=>{
    dragRef.current = {startY:ev.clientY,startH:panelH};
    const onMove = mv=>{
      if(!dragRef.current) return;
      const next = Math.min(800,Math.max(150,dragRef.current.startH + (mv.clientY-dragRef.current.startY)));
      setPanelH(next);
    };
    const onUp = ()=>{ dragRef.current=null; window.removeEventListener("pointermove",onMove); window.removeEventListener("pointerup",onUp); };
    window.addEventListener("pointermove",onMove);
    window.addEventListener("pointerup",onUp);
  };

  useLayoutEffect(()=>{
    if(!isFullscreen) return;
    const onKey = ev=>{ if(ev.key==="Escape") setIsFullscreen(false); };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[isFullscreen]);

  const toggleFullscreen = ()=>{
    setIsFullscreen(f=>{
      if(!f) preFullscreenH.current = panelH;
      return !f;
    });
  };

  return (
    <div className={"bubble-wrap"+(isFullscreen?" bubble-fullscreen":"")} ref={containerRef} style={isFullscreen?undefined:{height:panelH}}>
      <div className="bubble-tools">
        <button className="icon-btn" onClick={()=>{lastClickRef.current=null;onReset();}} aria-label="Reset widoku">⟲</button>
        <button className="icon-btn" onClick={toggleFullscreen} aria-label={isFullscreen?"Zamknij pełny ekran":"Pełny ekran"}>{isFullscreen?"⤢":"⛶"}</button>
      </div>
      {ForceGraph2D && (
        <ForceGraph2D
          ref={fgRef}
          width={dims.w}
          height={dims.h}
          graphData={graphData}
          nodeId="id"
          nodeLabel="label"
          nodeVal={n=>LEVEL_RADIUS[Math.min(n.depth,LEVEL_RADIUS.length-1)]}
          linkColor={()=>tokens["--neutral-gray-300"]}
          linkWidth={1}
          cooldownTicks={80}
          onEngineStop={()=>applyViewWhenReady(15)}
          onNodeClick={handleClick}
          nodeCanvasObject={(n,ctx,globalScale)=>{
            const r = LEVEL_RADIUS[Math.min(n.depth,LEVEL_RADIUS.length-1)];
            const isFocus = n.id===focusId;
            ctx.beginPath();
            ctx.arc(n.x,n.y,r,0,2*Math.PI);
            ctx.fillStyle = tokens[LEVEL_COLOR_VARS[Math.min(n.depth,LEVEL_COLOR_VARS.length-1)]];
            ctx.fill();
            if(isFocus){ ctx.lineWidth=3; ctx.strokeStyle=tokens["--gold-gold-500"]; ctx.stroke(); }
            const weight = 400;
            const maxWidth = r*1.75;
            const minSize = 14/globalScale;
            const startSize = Math.max(minSize, r*0.42);
            const fontSize = fitFontSize(ctx,n.label,maxWidth,startSize,minSize,weight);
            ctx.fillStyle = tokens["--neutral-white"] || getComputedStyle(document.documentElement).getPropertyValue("--neutral-white").trim();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            let label = n.label;
            if(ctx.measureText(label).width > maxWidth){
              while(label.length>1 && ctx.measureText(label+"…").width > maxWidth) label = label.slice(0,-1);
              label = label+"…";
            }
            ctx.fillText(label, n.x, n.y);
          }}
          nodePointerAreaPaint={(n,color,ctx)=>{
            const r = LEVEL_RADIUS[Math.min(n.depth,LEVEL_RADIUS.length-1)];
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(n.x,n.y,r,0,2*Math.PI);
            ctx.fill();
          }}
        />
      )}
      {!isFullscreen && <div className="bubble-resize-handle" onPointerDown={onHandleDown}/>}
    </div>
  );
}

function Avatar(){
  return (
    <div className="avatar">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M4.5 19.2c1.2-3.4 4-5.2 7.5-5.2s6.3 1.8 7.5 5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

const MetaIcon = ({d}) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ID_PATH = "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Zm4 3h.01M8 14h4";
const ROOM_PATH = "M4 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M12 21h7v-9l-7-4M9 9h.01M9 13h.01";
const PHONE_PATH = "M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1v3.4c0 .6-.4 1-1 1C10.7 21 3 13.3 3 4.9c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.3 1.1L6.6 10.8Z";
const MAIL_PATH = "M3 6h18v12H3V6Zm0 0 9 7 9-7";
const UNIT_PATH = "M4 21V9l8-6 8 6v12M9 21v-6h6v6";

function deptLabel(deptId){
  const n = findNode(window.ORG_TREE,deptId);
  return n ? n.label : deptId;
}

function ResultRow({p}){
  return (
    <div className="result-row">
      <div className="avatar avatar-lg"><Avatar/></div>
      <div className="result-main">
        <div className="result-name">{p.name}</div>
        <div className="result-meta">
          <span className="meta-item"><MetaIcon d={UNIT_PATH}/>{deptLabel(p.dept)}</span>
          <span className="meta-item"><MetaIcon d={ID_PATH}/>{p.id}</span>
          <span className="meta-item"><MetaIcon d={ROOM_PATH}/>Pokój {p.room}</span>
          <span className="meta-item"><MetaIcon d={PHONE_PATH}/>{p.phone}</span>
          <span className="meta-item"><MetaIcon d={MAIL_PATH}/><a href={"mailto:"+p.email}>{p.email}</a></span>
        </div>
      </div>
    </div>
  );
}

const EMPLOYMENT_FILTERS = ["Nauczyciel akademicki","Pracownik administracyjny","Doktorant","Stypendysta"];

function nodeMatches(node,q){
  if(norm(node.label).includes(q)) return true;
  return (node.children||[]).some(c=>nodeMatches(c,q));
}

function FolderTree({node,depth,expandedIds,onToggle,onFocus,focusId,query}){
  const hasChildren = !!(node.children && node.children.length);
  const forcedOpen = query && nodeMatches(node,query);
  const isOpen = expandedIds.has(node.id) || forcedOpen;
  if(query && !nodeMatches(node,query)) return null;
  if(!hasChildren){
    return (
      <div className={"folder-row folder-leaf"+(focusId===node.id?" folder-row-active":"")} style={{paddingLeft:depth*16+18}} onClick={()=>onFocus(node.id)}>
        {node.label}
      </div>
    );
  }
  return (
    <div className="folder-node">
      <div className={"folder-row"+(focusId===node.id?" folder-row-active":"")} style={{paddingLeft:depth*16}} onClick={()=>{onFocus(node.id);onToggle(node.id);}}>
        <span className={"folder-chevron"+(isOpen?" open":"")}>›</span>
        {node.label}
      </div>
      {isOpen && (
        <div className="folder-children">
          {node.children.map(c=>(
            <FolderTree key={c.id} node={c} depth={depth+1} expandedIds={expandedIds} onToggle={onToggle} onFocus={onFocus} focusId={focusId} query={query}/>
          ))}
        </div>
      )}
    </div>
  );
}

function App(){
  const [query,setQuery] = useState("");
  const [deptQuery,setDeptQuery] = useState("");
  const [focusId,setFocusId] = useState(null);
  const [expandedIds,setExpandedIds] = useState(()=>new Set((window.ORG_TREE.children||[]).map(r=>r.id)));
  const toggleExpand = id=>setExpandedIds(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const [employmentFilter,setEmploymentFilter] = useState(new Set(EMPLOYMENT_FILTERS));

  const breadcrumbPath = useMemo(()=>{
    if(!focusId) return "Wszystkie jednostki";
    const p = pathTo(window.ORG_TREE,focusId,[]);
    return p ? p.slice(1).map(n=>n.label).join(" / ") : "";
  },[focusId]);

  const activeDeptIds = useMemo(()=>{
    if(!focusId) return new Set(window.DEPARTMENTS.map(d=>d.id));
    const focus = findNode(window.ORG_TREE,focusId);
    return new Set(collectDeptIds(focus));
  },[focusId]);

  const toggleEmployment = label => setEmploymentFilter(prev=>{ const n=new Set(prev); n.has(label)?n.delete(label):n.add(label); return n; });
  const clearFilters = ()=>{ setQuery(""); setFocusId(null); setExpandedIds(new Set()); setEmploymentFilter(new Set(EMPLOYMENT_FILTERS)); };

  const results = useMemo(()=>{
    const q = norm(query.trim());
    return window.EMPLOYEES.filter(p=>{
      if(!activeDeptIds.has(p.dept)) return false;
      if(q && !norm(p.name).includes(q) && !norm(p.role||"").includes(q)) return false;
      return true;
    });
  },[query,activeDeptIds]);

  return (
    <div className="app">
      <div className="nav-wrap"><NavBarDesktop type="log in"/></div>
      <main className="page">
        <h1 className="page-title">Szukaj pracownika</h1>
        <div className="search-bar">
          <Icon name="IconSearchLg" size={20} style={{color:"var(--icons-assistive)",flexShrink:0}}/>
          <input value={query} onChange={ev=>setQuery(ev.target.value)} placeholder="Wpisz imię, nazwisko lub stanowisko" aria-label="Szukaj pracownika"/>
          <div className="search-icons">
            <button className="ghost-icon-btn" aria-label="Wpisz na klawiaturze"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></button>
            <button className="ghost-icon-btn" aria-label="Szukaj głosowo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.6"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></button>
            <button className="ghost-icon-btn" aria-label="Szukaj po zdjęciu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 8a2 2 0 0 1 2-2h1l1-2h8l1 2h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.6"/></svg></button>
          </div>
        </div>

        <div className="filters-row">
          {EMPLOYMENT_FILTERS.map(f=>(
            <label className="filter-check" key={f}>
              <input type="checkbox" checked={employmentFilter.has(f)} onChange={()=>toggleEmployment(f)}/>
              {f}
            </label>
          ))}
        </div>

        <BubbleMap focusId={focusId} onFocus={setFocusId} expandedIds={expandedIds} onToggle={toggleExpand} onReset={()=>{setFocusId(null);setExpandedIds(new Set());}}/>

        <div className="results-header">
          <div className="results-count">
            Znaleziono {results.length} {results.length===1?"wynik":"wyniki"}{query?` dla "${query}"`:""} <button className="link-btn" onClick={clearFilters}>Wyczyść filtry</button>
          </div>
          <div className="results-scope">Wyniki dla: {breadcrumbPath}</div>
        </div>

        <div className="results-body">
          <aside className="filters-panel">
            <div className="filters-title">Jednostka</div>
            <div className="filters-search">
              <Icon name="IconSearchLg" size={16} style={{color:"var(--icons-assistive)",flexShrink:0}}/>
              <input value={deptQuery} onChange={ev=>setDeptQuery(ev.target.value)} placeholder="Szukaj jednostki" aria-label="Szukaj jednostki"/>
            </div>
            <div className="filters-group folder-tree">
              {(window.ORG_TREE.children||[]).map(r=>(
                <FolderTree key={r.id} node={r} depth={0} expandedIds={expandedIds} onToggle={toggleExpand} onFocus={setFocusId} focusId={focusId} query={norm(deptQuery.trim())}/>
              ))}
            </div>
          </aside>
          <div className="results-list">
            {results.map((p,i)=><ResultRow key={i} p={p}/>)}
            {results.length===0 && <div className="empty-state">Brak pracowników spełniających kryteria wyszukiwania.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
