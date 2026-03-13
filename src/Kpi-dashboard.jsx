function renderKpi(title,value,unit,target){

let display=value;

if(typeof display==="string"){
display=parseFloat(display.replace("%",""));
}

if(display===undefined || display===null){
display="--";
}

/* ---------- COLORS (same as figma) ---------- */

let color="#3f7df5";

if(title.includes("AHT")) color="#d4380d";
if(title.includes("CSAT")) color="#389e0d";
if(title.includes("QUALITY")) color="#2f54eb";
if(title.includes("ADHERENCE")) color="#fa8c16";
if(title.includes("PRODUCTION")) color="#2f54eb";

/* ---------- SERIES FROM TABLE DATA ---------- */

const series = dates.slice(-5).map(d=>{

const row=dataMap[d];
if(!row) return null;

if(title==="AHT (CS)") return row.AHT;
if(title==="CSAT (CS)") return row?.CSAT?.csat_score;
if(title==="OVERALL QUALITY") return row.CallQuality;
if(title==="ADHERENCE") return row.Adherence;
if(title==="PRODUCTION HOURS") return row.ProductionHours;

return null;

}).filter(v=>v!==null && v!==undefined);

/* if no values don't render graph */

const maxValue = Math.max(...series,0);

const scale = maxValue>0 ? maxValue : 1;

return(

<Col span={4} key={title}>

<Card
style={{
borderRadius:10,
boxShadow:"0 2px 10px rgba(0,0,0,0.08)"
}}
>

{/* TITLE */}

<div style={{fontSize:13,fontWeight:600,color:"#666"}}>
{title}
</div>

{/* VALUE */}

<div style={{
fontSize:28,
fontWeight:700,
marginTop:4
}}>
{display} {unit}
</div>

{/* TARGET BAR */}

<div style={{
height:4,
background:"#eee",
borderRadius:4,
marginTop:8,
marginBottom:10,
overflow:"hidden"
}}>
<div
style={{
width:`${target ? (display/target)*100 : 0}%`,
background:color,
height:"100%"
}}
/>
</div>

<div style={{fontSize:12,color:"#777",marginBottom:6}}>
Target: {target}
</div>

{/* GRAPH */}

{series.length>0 && (

<div style={{display:"flex",gap:6}}>

{/* Y AXIS */}

<div style={{
fontSize:10,
color:"#888",
lineHeight:"18px"
}}>
0<br/>
{Math.round(scale/2)}<br/>
{Math.round(scale)}
</div>

{/* BARS */}

<div style={{flex:1}}>

<div style={{
display:"flex",
gap:6,
alignItems:"flex-end",
height:50
}}>

{series.map((v,i)=>{

const h=(v/scale)*50;

return(

<div
key={i}
style={{
width:8,
height:h,
background:color,
borderRadius:2
}}
/>

);

})}

</div>

{/* X AXIS */}

<div style={{
display:"flex",
justifyContent:"space-between",
fontSize:10,
color:"#888",
marginTop:4
}}>

{dates.slice(-5).map(d=>(
<span key={d}>
{viewBy==="day"
? new Date(d).toLocaleDateString("en",{weekday:"short"})
: d}
</span>
))}

</div>

</div>

</div>

)}

</Card>

</Col>

);
}
