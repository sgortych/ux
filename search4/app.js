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
const EXTLINK_PATH="M7 17 17 7M10 7h7v7";
const CITY_BY_KEYWORD=[["warszaw","Warszawa"],["wrocław","Wrocław"],["katowic","Katowice"],["poznań","Poznań"],["sopoc","Sopot"],["sopot","Sopot"],["krakow","Kraków"],["kraków","Kraków"]];
function cityForDept(deptId){
  const path=pathTo(window.ORG_TREE,deptId,[])||[];
  const joined=norm(path.map(n=>n.label).join(" "));
  for(const [kw,city] of CITY_BY_KEYWORD){if(joined.includes(kw))return city;}
  return "Warszawa";
}
function avatarUrl(seed){return `https://i.pravatar.cc/150?img=${(seed%70)+1}`;}
function metaIconSvg(d){return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="${d}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
function searchIconSvg(){return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="${SEARCH_PATH}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
function avatarSvg(){return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8.5" r="3.5" stroke="currentColor" stroke-width="1.6"/><path d="M4.5 19.2c1.2-3.4 4-5.2 7.5-5.2s6.3 1.8 7.5 5.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;}

const EMPLOYMENT_FILTERS=["Nauczyciel akademicki","Pracownik administracyjny","Doktorant","Stypendysta"];

const state={
  query:"",
  deptQuery:"",
  focusId:null,
  expandedIds:new Set(),
  employmentFilter:new Set(EMPLOYMENT_FILTERS),
  funkcja:"",
  stanowisko:"",
  miasto:""
};

let lastClickedId=null, panelH=230, isFullscreen=false;
const view={scale:0.42,panX:0,panY:0};
const CHART_LINE="#3b7dde";
const HUB_COLORS=[{bg:"#efe6fb",fg:"#8b5cf6"},{bg:"#ffe9d9",fg:"#f97316"},{bg:"#e1f7ea",fg:"#22c55e"},{bg:"#dbeafe",fg:"#3b82f6"}];
const CAP_PATH="M12 3 2 8.5 12 14l10-5.5L12 3Z";
const CAP_PATH2="M4 10.5v4c0 1.66 3.58 3 8 3s8-1.34 8-3v-4";
const FOLDER_PATH="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z";
const PERSON_PATH="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c0-3.87 3.13-6 7-6s7 2.13 7 6";

function nodeIconHtml(node,depth,hubIdx,hasChildren){
  if(depth===0){
    return `<span class="rc-icon rc-icon-root"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="${CAP_PATH}" fill="currentColor"/><path d="${CAP_PATH2}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>`;
  }
  if(depth===1&&hasChildren){
    const c=HUB_COLORS[hubIdx%HUB_COLORS.length];
    return `<span class="rc-icon" style="background:${c.bg};color:${c.fg}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="${PERSON_PATH}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
  }
  if(hasChildren){
    return `<svg class="rc-folder-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="${FOLDER_PATH}" stroke="${CHART_LINE}" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
  }
  return "";
}

function renderNode(node,depth,hubCounter){
  const hasChildren=!!(node.children&&node.children.length);
  let hubIdx=0;
  if(depth===1&&hasChildren){hubIdx=hubCounter.i;hubCounter.i++;}
  const icon=nodeIconHtml(node,depth,hubIdx,hasChildren);
  const cardClass=depth===0?"rc-card rc-card-root":(depth===1?(hasChildren?"rc-card rc-card-hub":"rc-card rc-card-leaf-top"):(hasChildren?"rc-card rc-card-folder":"rc-card rc-card-leaf"));
  const active=state.focusId===node.id?" rc-card-active":"";
  const cardHtml=`<div class="${cardClass}${active}" data-node-id="${node.id}">${icon}<span class="rc-label">${node.label}</span></div>`;
  if(!hasChildren)return {cardHtml,childrenHtml:""};
  if(!state.expandedIds.has(node.id))return {cardHtml,childrenHtml:""};
  if(depth<2){
    let inner="";
    node.children.forEach(c=>{const sub=renderNode(c,depth+1,hubCounter);inner+=`<li><span class="rc-dot"></span>${sub.cardHtml}${sub.childrenHtml}</li>`;});
    return {cardHtml,childrenHtml:`<ul class="rc-row">${inner}</ul>`};
  }
  let inner="";
  node.children.forEach(c=>{const sub=renderNode(c,depth+1,hubCounter);inner+=`<li class="list-node"><span class="rc-dot"></span>${sub.cardHtml}${sub.childrenHtml}</li>`;});
  return {cardHtml,childrenHtml:`<ul class="list-tree">${inner}</ul>`};
}

function renderChartTree(){
  let html="";
  (window.ORG_TREE.children||[]).forEach(root=>{
    const hubCounter={i:0};
    const r=renderNode(root,0,hubCounter);
    html+=`<div class="rc-branch">${r.cardHtml}${r.childrenHtml}</div>`;
  });
  $("#chartCanvas").html(html);
}

function applyTransform(){
  $("#chartCanvas").css("transform",`translate(${view.panX}px,${view.panY}px) scale(${view.scale})`);
}

function localPos(el){
  let x=0,y=0,node=el;
  const canvas=document.getElementById("chartCanvas");
  while(node&&node!==canvas){x+=node.offsetLeft;y+=node.offsetTop;node=node.offsetParent;}
  return {x:x+el.offsetWidth/2,y:y+el.offsetHeight/2};
}

function centerOnNode(id,animate){
  const el=document.querySelector(`.rc-card[data-node-id="${id}"]`);
  const vp=document.getElementById("chartViewport");
  if(!el||!vp)return;
  const pos=localPos(el);
  const vpW=vp.clientWidth,vpH=vp.clientHeight;
  view.panX=vpW/2-pos.x*view.scale;
  view.panY=vpH/2-pos.y*view.scale;
  $("#chartCanvas").css("transition",animate?"transform .35s":"none");
  applyTransform();
  if(animate)setTimeout(()=>$("#chartCanvas").css("transition","none"),360);
}

function fitToRoots(){
  const roots=$(".rc-card-root").toArray();
  const vp=document.getElementById("chartViewport");
  if(!roots.length||!vp)return;
  const positions=roots.map(localPos);
  const minX=Math.min(...positions.map(p=>p.x))-100, maxX=Math.max(...positions.map(p=>p.x))+100;
  const minY=Math.min(...positions.map(p=>p.y))-60, maxY=Math.max(...positions.map(p=>p.y))+60;
  const vpW=vp.clientWidth,vpH=vp.clientHeight;
  const scale=Math.min(vpW/Math.max(maxX-minX,1),vpH/Math.max(maxY-minY,1),1.1);
  view.scale=Math.max(scale*0.9,0.2);
  view.panX=vpW/2-(minX+maxX)/2*view.scale;
  view.panY=60-minY*view.scale;
  applyTransform();
}

function initChart(){
  renderChartTree();
  requestAnimationFrame(()=>{fitToRoots();});
}
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
  const roleQ=norm(state.stanowisko.trim());
  const cityQ=norm(state.miasto.trim());
  const results=window.EMPLOYEES.filter(p=>{
    if(!activeDeptIds.has(p.dept))return false;
    if(state.funkcja && p.employmentType!==state.funkcja)return false;
    if(roleQ && !norm(p.role||"").includes(roleQ))return false;
    if(cityQ && !norm(p.city||"").includes(cityQ))return false;
    if(q && !norm(p.name).includes(q) && !norm(p.email||"").includes(q))return false;
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
  results.forEach((p,i)=>{
    const seed=parseInt(p.id,10)||i;
    const city=cityForDept(p.dept);
    html+=`<div class="result-row">
      <img class="avatar avatar-lg" src="${avatarUrl(seed)}" alt="">
      <div class="result-main">
        <div class="result-name-row"><div class="result-name">${p.name}</div><span class="ext-link">${metaIconSvg(EXTLINK_PATH)}</span></div>
        <div class="result-meta">
          <span class="meta-item meta-role"><span class="cap-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="${CAP_PATH}" fill="currentColor"/><path d="${CAP_PATH2}" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span>${p.role}</span>
        </div>
        <div class="result-meta">
          <span class="meta-item">${metaIconSvg(UNIT_PATH)}${deptLabel(p.dept)}</span>
          <span class="meta-item">${metaIconSvg(UNIT_PATH)}${city}</span>
        </div>
        <div class="result-meta">
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
  renderChartTree();
}

function collectAllIds(node,arr){
  if(node.children&&node.children.length){arr.push(node.id);node.children.forEach(c=>collectAllIds(c,arr));}
  return arr;
}

$(function(){
  initChart();
  renderAll();

  $("#searchInput").on("input",function(){state.query=$(this).val();renderResults();});
  $("#searchBtn").on("click",function(){renderResults();});
  $("#searchInput").on("keydown",function(e){if(e.key==="Enter")renderResults();});
  $("#funkcjaSelect").on("change",function(){state.funkcja=$(this).val();renderResults();});
  $("#funkcjaClear").on("click",function(){state.funkcja="";$("#funkcjaSelect").val("");renderResults();});
  $("#stanowiskoSelect").on("change",function(){state.stanowisko=$(this).val();renderResults();});
  $("#miastoInput").on("input",function(){state.miasto=$(this).val();renderResults();});
  $("#deptSearchInput").on("input",function(){state.deptQuery=$(this).val();renderFolderTree();});

  const roles=[...new Set(window.EMPLOYEES.map(p=>p.role).filter(Boolean))].sort();
  let roleHtml="";
  roles.forEach(r=>{roleHtml+=`<option value="${r}">${r}</option>`;});
  $("#stanowiskoSelect").append(roleHtml);
  let funkcjaHtml="";
  EMPLOYMENT_FILTERS.forEach(f=>{funkcjaHtml+=`<option value="${f}">${f}</option>`;});
  $("#funkcjaSelect").append(funkcjaHtml);

  $(document).on("click","[data-toggle-id]",function(e){
    const id=$(this).data("toggle-id");
    if(state.expandedIds.has(id))state.expandedIds.delete(id);else state.expandedIds.add(id);
  });
  $(document).on("click","[data-focus-id]",function(){
    const id=$(this).data("focus-id");
    state.focusId=id;
    renderAll();
    centerOnNode(id,true);
  });
  $(document).on("click",".rc-card",function(e){
    const id=$(this).data("node-id");
    state.focusId=id;
    if(state.expandedIds.has(id))state.expandedIds.delete(id);else state.expandedIds.add(id);
    renderAll();
    centerOnNode(id,true);
  });

  $(".filter-check input[type=checkbox]").on("change",function(){
    const label=$(this).data("label");
    if(state.employmentFilter.has(label))state.employmentFilter.delete(label);else state.employmentFilter.add(label);
  });

  $(document).on("click","#clearFiltersBtn",function(){
    state.query="";state.focusId=null;state.expandedIds=new Set();state.employmentFilter=new Set(EMPLOYMENT_FILTERS);state.funkcja="";state.stanowisko="";state.miasto="";
    $("#searchInput").val("");$("#funkcjaSelect").val("");$("#stanowiskoSelect").val("");$("#miastoInput").val("");
    renderAll();
    fitToRoots();
  });

  $("#resetViewBtn").on("click",function(){
    state.focusId=null;state.expandedIds=new Set();
    renderAll();
    fitToRoots();
  });

  $("#expandAllBtn").on("click",function(){
    const all=[];
    (window.ORG_TREE.children||[]).forEach(r=>collectAllIds(r,all));
    state.expandedIds=new Set(all);
    renderAll();
    setTimeout(fitToRoots,50);
  });

  $("#fullscreenBtn").on("click",function(){
    isFullscreen=!isFullscreen;
    $("#bubbleWrap").toggleClass("bubble-fullscreen",isFullscreen);
    $(this).text(isFullscreen?"⤢":"⛶").attr("aria-label",isFullscreen?"Zamknij pełny ekran":"Pełny ekran");
    $("#resizeHandle").toggle(!isFullscreen);
    if(!isFullscreen)$("#bubbleWrap").css("height",panelH+"px");
    setTimeout(fitToRoots,50);
  });

  $(document).on("keydown",function(e){
    if(e.key==="Escape"&&isFullscreen)$("#fullscreenBtn").trigger("click");
  });

  $("#zoomInBtn").on("click",function(){view.scale=Math.min(view.scale*1.25,2.5);applyTransform();});
  $("#zoomOutBtn").on("click",function(){view.scale=Math.max(view.scale*0.8,0.15);applyTransform();});

  const viewportEl=document.getElementById("chartViewport");
  viewportEl.addEventListener("wheel",function(e){
    e.preventDefault();
    const rect=viewportEl.getBoundingClientRect();
    const mouseX=e.clientX-rect.left, mouseY=e.clientY-rect.top;
    const factor=e.deltaY>0?0.9:1.1;
    const newScale=Math.min(2.5,Math.max(0.15,view.scale*factor));
    const localX=(mouseX-view.panX)/view.scale, localY=(mouseY-view.panY)/view.scale;
    view.panX=mouseX-localX*newScale;
    view.panY=mouseY-localY*newScale;
    view.scale=newScale;
    applyTransform();
  },{passive:false});

  let panDrag=null;
  viewportEl.addEventListener("pointerdown",function(e){
    if(e.target.closest(".rc-card"))return;
    panDrag={x:e.clientX,y:e.clientY,panX:view.panX,panY:view.panY};
    viewportEl.classList.add("dragging");
  });
  window.addEventListener("pointermove",function(e){
    if(!panDrag)return;
    view.panX=panDrag.panX+(e.clientX-panDrag.x);
    view.panY=panDrag.panY+(e.clientY-panDrag.y);
    applyTransform();
  });
  window.addEventListener("pointerup",function(){panDrag=null;viewportEl.classList.remove("dragging");});

  let dragging=null;
  $("#resizeHandle").on("pointerdown",function(e){
    dragging={startY:e.clientY,startH:panelH};
    $(document).on("pointermove.resize",function(mv){
      if(!dragging)return;
      const next=Math.min(800,Math.max(150,dragging.startH+(mv.clientY-dragging.startY)));
      panelH=next;
      $("#bubbleWrap").css("height",next+"px");
    });
    $(document).on("pointerup.resize",function(){
      dragging=null;
      $(document).off("pointermove.resize pointerup.resize");
      fitToRoots();
    });
  });
});
