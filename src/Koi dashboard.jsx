function renderKpi(title,value,unit,target,trend=0){

let display=value;

if(typeof display==="string"){
display=parseFloat(display.replace("%",""));
}

if(display===undefined || display===null){
display="--";
}

const percent = target ? (display/target)*100 : 0;

/* ---------- Figma Colors ---------- */

let barColor="#3f7df5";   // default blue

if(title.includes("CSAT")) barColor="#52c41a";
if(title.includes("QUALITY")) barColor="#3f7df5";
if(title.includes("ADHERENCE")) barColor="#fa8c16";
if(title.includes("AHT")) barColor="#ff4d4f";

/* ---------- Graph Bars ---------- */

const graphBars = Object.values(graphData || {}).slice(-5).map((d,i)=>{

let h=40;

if(title.includes("AHT")) h=d?.AHT || 40;
if(title.includes("CSAT")) h=parseFloat(d?.CSAT?.overall || 40);
if(title.includes("QUALITY")) h=d?.CallQuality || 40;
if(title.includes("ADHERENCE")) h=d?.Adherence || 40;
if(title.includes("PRODUCTION")) h=d?.ProductionHours || 40;

return Math.min(Math.max(h,20),80);

});

return(

<Col span={4} key={title}>

<Card
style={{
borderRadius:10,
boxShadow:"0 2px 10px rgba(0,0,0,0.08)"
}}
>

{/* TITLE */}

<div style={{fontSize:13,fontWeight:600,color:"#555"}}>
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

{/* TREND */}

<div style={{
fontSize:12,
color:trend>=0?"green":"red",
marginBottom:8
}}>
{trend>=0?"▲":"▼"} {Math.abs(trend)}%
</div>

{/* GRAPH */}

<div style={{
display:"flex",
gap:4,
height:40,
alignItems:"flex-end",
marginBottom:10
}}>

{graphBars.map((h,i)=>(
<div
key={i}
style={{
width:6,
height:h,
background:barColor,
borderRadius:2
}}
/>
))}

</div>

{/* TARGET BAR */}

<div style={{
height:6,
background:"#eee",
borderRadius:4,
overflow:"hidden"
}}>

<div
style={{
width:`${percent}%`,
background:barColor,
height:"100%"
}}
/>

</div>

<div style={{fontSize:12,marginTop:6}}>
Target: {target}
</div>

</Card>

</Col>

);
}
