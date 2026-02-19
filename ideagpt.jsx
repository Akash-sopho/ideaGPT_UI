import { useState, useEffect, useRef } from "react";

// ─── Font Injection ───────────────────────────────────────────────────────────
const fl = document.createElement("link");
fl.rel = "stylesheet";
fl.href = "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap";
document.head.appendChild(fl);

// ─── CSS ──────────────────────────────────────────────────────────────────────
const s = document.createElement("style");
s.textContent = `
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .fu{animation:fadeUp 0.38s ease forwards}
  .fi{animation:fadeIn 0.3s ease forwards}
  .hov-card{transition:box-shadow 0.18s,transform 0.18s}
  .hov-card:hover{box-shadow:0 6px 24px rgba(26,39,68,0.11)!important;transform:translateY(-1px)}
  .hov-node{transition:transform 0.15s,box-shadow 0.15s}
  .hov-node:hover{transform:scale(1.05);box-shadow:0 4px 16px rgba(0,0,0,0.1)}
  ::-webkit-scrollbar{width:6px;height:6px}
  ::-webkit-scrollbar-track{background:#f7f5f0}
  ::-webkit-scrollbar-thumb{background:#d0cbc3;border-radius:3px}
`;
document.head.appendChild(s);

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  bg:"#f6f4ef", surface:"#ffffff", alt:"#f0ede7", border:"#e2dbd0",
  borderMid:"#c9c0b3", ink:"#1c1914", muted:"#6b6358", faint:"#9c9388",
  navy:"#1b2845", navyHover:"#253561",
  accent:"#d94f1e",
  blue:"#1a4fa0", blueBg:"#eef4ff", blueBorder:"#bcd2f5",
  green:"#1c7a4c", greenBg:"#eef8f2", greenBorder:"#b4dcc7",
  red:"#bb2e20", redBg:"#fdf1f0", redBorder:"#f0bfba",
  amber:"#a85c00", amberBg:"#fef8ec", amberBorder:"#f0d88a",
  purple:"#6d28d9", purpleBg:"#f5f3ff", purpleBorder:"#d0c4f8",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const FEATURES_MOCK = [
  {id:"f1",icon:"🔐",title:"User Authentication & SSO",desc:"Login, social auth, MFA and session management",on:true},
  {id:"f2",icon:"👤",title:"Customer Profile Management",desc:"Rich profiles with preferences, history and segments",on:true},
  {id:"f3",icon:"🔍",title:"Smart Product Discovery",desc:"AI search with filters, facets and NLP queries",on:true},
  {id:"f4",icon:"✨",title:"Personalised Recommendations",desc:"ML-driven product and content suggestions",on:true},
  {id:"f5",icon:"🛒",title:"Cart & Checkout",desc:"Frictionless cart with one-click checkout",on:true},
  {id:"f6",icon:"💳",title:"Payment & Fraud Prevention",desc:"Multi-method payments with real-time fraud scoring",on:true},
  {id:"f7",icon:"📦",title:"Order & Fulfilment",desc:"End-to-end order lifecycle and shipping",on:true},
  {id:"f8",icon:"⭐",title:"Loyalty & Rewards",desc:"Points accrual, tier management, redemption",on:false},
  {id:"f9",icon:"↩️",title:"Returns & Refunds",desc:"Self-serve returns with automated refund orchestration",on:false},
  {id:"f10",icon:"📊",title:"Analytics & Reporting",desc:"Real-time conversion tracking and funnel analytics",on:true},
];

const PERSONAS = [
  {
    id:"guest",label:"Guest Shopper",icon:"🧑‍💻",color:T.blue,colorBg:T.blueBg,colorBorder:T.blueBorder,
    desc:"First-time visitor browsing without an account",
    journeys:[
      {id:"gj1",title:"Browse & Discover",steps:[
        {id:"gs1",label:"Homepage",icon:"🏠",api:"analytics"},
        {id:"gs2",label:"Search",icon:"🔍",api:"search"},
        {id:"gs3",label:"Product Detail",icon:"📋",api:"product"},
        {id:"gs4",label:"Recommendations",icon:"✨",api:"recommendations"},
        {id:"gs5",label:"Wishlist",icon:"❤️",api:"wishlist"},
      ]},
      {id:"gj2",title:"Guest Checkout",steps:[
        {id:"gs6",label:"Add to Cart",icon:"🛒",api:"cart"},
        {id:"gs7",label:"Register",icon:"📝",api:"auth"},
        {id:"gs8",label:"Select Shipping",icon:"🚚",api:"shipping"},
        {id:"gs9",label:"Pay",icon:"💳",api:"payment"},
        {id:"gs10",label:"Confirmation",icon:"📨",api:"notification"},
      ]},
    ]
  },
  {
    id:"member",label:"Registered Member",icon:"🛍️",color:T.green,colorBg:T.greenBg,colorBorder:T.greenBorder,
    desc:"Logged-in user with purchase history",
    journeys:[
      {id:"mj1",title:"Personalised Shop",steps:[
        {id:"ms1",label:"Sign In",icon:"🔐",api:"auth"},
        {id:"ms2",label:"Load Profile",icon:"👤",api:"profile"},
        {id:"ms3",label:"Curated Feed",icon:"✨",api:"recommendations"},
        {id:"ms4",label:"Search",icon:"🔍",api:"search"},
        {id:"ms5",label:"1-Click Order",icon:"⚡",api:"order"},
        {id:"ms6",label:"Earn Points",icon:"⭐",api:"loyalty"},
      ]},
      {id:"mj2",title:"Post-Purchase",steps:[
        {id:"ms7",label:"Track Order",icon:"📍",api:"logistics"},
        {id:"ms8",label:"Write Review",icon:"✍️",api:"reviews"},
        {id:"ms9",label:"Return",icon:"↩️",api:"returns"},
        {id:"ms10",label:"Refund",icon:"💰",api:"payment"},
      ]},
    ]
  },
  {
    id:"admin",label:"Store Manager",icon:"🏢",color:T.purple,colorBg:T.purpleBg,colorBorder:T.purpleBorder,
    desc:"Internal user managing catalogue and orders",
    journeys:[
      {id:"aj1",title:"Inventory Ops",steps:[
        {id:"as1",label:"Dashboard Login",icon:"🔐",api:"auth"},
        {id:"as2",label:"Stock Levels",icon:"📦",api:"inventory"},
        {id:"as3",label:"Warehouse Sync",icon:"🔄",api:"sync"},
        {id:"as4",label:"Reorder",icon:"🛒",api:"procurement"},
        {id:"as5",label:"Update Catalogue",icon:"📝",api:"product"},
      ]},
      {id:"aj2",title:"Order Operations",steps:[
        {id:"as6",label:"Order Queue",icon:"📋",api:"order"},
        {id:"as7",label:"Assign Carrier",icon:"🚚",api:"logistics"},
        {id:"as8",label:"Handle Returns",icon:"⚠️",api:"returns"},
        {id:"as9",label:"Analytics",icon:"📊",api:"analytics"},
      ]},
    ]
  },
];

const APIS = {
  auth:{name:"Auth Service",endpoint:"/auth/v2/token",method:"POST",team:"Platform Security",author:"Priya Sharma",status:"live",sla:"99.99%",latency:"45ms",version:"2.3.1",contract:"OpenAPI 3.0",desc:"OAuth2/JWT with MFA support",calls:"2.4M/day"},
  profile:{name:"Customer Profile API",endpoint:"/customers/v3/{id}",method:"GET",team:"CRM Core",author:"Arjun Mehta",status:"live",sla:"99.95%",latency:"62ms",version:"3.1.0",contract:"OpenAPI 3.0",desc:"Full customer profile with history",calls:"1.8M/day"},
  search:{name:"Search & Discovery",endpoint:"/search/v3/query",method:"POST",team:"Discovery Platform",author:"Rahul Khanna",status:"live",sla:"99.95%",latency:"40ms",version:"3.0.0",contract:"OpenAPI 3.0",desc:"NLP-powered unified search",calls:"6.8M/day"},
  product:{name:"Product Catalog API",endpoint:"/products/v2/search",method:"GET",team:"Commerce",author:"Neha Gupta",status:"live",sla:"99.9%",latency:"88ms",version:"2.0.4",contract:"GraphQL",desc:"Product search with inventory",calls:"3.1M/day"},
  recommendations:{name:"Recommendation Engine",endpoint:"/recs/v2/{userId}",method:"GET",team:"ML Platform",author:"Ananya Roy",status:"live",sla:"99.5%",latency:"180ms",version:"2.3.0",contract:"OpenAPI 3.0",desc:"Collaborative filtering recs",calls:"4.7M/day"},
  order:{name:"Order Management",endpoint:"/orders/v4/create",method:"POST",team:"Commerce",author:"Rohan Das",status:"live",sla:"99.98%",latency:"120ms",version:"4.2.0",contract:"OpenAPI 3.0",desc:"End-to-end order lifecycle",calls:"890K/day"},
  payment:{name:"Payment Gateway",endpoint:"/payments/v3/charge",method:"POST",team:"FinTech Core",author:"Kavya Reddy",status:"live",sla:"99.999%",latency:"210ms",version:"3.0.2",contract:"OpenAPI 3.0",desc:"Unified payment adapter",calls:"780K/day"},
  notification:{name:"Notification Dispatcher",endpoint:"/notify/v2/send",method:"POST",team:"Engagement",author:"Vikram Nair",status:"live",sla:"99.9%",latency:"55ms",version:"2.1.3",contract:"AsyncAPI 2.0",desc:"Email/SMS/Push multi-channel",calls:"5.2M/day"},
  inventory:{name:"Inventory Sync",endpoint:"/inventory/v2/sync",method:"PUT",team:"Supply Chain",author:"Deepa K",status:"live",sla:"99.8%",latency:"145ms",version:"2.0.1",contract:"OpenAPI 3.0",desc:"Real-time inventory sync",calls:"340K/day"},
  analytics:{name:"Analytics Event Bus",endpoint:"/analytics/v1/events",method:"POST",team:"Data Platform",author:"Sanjay Patel",status:"live",sla:"99.7%",latency:"30ms",version:"1.4.2",contract:"AsyncAPI 2.0",desc:"High-throughput event stream",calls:"12M/day"},
  shipping:{name:"Shipping Rate API",endpoint:"/logistics/v2/rates",method:"POST",team:"Logistics",author:"Manish Joshi",status:"live",sla:"99.8%",latency:"95ms",version:"2.1.0",contract:"OpenAPI 3.0",desc:"Real-time carrier rates",calls:"620K/day"},
  returns:{name:"Returns & Refunds",endpoint:"/returns/v1/initiate",method:"POST",team:"Commerce",author:"Swati Verma",status:"beta",sla:"99.5%",latency:"130ms",version:"1.2.0",contract:"OpenAPI 3.0",desc:"Automated returns processing",calls:"85K/day"},
  loyalty:{name:"Loyalty Points Engine",endpoint:"/loyalty/v2/accrue",method:"POST",team:"CRM Core",author:"Arjun Mehta",status:"live",sla:"99.9%",latency:"75ms",version:"2.0.3",contract:"OpenAPI 3.0",desc:"Points accrual & redemption",calls:"1.1M/day"},
  reviews:{name:"Review & Rating Service",endpoint:"/reviews/v2/{id}",method:"GET",team:"Content",author:"Pooja Agarwal",status:"live",sla:"99.7%",latency:"68ms",version:"2.1.4",contract:"OpenAPI 3.0",desc:"UGC with sentiment analysis",calls:"2.9M/day"},
  logistics:{name:"Order Tracking API",endpoint:"/logistics/v3/track",method:"GET",team:"Logistics",author:"Manish Joshi",status:"live",sla:"99.7%",latency:"110ms",version:"3.0.0",contract:"OpenAPI 3.0",desc:"Real-time shipment tracking",calls:"900K/day"},
  // null = missing
  cart:null, wishlist:null, sync:null, procurement:null,
};

const JIRA = {
  cart:{title:"Cart Management API",epic:"Commerce Platform",priority:"P0",story:"As a shopper, I want to add items to a persistent cart that syncs across devices.",acceptance:["Add/remove items","Quantity management","Price recalculation","Guest cart merge on login"],sp:13,days:10,sprint:"Sprint 1",squad:"Commerce Team",deps:["Order Management API","Product Catalog API"]},
  wishlist:{title:"Wishlist / Save-for-later API",epic:"Engagement Platform",priority:"P1",story:"As a shopper, I want to save products to a wishlist and receive restock alerts.",acceptance:["Add/remove items","Share wishlist","Restock notification trigger","Convert to cart"],sp:8,days:6,sprint:"Sprint 2",squad:"CRM Core",deps:["Notification Dispatcher","Customer Profile API"]},
  sync:{title:"Warehouse Sync Orchestrator",epic:"Supply Chain",priority:"P1",story:"As a store manager, I want inventory changes to sync across all warehouses in real-time.",acceptance:["Bi-directional sync","Conflict resolution","Audit log","Retry on failure"],sp:21,days:15,sprint:"Sprint 2",squad:"Supply Chain",deps:["Inventory Sync API"]},
  procurement:{title:"Procurement & Reorder API",epic:"Supply Chain",priority:"P2",story:"As a store manager, I want to trigger automatic reorders when stock hits a threshold.",acceptance:["Threshold configuration","Supplier integration","PO generation","Approval workflow"],sp:13,days:10,sprint:"Sprint 3",squad:"Supply Chain",deps:["Inventory Sync API","Warehouse Sync"]},
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Chip({color=T.navy,bg=T.blueBg,border,children}){
  return <span style={{background:bg,color,border:`1px solid ${border||color+"22"}`,borderRadius:4,padding:"2px 8px",fontSize:11,fontFamily:"'DM Mono',monospace",fontWeight:500,display:"inline-block"}}>{children}</span>;
}
function Dot({status}){
  const c={live:{col:T.green,lbl:"LIVE"},beta:{col:T.amber,lbl:"BETA"}}[status]||{col:T.muted,lbl:status?.toUpperCase()};
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,color:c.col,fontFamily:"'DM Mono',monospace",fontWeight:600}}><span style={{width:7,height:7,borderRadius:"50%",background:c.col,display:"inline-block",boxShadow:`0 0 5px ${c.col}88`}}/>{c.lbl}</span>;
}

// ─── Progress Steps ───────────────────────────────────────────────────────────
function Steps({phase}){
  const list=["Idea","Features","Journeys","Review","API Map","Jira Plan"];
  const idx=["idea","features","personas","review","diagram","jira"].indexOf(phase);
  return(
    <div style={{display:"flex",alignItems:"center",marginBottom:40}}>
      {list.map((l,i)=>(
        <div key={l} style={{display:"flex",alignItems:"center",flex:i<list.length-1?1:"none"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:i<idx?T.navy:i===idx?T.navy:T.border,color:i<=idx?"#fff":T.faint,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,fontFamily:"'DM Mono',monospace",transition:"all 0.3s",outline:i===idx?`3px solid ${T.blueBg}`:"none",outlineOffset:2}}>
              {i<idx?"✓":i+1}
            </div>
            <div style={{fontSize:11,color:i<=idx?T.navy:T.faint,fontWeight:i===idx?600:400,whiteSpace:"nowrap",fontFamily:"'DM Sans',sans-serif"}}>{l}</div>
          </div>
          {i<list.length-1&&<div style={{flex:1,height:2,background:i<idx?T.navy:T.border,margin:"0 4px",marginBottom:18,transition:"background 0.3s"}}/>}
        </div>
      ))}
    </div>
  );
}

// ─── API Drawer ───────────────────────────────────────────────────────────────
function Drawer({api,onClose}){
  if(!api)return null;
  const methodColor={GET:{bg:T.greenBg,col:T.green,border:T.greenBorder},POST:{bg:T.amberBg,col:T.amber,border:T.amberBorder},PUT:{bg:T.blueBg,col:T.blue,border:T.blueBorder}}[api.method]||{bg:T.alt,col:T.muted,border:T.border};
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(28,25,20,0.38)",backdropFilter:"blur(3px)",zIndex:1000,display:"flex",justifyContent:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} className="fi" style={{width:440,height:"100%",background:T.surface,borderLeft:`1px solid ${T.border}`,overflowY:"auto",boxShadow:"-16px 0 50px rgba(0,0,0,0.09)"}}>
        <div style={{padding:"28px 30px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{color:T.faint,fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:2,marginBottom:8}}>API CONTRACT</div>
              <div style={{color:T.ink,fontSize:19,fontWeight:700,fontFamily:"'Lora',serif",lineHeight:1.3,marginBottom:10}}>{api.name}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}><Dot status={api.status}/><Chip color={T.muted} bg={T.alt}>v{api.version}</Chip><Chip color={T.blue} bg={T.blueBg} border={T.blueBorder}>{api.contract}</Chip></div>
            </div>
            <button onClick={onClose} style={{background:T.alt,border:`1px solid ${T.border}`,color:T.muted,width:32,height:32,borderRadius:8,cursor:"pointer",fontSize:17,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        </div>
        <div style={{margin:"20px 30px",background:T.alt,border:`1px solid ${T.border}`,borderRadius:10,padding:"13px 15px",display:"flex",gap:10,alignItems:"center"}}>
          <span style={{background:methodColor.bg,color:methodColor.col,border:`1px solid ${methodColor.border}`,borderRadius:4,padding:"3px 8px",fontSize:11,fontWeight:700,fontFamily:"'DM Mono',monospace",flexShrink:0}}>{api.method}</span>
          <span style={{color:T.navy,fontFamily:"'DM Mono',monospace",fontSize:12,wordBreak:"break-all"}}>{api.endpoint}</span>
        </div>
        <div style={{padding:"0 30px 18px"}}><p style={{color:T.muted,fontSize:14,lineHeight:1.7,margin:0}}>{api.desc}</p></div>
        <div style={{margin:"0 30px 18px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {[["SLA",api.sla,"⬆"],["Latency",api.latency,"⚡"],["Volume",api.calls,"📈"]].map(([l,v,ic])=>(
            <div key={l} style={{background:T.alt,border:`1px solid ${T.border}`,borderRadius:10,padding:"13px",textAlign:"center"}}>
              <div style={{fontSize:18,marginBottom:5}}>{ic}</div>
              <div style={{color:T.ink,fontSize:14,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{v}</div>
              <div style={{color:T.faint,fontSize:11,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{margin:"0 30px 24px",background:T.alt,border:`1px solid ${T.border}`,borderRadius:10,padding:"15px"}}>
          <div style={{color:T.faint,fontSize:11,letterSpacing:2,fontFamily:"'DM Mono',monospace",marginBottom:12}}>OWNERSHIP</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[["Owner",`👤 ${api.author}`],["Team",`🏢 ${api.team}`]].map(([l,v])=>(
              <div key={l}><div style={{color:T.faint,fontSize:11,marginBottom:3}}>{l}</div><div style={{color:T.ink,fontSize:13,fontWeight:600}}>{v}</div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sequence Flow Diagram ────────────────────────────────────────────────────
function FlowDiagram({journey,persona,onAPIClick}){
  const steps=journey.steps;
  const NW=128, NH=72, GAP=52;
  const totalW=steps.length*(NW+GAP)-GAP;
  const SVG_H=30;

  return(
    <div style={{overflowX:"auto",paddingBottom:4}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:0,minWidth:totalW,position:"relative"}}>
        {steps.map((step,i)=>{
          const api=APIS[step.api];
          const found=api!==null&&api!==undefined;
          return(
            <div key={step.id} style={{display:"flex",alignItems:"center",flex:"none"}}>
              {/* Node */}
              <div style={{width:NW,display:"flex",flexDirection:"column",alignItems:"center",gap:0}}>
                {/* Step label pill */}
                <div style={{display:"inline-flex",alignItems:"center",gap:5,background:T.alt,border:`1px solid ${T.border}`,borderRadius:20,padding:"4px 10px",marginBottom:8,maxWidth:NW}}>
                  <span style={{fontSize:13}}>{step.icon}</span>
                  <span style={{fontSize:10,color:T.muted,fontFamily:"'DM Sans',sans-serif",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{step.label}</span>
                </div>
                {/* Vertical connector */}
                <div style={{width:2,height:20,background:found?persona.color:T.redBorder}}/>
                {/* API Box */}
                <div
                  className="hov-node"
                  onClick={()=>found&&onAPIClick(api)}
                  style={{
                    cursor:found?"pointer":"default",
                    width:NW,boxSizing:"border-box",
                    border:`1.5px ${found?"solid":"dashed"} ${found?persona.color:T.redBorder}`,
                    borderRadius:10,padding:"10px 8px",textAlign:"center",
                    background:found?persona.colorBg:T.redBg,
                    boxShadow:found?`0 2px 10px ${persona.color}18`:`0 2px 10px ${T.red}10`,
                  }}
                >
                  {found?(
                    <>
                      <div style={{fontSize:11,fontWeight:600,color:persona.color,fontFamily:"'DM Sans',sans-serif",lineHeight:1.3,marginBottom:3}}>{api.name}</div>
                      <div style={{fontSize:10,color:persona.color+"99",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{api.latency}</div>
                      <Dot status={api.status}/>
                    </>
                  ):(
                    <>
                      <div style={{fontSize:11,fontWeight:600,color:T.red,fontFamily:"'DM Sans',sans-serif",marginBottom:2}}>Not Found</div>
                      <div style={{fontSize:10,color:T.red+"88",fontFamily:"'DM Mono',monospace"}}>Needs build</div>
                    </>
                  )}
                </div>
                {found&&<div style={{fontSize:9,color:T.faint,marginTop:5,fontFamily:"'DM Sans',sans-serif"}}>click for contract</div>}
              </div>

              {/* Arrow between nodes */}
              {i<steps.length-1&&(
                <div style={{display:"flex",alignItems:"center",paddingTop:30,flexShrink:0}}>
                  <div style={{width:GAP-10,height:2,background:T.border,position:"relative"}}>
                    <div style={{position:"absolute",right:-1,top:-4,width:0,height:0,borderTop:"5px solid transparent",borderBottom:"5px solid transparent",borderLeft:`7px solid ${T.borderMid}`}}/>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function IdeaGPT(){
  const [phase,setPhase]=useState("idea");
  const [idea,setIdea]=useState("");
  const [features,setFeatures]=useState(FEATURES_MOCK.map(f=>({...f})));
  const [selPersonas,setSelPersonas]=useState(["guest","member","admin"]);
  const [loadMsg,setLoadMsg]=useState(0);
  const [activeTab,setActiveTab]=useState("guest");
  const [activeJourney,setActiveJourney]=useState({"guest":"gj1","member":"mj1","admin":"aj1"});
  const [drawerAPI,setDrawerAPI]=useState(null);
  const [openJira,setOpenJira]=useState(null);

  const LOAD_MSGS=["Connecting to API registry…","Scanning 150+ enterprise endpoints…","Matching workflow steps…","Resolving contract versions…","Computing coverage…","Building sequence map…"];

  function doScan(){
    setPhase("scanning");
    let i=0;
    const iv=setInterval(()=>{
      i++;setLoadMsg(i);
      if(i>=LOAD_MSGS.length-1){clearInterval(iv);setTimeout(()=>setPhase("diagram"),600);}
    },650);
  }

  // Derived metrics
  const activePersonas=PERSONAS.filter(p=>selPersonas.includes(p.id));
  const allSteps=activePersonas.flatMap(p=>p.journeys.flatMap(j=>j.steps));
  const covered=allSteps.filter(s=>APIS[s.api]!==null&&APIS[s.api]!==undefined);
  const pct=allSteps.length?Math.round(covered.length/allSteps.length*100):0;
  const missingTags=[...new Set(allSteps.filter(s=>APIS[s.api]===null).map(s=>s.api))];
  const missingJira=missingTags.filter(t=>JIRA[t]);
  const totalDays=missingJira.reduce((a,t)=>a+(JIRA[t]?.days||0),0);
  const totalSP=missingJira.reduce((a,t)=>a+(JIRA[t]?.sp||0),0);

  // ── Shared header ──────────────────────────────────────────────────────────
  const Header=()=>(
    <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:100}}>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:T.navy,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>💡</div>
          <span style={{fontSize:18,fontWeight:700,fontFamily:"'Lora',serif",color:T.ink,letterSpacing:-0.3}}>IdeaGPT</span>
          <span style={{background:T.alt,color:T.muted,border:`1px solid ${T.border}`,borderRadius:100,padding:"2px 9px",fontSize:11,fontFamily:"'DM Mono',monospace"}}>ENTERPRISE</span>
        </div>
        {phase!=="idea"&&(
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {phase==="diagram"&&<div style={{background:T.greenBg,border:`1px solid ${T.greenBorder}`,borderRadius:8,padding:"6px 14px",display:"flex",gap:7,alignItems:"center"}}><span style={{width:8,height:8,borderRadius:"50%",background:T.green,display:"inline-block"}}/><span style={{color:T.green,fontSize:13,fontWeight:600}}>{pct}% API Coverage</span></div>}
            <button onClick={()=>setPhase("idea")} style={{background:T.surface,border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>← Start Over</button>
          </div>
        )}
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'DM Sans',sans-serif"}}>
      <Header/>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"40px 24px 80px"}}>
        {phase!=="idea"&&phase!=="scanning"&&<Steps phase={phase}/>}

        {/* ════ IDEA ════════════════════════════════════════════════════════ */}
        {phase==="idea"&&(
          <div className="fu" style={{maxWidth:620,margin:"72px auto 0"}}>
            <div style={{textAlign:"center",marginBottom:44}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:8,background:T.blueBg,border:`1px solid ${T.blueBorder}`,borderRadius:100,padding:"6px 16px",fontSize:12,color:T.blue,fontFamily:"'DM Mono',monospace",marginBottom:20}}>⚡ Powered by your enterprise API catalog</div>
              <h1 style={{fontSize:44,fontWeight:700,fontFamily:"'Lora',serif",color:T.ink,lineHeight:1.18,margin:"0 0 14px",letterSpacing:-1}}>
                What are you<br/><em style={{color:T.accent}}>building today?</em>
              </h1>
              <p style={{color:T.muted,fontSize:15,lineHeight:1.7,margin:0}}>Describe your product idea. We'll scope features, map user journeys by persona, then scan your API catalog — only when you're ready.</p>
            </div>
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,overflow:"hidden",boxShadow:"0 8px 40px rgba(26,39,68,0.07)"}}>
              <textarea value={idea} onChange={e=>setIdea(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey&&idea.trim()){setFeatures(FEATURES_MOCK.map(f=>({...f})));setPhase("features");}}}
                placeholder={"e.g. A mobile-first e-commerce app with personalised shopping, one-click checkout and a loyalty rewards programme…"}
                rows={5} style={{width:"100%",padding:"22px 24px",background:"transparent",border:"none",outline:"none",color:T.ink,fontSize:15,lineHeight:1.7,resize:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box"}}/>
              <div style={{padding:"13px 20px",borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.alt}}>
                <span style={{color:T.faint,fontSize:12,fontFamily:"'DM Mono',monospace"}}>⌘ + Enter</span>
                <button onClick={()=>{if(!idea.trim())return;setFeatures(FEATURES_MOCK.map(f=>({...f})));setPhase("features");}} disabled={!idea.trim()} style={{background:idea.trim()?T.navy:T.border,color:idea.trim()?"#fff":T.muted,border:"none",borderRadius:9,padding:"11px 26px",fontSize:14,fontWeight:600,cursor:idea.trim()?"pointer":"not-allowed",transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"}}>Analyse Idea →</button>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:16,flexWrap:"wrap",justifyContent:"center"}}>
              {["Mobile checkout experience","B2B procurement portal","Subscription box platform","Healthcare patient portal"].map(ex=>(
                <button key={ex} onClick={()=>setIdea(ex)} style={{background:T.surface,border:`1px solid ${T.border}`,color:T.muted,borderRadius:100,padding:"7px 16px",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=T.navy;e.currentTarget.style.color=T.navy;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.muted;}}>{ex}</button>
              ))}
            </div>
          </div>
        )}

        {/* ════ FEATURES ════════════════════════════════════════════════════ */}
        {phase==="features"&&(
          <div className="fu">
            <div style={{marginBottom:30}}>
              <div style={{color:T.faint,fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:2,marginBottom:8}}>STEP 1 — FEATURE SCOPING</div>
              <h2 style={{fontFamily:"'Lora',serif",color:T.ink,fontSize:27,margin:"0 0 6px",fontWeight:700}}>Confirm your product features</h2>
              <p style={{color:T.muted,fontSize:14,margin:0}}>We've inferred features from your idea. Toggle any on or off before we map user journeys — no API calls yet.</p>
            </div>
            <div style={{background:T.blueBg,border:`1px solid ${T.blueBorder}`,borderRadius:12,padding:"13px 18px",marginBottom:26,display:"flex",gap:12,alignItems:"center"}}>
              <span style={{fontSize:18}}>💡</span>
              <div style={{color:T.blue,fontSize:14,fontStyle:"italic",fontFamily:"'Lora',serif"}}>"{idea}"</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:12,marginBottom:28}}>
              {features.map((f,idx)=>(
                <div key={f.id} className="hov-card" onClick={()=>setFeatures(prev=>prev.map((x,i)=>i===idx?{...x,on:!x.on}:x))}
                  style={{background:T.surface,border:`1.5px solid ${f.on?T.navy:T.border}`,borderRadius:12,padding:"15px 17px",cursor:"pointer",transition:"all 0.2s",opacity:f.on?1:0.5,boxShadow:f.on?"0 2px 10px rgba(26,39,68,0.07)":"none"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                    <div style={{display:"flex",gap:11,alignItems:"flex-start"}}>
                      <span style={{fontSize:22,flexShrink:0}}>{f.icon}</span>
                      <div>
                        <div style={{color:T.ink,fontSize:13,fontWeight:600,marginBottom:3}}>{f.title}</div>
                        <div style={{color:T.muted,fontSize:12,lineHeight:1.5}}>{f.desc}</div>
                      </div>
                    </div>
                    <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${f.on?T.navy:T.border}`,background:f.on?T.navy:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
                      {f.on&&<span style={{color:"#fff",fontSize:12}}>✓</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{color:T.muted,fontSize:13}}><strong style={{color:T.ink}}>{features.filter(f=>f.on).length}</strong> of {features.length} features selected</div>
              <button onClick={()=>setPhase("personas")} style={{background:T.navy,color:"#fff",border:"none",borderRadius:10,padding:"12px 28px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Map User Journeys →</button>
            </div>
          </div>
        )}

        {/* ════ PERSONAS ════════════════════════════════════════════════════ */}
        {phase==="personas"&&(
          <div className="fu">
            <div style={{marginBottom:30}}>
              <div style={{color:T.faint,fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:2,marginBottom:8}}>STEP 2 — USER JOURNEY MAPPING</div>
              <h2 style={{fontFamily:"'Lora',serif",color:T.ink,fontSize:27,margin:"0 0 6px",fontWeight:700}}>User journeys by persona</h2>
              <p style={{color:T.muted,fontSize:14,margin:0}}>Deselect any persona you won't support at launch. All API matching happens only after you confirm.</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(310px,1fr))",gap:18,marginBottom:28}}>
              {PERSONAS.map(persona=>{
                const sel=selPersonas.includes(persona.id);
                return(
                  <div key={persona.id} style={{background:T.surface,border:`1.5px solid ${sel?persona.color:T.border}`,borderRadius:16,overflow:"hidden",transition:"all 0.2s",opacity:sel?1:0.52,boxShadow:sel?`0 4px 18px ${persona.color}18`:"none"}}>
                    <div style={{background:sel?persona.colorBg:T.alt,padding:"15px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.border}`}}>
                      <div style={{display:"flex",gap:11,alignItems:"center"}}>
                        <span style={{fontSize:26}}>{persona.icon}</span>
                        <div><div style={{color:T.ink,fontSize:14,fontWeight:700}}>{persona.label}</div><div style={{color:T.muted,fontSize:12}}>{persona.desc}</div></div>
                      </div>
                      <button onClick={()=>setSelPersonas(prev=>prev.includes(persona.id)?prev.filter(x=>x!==persona.id):[...prev,persona.id])}
                        style={{width:28,height:28,borderRadius:7,border:`2px solid ${sel?persona.color:T.border}`,background:sel?persona.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.2s",flexShrink:0}}>
                        {sel&&<span style={{color:"#fff",fontSize:13}}>✓</span>}
                      </button>
                    </div>
                    {persona.journeys.map(j=>(
                      <div key={j.id} style={{padding:"13px 18px",borderBottom:`1px solid ${T.border}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:9}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:sel?persona.color:T.border,flexShrink:0}}/>
                          <div style={{color:T.ink,fontSize:13,fontWeight:600}}>{j.title}</div>
                          <div style={{marginLeft:"auto",fontSize:11,color:T.faint,fontFamily:"'DM Mono',monospace"}}>{j.steps.length} steps</div>
                        </div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          {j.steps.map(step=>(
                            <div key={step.id} style={{background:T.alt,border:`1px solid ${T.border}`,borderRadius:6,padding:"3px 8px",fontSize:11,color:T.muted,display:"flex",alignItems:"center",gap:3}}>
                              <span>{step.icon}</span><span>{step.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={()=>setPhase("features")} style={{background:T.surface,border:`1px solid ${T.border}`,color:T.muted,borderRadius:10,padding:"10px 20px",fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>← Back</button>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{color:T.muted,fontSize:13}}><strong style={{color:T.ink}}>{selPersonas.length}</strong> personas · <strong style={{color:T.ink}}>{PERSONAS.filter(p=>selPersonas.includes(p.id)).reduce((a,p)=>a+p.journeys.reduce((b,j)=>b+j.steps.length,0),0)}</strong> steps</div>
                <button onClick={()=>setPhase("review")} disabled={selPersonas.length===0} style={{background:selPersonas.length>0?T.navy:T.border,color:selPersonas.length>0?"#fff":T.muted,border:"none",borderRadius:10,padding:"12px 26px",fontSize:14,fontWeight:600,cursor:selPersonas.length>0?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif"}}>Review & Confirm →</button>
              </div>
            </div>
          </div>
        )}

        {/* ════ REVIEW ══════════════════════════════════════════════════════ */}
        {phase==="review"&&(
          <div className="fu">
            <div style={{marginBottom:30}}>
              <div style={{color:T.faint,fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:2,marginBottom:8}}>STEP 3 — FINAL REVIEW</div>
              <h2 style={{fontFamily:"'Lora',serif",color:T.ink,fontSize:27,margin:"0 0 6px",fontWeight:700}}>Ready to scan your API catalog</h2>
              <p style={{color:T.muted,fontSize:14,margin:0}}>Confirm everything looks right — then we'll make the first and only call to your backend API registry.</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>
              {[[features.filter(f=>f.on).length,"Features",T.blue,T.blueBg,"⚙"],[selPersonas.length,"Personas",T.green,T.greenBg,"👥"],[PERSONAS.filter(p=>selPersonas.includes(p.id)).reduce((a,p)=>a+p.journeys.reduce((b,j)=>b+j.steps.length,0),0),"Steps to Analyse",T.purple,T.purpleBg,"🔍"]].map(([v,l,c,bg,ic])=>(
                <div key={l} style={{background:bg,border:`1px solid ${c}22`,borderRadius:14,padding:"20px",textAlign:"center"}}>
                  <div style={{fontSize:26,marginBottom:8}}>{ic}</div>
                  <div style={{fontSize:34,fontWeight:800,color:c,fontFamily:"'DM Mono',monospace",lineHeight:1}}>{v}</div>
                  <div style={{color:T.muted,fontSize:12,marginTop:5}}>{l}</div>
                </div>
              ))}
            </div>
            {PERSONAS.filter(p=>selPersonas.includes(p.id)).map(persona=>(
              <div key={persona.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 18px",marginBottom:10}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                  <span style={{fontSize:20}}>{persona.icon}</span>
                  <span style={{color:T.ink,fontSize:14,fontWeight:700}}>{persona.label}</span>
                  <span style={{marginLeft:"auto",fontSize:11,color:T.faint,fontFamily:"'DM Mono',monospace"}}>{persona.journeys.reduce((a,j)=>a+j.steps.length,0)} steps · {persona.journeys.length} journeys</span>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {persona.journeys.map(j=>(
                    <div key={j.id} style={{background:persona.colorBg,border:`1px solid ${persona.color}33`,borderRadius:7,padding:"5px 12px",fontSize:12,color:persona.color,fontWeight:500}}>{j.title} <span style={{opacity:0.65}}>({j.steps.length})</span></div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{background:T.amberBg,border:`1px solid ${T.amberBorder}`,borderRadius:12,padding:"13px 18px",marginTop:18,marginBottom:26,display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:17}}>⚠️</span>
              <div style={{color:T.amber,fontSize:13,lineHeight:1.6}}><strong>First API call to your backend.</strong> Clicking scan will query your enterprise API registry. All previous steps used zero network calls.</div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <button onClick={()=>setPhase("personas")} style={{background:T.surface,border:`1px solid ${T.border}`,color:T.muted,borderRadius:10,padding:"10px 20px",fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>← Back</button>
              <button onClick={doScan} style={{background:T.accent,color:"#fff",border:"none",borderRadius:10,padding:"13px 30px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 18px ${T.accent}44`}}>🔍 Run API Coverage Scan</button>
            </div>
          </div>
        )}

        {/* ════ SCANNING ════════════════════════════════════════════════════ */}
        {phase==="scanning"&&(
          <div className="fi" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:26}}>
            <div style={{position:"relative",width:68,height:68}}>
              <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`3px solid ${T.border}`}}/>
              <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"3px solid transparent",borderTopColor:T.navy,animation:"spin 0.9s linear infinite"}}/>
              <div style={{position:"absolute",inset:10,borderRadius:"50%",border:"3px solid transparent",borderTopColor:T.accent,animation:"spin 1.4s linear infinite reverse"}}/>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🔍</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{color:T.ink,fontSize:16,fontWeight:600,marginBottom:5,fontFamily:"'Lora',serif"}}>{LOAD_MSGS[loadMsg]}</div>
              <div style={{color:T.muted,fontSize:13,fontFamily:"'DM Mono',monospace"}}>Querying enterprise API registry…</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              {LOAD_MSGS.map((_,i)=>(
                <div key={i} style={{width:i===loadMsg?24:8,height:8,borderRadius:4,background:i<=loadMsg?T.navy:T.border,transition:"all 0.3s"}}/>
              ))}
            </div>
          </div>
        )}

        {/* ════ DIAGRAM ═════════════════════════════════════════════════════ */}
        {phase==="diagram"&&(
          <div className="fu">
            {/* Coverage banner */}
            <div style={{background:pct>=80?T.greenBg:T.amberBg,border:`1px solid ${pct>=80?T.greenBorder:T.amberBorder}`,borderRadius:14,padding:"18px 24px",marginBottom:26,display:"flex",gap:20,alignItems:"center"}}>
              <svg width={70} height={70} viewBox="0 0 70 70" style={{flexShrink:0}}>
                <circle cx={35} cy={35} r={27} fill="none" stroke={T.border} strokeWidth={7}/>
                <circle cx={35} cy={35} r={27} fill="none" stroke={pct>=80?T.green:T.amber} strokeWidth={7}
                  strokeDasharray={`${(pct/100)*2*Math.PI*27} ${2*Math.PI*27}`}
                  strokeDashoffset={2*Math.PI*27*0.25} strokeLinecap="round"
                  style={{filter:`drop-shadow(0 0 4px ${pct>=80?T.green:T.amber}88)`}}/>
                <text x={35} y={39} textAnchor="middle" fill={T.ink} fontSize={13} fontWeight={700} fontFamily="'DM Mono',monospace">{pct}%</text>
              </svg>
              <div style={{flex:1}}>
                <div style={{color:T.ink,fontSize:16,fontWeight:700,fontFamily:"'Lora',serif",marginBottom:4}}>{pct}% of your workflow is already in your API catalog</div>
                <div style={{color:T.muted,fontSize:13}}>{covered.length} of {allSteps.length} steps covered &nbsp;·&nbsp; {missingTags.length} API{missingTags.length!==1?"s":""} need to be built</div>
              </div>
              {missingJira.length>0&&<button onClick={()=>setPhase("jira")} style={{background:T.accent,color:"#fff",border:"none",borderRadius:9,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>View Jira Plan →</button>}
            </div>

            {/* Legend */}
            <div style={{display:"flex",gap:18,marginBottom:18,flexWrap:"wrap"}}>
              {[[T.green,T.greenBg,T.greenBorder,"solid","API Available"],[T.red,T.redBg,T.redBorder,"dashed","Needs Build"]].map(([c,bg,border,dash,lbl])=>(
                <div key={lbl} style={{display:"flex",gap:7,alignItems:"center",fontSize:12,color:T.muted}}>
                  <div style={{width:14,height:14,borderRadius:3,background:bg,border:`1.5px ${dash} ${border}`}}/>
                  {lbl}
                </div>
              ))}
              <div style={{marginLeft:"auto",color:T.faint,fontSize:12,fontFamily:"'DM Mono',monospace"}}>Click any node to view contract →</div>
            </div>

            {/* Persona tabs */}
            <div style={{display:"flex",gap:0,borderBottom:`1px solid ${T.border}`,marginBottom:24}}>
              {activePersonas.map(p=>(
                <button key={p.id} onClick={()=>setActiveTab(p.id)}
                  style={{padding:"10px 22px",background:"transparent",border:"none",borderBottom:activeTab===p.id?`2px solid ${T.navy}`:"2px solid transparent",color:activeTab===p.id?T.navy:T.muted,fontWeight:activeTab===p.id?600:400,fontSize:13,cursor:"pointer",transition:"all 0.2s",display:"flex",gap:7,alignItems:"center",fontFamily:"'DM Sans',sans-serif"}}>
                  <span>{p.icon}</span>{p.label}
                </button>
              ))}
            </div>

            {activePersonas.filter(p=>p.id===activeTab).map(persona=>(
              <div key={persona.id}>
                {/* Journey sub-tabs */}
                <div style={{display:"flex",gap:8,marginBottom:22}}>
                  {persona.journeys.map(j=>(
                    <button key={j.id} onClick={()=>setActiveJourney(prev=>({...prev,[persona.id]:j.id}))}
                      style={{padding:"7px 16px",background:activeJourney[persona.id]===j.id?T.navy:T.surface,color:activeJourney[persona.id]===j.id?"#fff":T.muted,border:`1px solid ${activeJourney[persona.id]===j.id?T.navy:T.border}`,borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:500,transition:"all 0.2s",fontFamily:"'DM Sans',sans-serif"}}>
                      {j.title}
                    </button>
                  ))}
                </div>
                {persona.journeys.filter(j=>j.id===activeJourney[persona.id]).map(journey=>(
                  <div key={journey.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:"26px",boxShadow:"0 2px 14px rgba(26,39,68,0.05)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
                      <div style={{width:30,height:30,borderRadius:8,background:persona.colorBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{persona.icon}</div>
                      <div><div style={{color:T.ink,fontSize:14,fontWeight:700}}>{journey.title}</div><div style={{color:T.muted,fontSize:12}}>{persona.label} · {journey.steps.length} steps</div></div>
                      <div style={{marginLeft:"auto",background:T.alt,border:`1px solid ${T.border}`,borderRadius:7,padding:"4px 12px",fontSize:12,color:T.muted,fontFamily:"'DM Mono',monospace"}}>
                        {journey.steps.filter(s=>APIS[s.api]).length}/{journey.steps.length} APIs matched
                      </div>
                    </div>
                    <FlowDiagram journey={journey} persona={persona} onAPIClick={setDrawerAPI}/>
                  </div>
                ))}
              </div>
            ))}

            {missingJira.length>0&&(
              <div style={{marginTop:24,background:T.redBg,border:`1px solid ${T.redBorder}`,borderRadius:14,padding:"18px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                <div>
                  <div style={{color:T.red,fontSize:14,fontWeight:700,marginBottom:3}}>{missingJira.length} API{missingJira.length>1?"s":""} need to be built — estimated {totalDays} man-days total</div>
                  <div style={{color:T.muted,fontSize:13}}>Auto-generated Jira stories with effort estimates are ready.</div>
                </div>
                <button onClick={()=>setPhase("jira")} style={{background:T.red,color:"#fff",border:"none",borderRadius:9,padding:"10px 22px",fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>View Jira Plan →</button>
              </div>
            )}
          </div>
        )}

        {/* ════ JIRA ════════════════════════════════════════════════════════ */}
        {phase==="jira"&&(
          <div className="fu">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{color:T.faint,fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:2,marginBottom:8}}>DEVELOPMENT PLAN</div>
                <h2 style={{fontFamily:"'Lora',serif",color:T.ink,fontSize:27,margin:"0 0 6px",fontWeight:700}}>Jira Stories for Missing APIs</h2>
                <p style={{color:T.muted,fontSize:14,margin:0}}>Auto-generated tickets with effort estimates. Push directly to your Jira project.</p>
              </div>
              <button onClick={()=>setPhase("diagram")} style={{background:T.surface,border:`1px solid ${T.border}`,color:T.muted,borderRadius:9,padding:"9px 18px",fontSize:13,cursor:"pointer",flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>← API Diagram</button>
            </div>

            {/* Sprint summary */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:26}}>
              {[[missingJira.length,"Missing APIs",T.red,T.redBg],[totalDays,"Man-Days",T.amber,T.amberBg],[totalSP,"Story Points",T.blue,T.blueBg],[Math.ceil(totalDays/10),"Sprints Est.",T.green,T.greenBg]].map(([v,l,c,bg])=>(
                <div key={l} style={{background:bg,border:`1px solid ${c}22`,borderRadius:12,padding:"18px",textAlign:"center"}}>
                  <div style={{fontSize:30,fontWeight:800,color:c,fontFamily:"'DM Mono',monospace",lineHeight:1,marginBottom:5}}>{v}</div>
                  <div style={{color:T.muted,fontSize:12}}>{l}</div>
                </div>
              ))}
            </div>

            {/* Jira cards */}
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {missingJira.map(tag=>{
                const est=JIRA[tag];if(!est)return null;
                const open=openJira===tag;
                const pColor={P0:{bg:"#fef2f2",col:T.red,bdr:T.redBorder},P1:{bg:T.amberBg,col:T.amber,bdr:T.amberBorder},P2:{bg:T.blueBg,col:T.blue,bdr:T.blueBorder}}[est.priority]||{};
                const jiraId=`COM-${Math.floor(Math.random()*900+100)}`;
                return(
                  <div key={tag} className="hov-card" style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:13,overflow:"hidden",transition:"all 0.2s",boxShadow:"0 2px 8px rgba(26,39,68,0.04)"}}>
                    <div onClick={()=>setOpenJira(open?null:tag)} style={{padding:"16px 20px",display:"flex",gap:12,alignItems:"center",cursor:"pointer"}}>
                      <div style={{background:T.alt,border:`1px solid ${T.border}`,borderRadius:6,padding:"3px 9px",fontSize:11,fontFamily:"'DM Mono',monospace",color:T.muted,flexShrink:0}}>{jiraId}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{color:T.ink,fontSize:14,fontWeight:600,marginBottom:5}}>{est.title}</div>
                        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                          <span style={{background:pColor.bg,color:pColor.col,border:`1px solid ${pColor.bdr}`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{est.priority}</span>
                          <Chip color={T.muted} bg={T.alt}>{est.epic}</Chip>
                          <Chip color={T.purple} bg={T.purpleBg} border={T.purpleBorder}>{est.sprint}</Chip>
                          <Chip color={T.navy} bg={T.blueBg} border={T.blueBorder}>{est.squad}</Chip>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:10,flexShrink:0}}>
                        <div style={{textAlign:"center"}}>
                          <div style={{background:T.amberBg,color:T.amber,border:`1px solid ${T.amberBorder}`,borderRadius:7,padding:"5px 13px",fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:15}}>{est.days}d</div>
                          <div style={{color:T.faint,fontSize:10,marginTop:2}}>man-days</div>
                        </div>
                        <div style={{textAlign:"center"}}>
                          <div style={{background:T.blueBg,color:T.blue,border:`1px solid ${T.blueBorder}`,borderRadius:7,padding:"5px 13px",fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:15}}>{est.sp}</div>
                          <div style={{color:T.faint,fontSize:10,marginTop:2}}>story pts</div>
                        </div>
                      </div>
                      <div style={{color:T.faint,fontSize:13}}>{open?"▲":"▼"}</div>
                    </div>
                    {open&&(
                      <div style={{borderTop:`1px solid ${T.border}`,padding:"18px 20px",background:T.alt}}>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:16}}>
                          <div>
                            <div style={{color:T.faint,fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:1.5,marginBottom:7}}>USER STORY</div>
                            <p style={{color:T.ink,fontSize:13,lineHeight:1.7,margin:0,fontStyle:"italic",fontFamily:"'Lora',serif"}}>{est.story}</p>
                          </div>
                          <div>
                            <div style={{color:T.faint,fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:1.5,marginBottom:7}}>ACCEPTANCE CRITERIA</div>
                            <ul style={{margin:0,padding:"0 0 0 16px",color:T.muted,fontSize:13,lineHeight:1.8}}>
                              {est.acceptance.map((a,i)=><li key={i}>{a}</li>)}
                            </ul>
                          </div>
                        </div>
                        {est.deps.length>0&&(
                          <div style={{marginBottom:14}}>
                            <div style={{color:T.faint,fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:1.5,marginBottom:7}}>DEPENDENCIES</div>
                            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                              {est.deps.map(d=>(
                                <div key={d} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 11px",fontSize:12,color:T.ink,display:"flex",gap:5,alignItems:"center"}}><span style={{color:T.amber}}>⚠</span>{d}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{display:"flex",justifyContent:"flex-end",gap:9}}>
                          <button style={{background:T.surface,border:`1px solid ${T.border}`,color:T.muted,borderRadius:7,padding:"7px 15px",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>📋 Copy Story</button>
                          <button style={{background:T.navy,color:"#fff",border:"none",borderRadius:7,padding:"7px 15px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>🎯 Create in Jira</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Export footer */}
            <div style={{marginTop:24,background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"20px 26px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{color:T.ink,fontSize:14,fontWeight:700,marginBottom:3,fontFamily:"'Lora',serif"}}>Total estimate: <span style={{color:T.accent}}>{totalDays} man-days</span> across {Math.ceil(totalDays/10)} sprints</div>
                <div style={{color:T.muted,fontSize:13}}>Assuming 2-week sprints with a squad of 3–4 engineers</div>
              </div>
              <div style={{display:"flex",gap:9}}>
                {["📊 Export CSV","📋 Copy All","🎯 Push to Jira"].map(btn=>(
                  <button key={btn} style={{background:btn.includes("Jira")?T.navy:T.surface,color:btn.includes("Jira")?"#fff":T.ink,border:`1px solid ${btn.includes("Jira")?T.navy:T.border}`,borderRadius:8,padding:"8px 15px",fontSize:12,cursor:"pointer",fontWeight:btn.includes("Jira")?600:400,fontFamily:"'DM Sans',sans-serif"}}>{btn}</button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
      <Drawer api={drawerAPI} onClose={()=>setDrawerAPI(null)}/>
    </div>
  );
}