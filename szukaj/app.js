function norm(s){return s.toLowerCase().replace(/[łśćźżąęó]/g,c=>({ł:"l",ś:"s",ć:"c",ź:"z",ż:"z",ą:"a",ę:"e",ó:"o"}[c]));}
function findNode(node,id){if(node.id===id)return node;if(!node.children)return null;for(const c of node.children){const r=findNode(c,id);if(r)return r;}return null;}
function pathTo(node,id,acc){acc=acc.concat([node]);if(node.id===id)return acc;if(!node.children)return null;for(const c of node.children){const r=pathTo(c,id,acc);if(r)return r;}return null;}
function collectDeptIds(node){let ids=node.dept?[node.dept]:[];if(node.children)node.children.forEach(c=>{ids=ids.concat(collectDeptIds(c));});return ids;}
function deptLabel(deptId){const n=findNode(window.ORG_TREE,deptId);return n?n.label:deptId;}
function nodeMatches(node,q){if(norm(node.label).includes(q))return true;return (node.children||[]).some(c=>nodeMatches(c,q));}

function flattenVisible(tree,expandedIds){
  const nodes=[],links=[];
  const walk=(node,depth,parentId)=>{
    const hasChildren=!!(node.children&&node.children.length);
    nodes.push({id:node.id,label:node.label,depth,dept:node.dept||null,hasChildren});
    if(parentId)links.push({source:parentId,target:node.id});
    if(hasChildren&&expandedIds.has(node.id))node.children.forEach(c=>walk(c,depth+1,node.id));
  };
  (tree.children||[]).forEach(r=>walk(r,0,null));
  return {nodes,links};
}
const LEVEL_COLOR_VARS=["--bubble-level-0","--bubble-level-1","--bubble-level-2"];
const LEVEL_RADIUS=[46,30,18];
function readTokens(names){
  const cs=getComputedStyle(document.documentElement);
  const o={};
  names.forEach(n=>{o[n]=cs.getPropertyValue(n).trim()||cs.getPropertyValue("--neutral-gray-600").trim();});
  return o;
}
function fitFontSize(ctx,label,maxWidth,startSize,minSize,weight){
  let size=startSize;
  ctx.font=`${weight} ${size}px Geomanist, sans-serif`;
  while(size>minSize&&ctx.measureText(label).width>maxWidth){size-=0.5;ctx.font=`${weight} ${size}px Geomanist, sans-serif`;}
  return size;
}

const ID_PATH="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Zm4 3h.01M8 14h4";
const ROOM_PATH="M4 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M12 21h7v-9l-7-4M9 9h.01M9 13h.01";
const PHONE_PATH="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1v3.4c0 .6-.4 1-1 1C10.7 21 3 13.3 3 4.9c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.3 1.1L6.6 10.8Z";
const MAIL_PATH="M3 6h18v12H3V6Zm0 0 9 7 9-7";
const UNIT_PATH="M4 21V9l8-6 8 6v12M9 21v-6h6v6";
const SEARCH_PATH="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35";
function metaIconSvg(d){return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="${d}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
function searchIconSvg(){return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="${SEARCH_PATH}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
function avatarSvg(){return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8.5" r="3.5" stroke="currentColor" stroke-width="1.6"/><path d="M4.5 19.2c1.2-3.4 4-5.2 7.5-5.2s6.3 1.8 7.5 5.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;}

const EMPLOYMENT_FILTERS=["Nauczyciel akademicki","Pracownik administracyjny","Doktorant","Stypendysta"];

const state={
  query:"",
  deptQuery:"",
  focusId:null,
  expandedIds:new Set((window.ORG_TREE.children||[]).map(r=>r.id)),
  employmentFilter:new Set(EMPLOYMENT_FILTERS)
};

let graph=null, lastClickedId=null, panelH=230, isFullscreen=false;

function buildFolderTreeHtml(node,depth,query){
  const hasChildren=!!(node.children&&node.children.length);
  if(query && !nodeMatches(node,query))return "";
  if(!hasChildren){
    const active=state.focusId===node.id?" folder-row-active":"";
    return `<div class="folder-row folder-leaf${active}" style="padding-left:${depth*16+18}px" data-focus-id="${node.id}">${node.label}</div>`;
  }
  const forcedOpen=query&&nodeMatches(node,query);
  const isOpen=state.expandedIds.has(node.id)||forcedOpen;
  const active=state.focusId===node.id?" folder-row-active":"";
  let html=`<div class="folder-node"><div class="folder-row${active}" style="padding-left:${depth*16}px" data-toggle-id="${node.id}" data-focus-id="${node.id}"><span class="folder-chevron${isOpen?" open":""}">›</span>${node.label}</div>`;
  if(isOpen){
    html+=`<div class="folder-children">`;
    node.children.forEach(c=>{html+=buildFolderTreeHtml(c,depth+1,query);});
    html+=`</div>`;
  }
  html+=`</div>`;
  return html;
}

function renderFolderTree(){
  const q=norm(state.deptQuery.trim());
  let html="";
  (window.ORG_TREE.children||[]).forEach(r=>{html+=buildFolderTreeHtml(r,0,q);});
  $("#folderTree").html(html);
}

function renderResults(){
  const activeDeptIds = state.focusId ? new Set(collectDeptIds(findNode(window.ORG_TREE,state.focusId))) : new Set(window.DEPARTMENTS.map(d=>d.id));
  const q=norm(state.query.trim());
  const results=window.EMPLOYEES.filter(p=>{
    if(!activeDeptIds.has(p.dept))return false;
    if(q&&!norm(p.name).includes(q)&&!norm(p.role||"").includes(q))return false;
    return true;
  });
  const breadcrumbPath = state.focusId ? (pathTo(window.ORG_TREE,state.focusId,[])||[]).slice(1).map(n=>n.label).join(" / ") : "Wszystkie jednostki";
  $("#resultsCount").html(`Znaleziono ${results.length} ${results.length===1?"wynik":"wyniki"}${state.query?` dla "${state.query}"`:""} <button class="link-btn" id="clearFiltersBtn">Wyczyść filtry</button>`);
  $("#resultsScope").text("Wyniki dla: "+breadcrumbPath);
  if(results.length===0){
    $("#resultsList").html(`<div class="empty-state">Brak pracowników spełniających kryteria wyszukiwania.</div>`);
    return;
  }
  let html="";
  results.forEach(p=>{
    html+=`<div class="result-row">
      <div class="avatar avatar-lg">${avatarSvg()}</div>
      <div class="result-main">
        <div class="result-name">${p.name}</div>
        <div class="result-meta">
          <span class="meta-item">${metaIconSvg(UNIT_PATH)}${deptLabel(p.dept)}</span>
          <span class="meta-item">${metaIconSvg(ID_PATH)}${p.id}</span>
          <span class="meta-item">${metaIconSvg(ROOM_PATH)}Pokój ${p.room}</span>
          <span class="meta-item">${metaIconSvg(PHONE_PATH)}${p.phone}</span>
          <span class="meta-item">${metaIconSvg(MAIL_PATH)}<a href="mailto:${p.email}">${p.email}</a></span>
        </div>
      </div>
    </div>`;
  });
  $("#resultsList").html(html);
}

function renderAll(){
  renderFolderTree();
  renderResults();
  updateGraphData();
}

function applyView(){
  if(!graph)return;
  const nodes=graph.graphData().nodes;
  if(lastClickedId){
    const n=nodes.find(x=>x.id===lastClickedId);
    if(n&&typeof n.x==="number")graph.centerAt(n.x,n.y,0);
    return;
  }
  const roots=nodes.filter(n=>n.depth===0&&typeof n.x==="number"&&typeof n.y==="number");
  if(!roots.length)return;
  const r=LEVEL_RADIUS[0];
  const minX=Math.min(...roots.map(n=>n.x))-r, maxX=Math.max(...roots.map(n=>n.x))+r;
  const minY=Math.min(...roots.map(n=>n.y))-r, maxY=Math.max(...roots.map(n=>n.y))+r;
  const spanX=Math.max(maxX-minX,1), spanY=Math.max(maxY-minY,1);
  const cx=(minX+maxX)/2, cy=(minY+maxY)/2;
  const w=$("#bubbleWrap").width(), h=$("#bubbleWrap").height();
  const scale=Math.min(w/spanX,h/spanY)*0.82;
  graph.centerAt(cx,cy,0);
  graph.zoom(scale,0);
}
function applyViewWhenReady(attempts){
  if(!graph)return;
  const nodes=graph.graphData().nodes;
  const target=lastClickedId?nodes.find(x=>x.id===lastClickedId):nodes.find(n=>n.depth===0);
  if(target&&typeof target.x==="number"){applyView();return;}
  if(attempts>0)setTimeout(()=>applyViewWhenReady(attempts-1),80);
}

function initGraph(){
  const tokens=readTokens(["--gold-gold-500","--neutral-gray-300","--neutral-white",...LEVEL_COLOR_VARS]);
  const el=document.getElementById("bubbleWrap");
  graph=ForceGraph()(el)
    .width(el.clientWidth)
    .height(el.clientHeight)
    .nodeId("id")
    .nodeLabel("label")
    .nodeVal(n=>LEVEL_RADIUS[Math.min(n.depth,LEVEL_RADIUS.length-1)])
    .linkColor(()=>tokens["--neutral-gray-300"])
    .linkWidth(1)
    .cooldownTicks(80)
    .onEngineStop(()=>applyViewWhenReady(15))
    .onNodeClick(n=>{
      state.focusId=n.id;
      if(n.hasChildren){if(state.expandedIds.has(n.id))state.expandedIds.delete(n.id);else state.expandedIds.add(n.id);}
      lastClickedId=n.id;
      graph.centerAt(n.x,n.y,600);
      renderAll();
    })
    .nodeCanvasObject((n,ctx,globalScale)=>{
      const r=LEVEL_RADIUS[Math.min(n.depth,LEVEL_RADIUS.length-1)];
      const isFocus=n.id===state.focusId;
      ctx.beginPath();
      ctx.arc(n.x,n.y,r,0,2*Math.PI);
      ctx.fillStyle=tokens[LEVEL_COLOR_VARS[Math.min(n.depth,LEVEL_COLOR_VARS.length-1)]];
      ctx.fill();
      if(isFocus){ctx.lineWidth=3;ctx.strokeStyle=tokens["--gold-gold-500"];ctx.stroke();}
      const weight=400;
      const maxWidth=r*1.75;
      const minSize=14/globalScale;
      const startSize=Math.max(minSize,r*0.42);
      const fontSize=fitFontSize(ctx,n.label,maxWidth,startSize,minSize,weight);
      ctx.fillStyle=tokens["--neutral-white"]||"#fff";
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      let label=n.label;
      if(ctx.measureText(label).width>maxWidth){
        while(label.length>1&&ctx.measureText(label+"…").width>maxWidth)label=label.slice(0,-1);
        label=label+"…";
      }
      ctx.fillText(label,n.x,n.y);
    })
    .nodePointerAreaPaint((n,color,ctx)=>{
      const r=LEVEL_RADIUS[Math.min(n.depth,LEVEL_RADIUS.length-1)];
      ctx.fillStyle=color;
      ctx.beginPath();
      ctx.arc(n.x,n.y,r,0,2*Math.PI);
      ctx.fill();
    });
  graph.d3Force("charge").strength(-280);
  const linkForce=graph.d3Force("link");
  if(linkForce)linkForce.distance(l=>(l.source.depth===0?170:110));
  updateGraphData();
  const ro=new ResizeObserver(()=>{
    graph.width(el.clientWidth).height(el.clientHeight);
  });
  ro.observe(el);
}

function updateGraphData(){
  if(!graph)return;
  graph.graphData(flattenVisible(window.ORG_TREE,state.expandedIds));
  const linkForce=graph.d3Force("link");
  if(linkForce)linkForce.distance(l=>(l.source.depth===0?170:110));
  graph.d3ReheatSimulation();
}

$(function(){
  initGraph();
  renderAll();

  $("#searchInput").on("input",function(){state.query=$(this).val();renderResults();});
  $("#deptSearchInput").on("input",function(){state.deptQuery=$(this).val();renderFolderTree();});

  $(document).on("click","[data-toggle-id]",function(e){
    const id=$(this).data("toggle-id");
    if(state.expandedIds.has(id))state.expandedIds.delete(id);else state.expandedIds.add(id);
  });
  $(document).on("click","[data-focus-id]",function(){
    const id=$(this).data("focus-id");
    state.focusId=id;
    lastClickedId=id;
    renderAll();
    const n=graph.graphData().nodes.find(x=>x.id===id);
    if(n&&typeof n.x==="number")graph.centerAt(n.x,n.y,400);
  });

  $(".filter-check input[type=checkbox]").on("change",function(){
    const label=$(this).data("label");
    if(state.employmentFilter.has(label))state.employmentFilter.delete(label);else state.employmentFilter.add(label);
  });

  $(document).on("click","#clearFiltersBtn",function(){
    state.query="";state.focusId=null;state.expandedIds=new Set();state.employmentFilter=new Set(EMPLOYMENT_FILTERS);
    lastClickedId=null;
    $("#searchInput").val("");
    renderAll();
    applyViewWhenReady(15);
  });

  $("#resetViewBtn").on("click",function(){
    lastClickedId=null;
    state.focusId=null;state.expandedIds=new Set();
    renderAll();
    applyViewWhenReady(15);
  });

  $("#fullscreenBtn").on("click",function(){
    isFullscreen=!isFullscreen;
    $("#bubbleWrap").toggleClass("bubble-fullscreen",isFullscreen);
    $(this).text(isFullscreen?"⤢":"⛶").attr("aria-label",isFullscreen?"Zamknij pełny ekran":"Pełny ekran");
    $("#resizeHandle").toggle(!isFullscreen);
    if(!isFullscreen)$("#bubbleWrap").css("height",panelH+"px");
    setTimeout(()=>{const el=document.getElementById("bubbleWrap");graph.width(el.clientWidth).height(el.clientHeight);applyViewWhenReady(5);},50);
  });

  $(document).on("keydown",function(e){
    if(e.key==="Escape"&&isFullscreen)$("#fullscreenBtn").trigger("click");
  });

  let dragging=null;
  $("#resizeHandle").on("pointerdown",function(e){
    dragging={startY:e.clientY,startH:panelH};
    $(document).on("pointermove.resize",function(mv){
      if(!dragging)return;
      const next=Math.min(800,Math.max(150,dragging.startH+(mv.clientY-dragging.startY)));
      panelH=next;
      $("#bubbleWrap").css("height",next+"px");
      const el=document.getElementById("bubbleWrap");
      graph.width(el.clientWidth).height(el.clientHeight);
    });
    $(document).on("pointerup.resize",function(){
      dragging=null;
      $(document).off("pointermove.resize pointerup.resize");
    });
  });
});
