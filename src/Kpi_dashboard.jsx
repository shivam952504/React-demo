function renderKpi(title,value,unit,target,trend=0){

let display=value;

if(typeof display==="string"){
display=display.replace("%","");
}

const percent = target ? (display/target)*100 : 0;

return(

<Col span={4}>
<Card
style={{
borderRadius:12,
boxShadow:"0 2px 10px rgba(0,0,0,0.08)"
}}
>

<div style={{fontSize:13,fontWeight:600,color:"#555"}}>
{title}
</div>

<div style={{
fontSize:28,
fontWeight:700,
marginTop:4
}}>
{display} {unit}
</div>

<div style={{
fontSize:12,
color:trend>=0?"green":"red",
marginBottom:8
}}>
{trend>=0?"▲":"▼"} {Math.abs(trend)}%
</div>

{/* MINI BAR GRAPH */}
<div style={{
display:"flex",
gap:4,
height:40,
alignItems:"flex-end",
marginBottom:10
}}>
{[40,65,50,70,60].map((h,i)=>(
<div
key={i}
style={{
width:6,
height:h,
background:"#3f7df5",
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
background:percent>=100?"green":"#52c41a",
height:"100%"
}}
/>
</div>

<div style={{fontSize:12,marginTop:6}}>
Target: {target}
</div>

</Card>
</Col>

)
}

<Row gutter={16} style={{marginBottom:20}}>

{tileData?.AHT !== undefined &&
 renderKpi("AHT (CS)", tileData.AHT, "sec", metrics?.ahtTarget)
}

{tileData?.CSAT &&
 renderKpi("CSAT (CS)", tileData.CSAT.overall, "%", metrics?.csatTarget)
}

{tileData?.CallQuality !== undefined &&
 renderKpi("OVERALL QUALITY", tileData.CallQuality, "%", metrics?.qualityTarget)
}

{tileData?.Adherence !== undefined &&
 renderKpi("ADHERENCE", tileData.Adherence, "%", metrics?.adherenceTarget)
}

{tileData?.ProductionHours !== undefined &&
 renderKpi("PRODUCTION HOURS", tileData.ProductionHours, "", metrics?.productionTarget)
}

</Row>


let display=value;

if(typeof display==="string"){
display=parseFloat(display.replace("%",""));
}

if(display===undefined || display===null){
display="--";
}


