function renderKpi(title,value,unit,target){

  let display=value;

  if(typeof display==="string"){
    display=parseFloat(display.replace("%",""));
  }

  if(display===undefined || display===null){
    display="--";
  }

  /* COLORS (same as figma) */

  let color="#3f7df5";

  if(title.includes("AHT")) color="#d4380d";
  if(title.includes("CSAT")) color="#389e0d";
  if(title.includes("QUALITY")) color="#2f54eb";
  if(title.includes("ADHERENCE")) color="#fa8c16";
  if(title.includes("PRODUCTION")) color="#2f54eb";


  /* GRAPH DATA ONLY FROM TILE OBJECT */

  let series=[];
  let labels=[];

  if(title==="CSAT (CS)" && tileData?.CSAT){
    const g=tileData.CSAT;

    const mapping={
      csat_score:"Mon",
      timeliness_score:"Tue",
      resolution_score:"Wed",
      valued_customer_score:"Thu"
    };

    labels=Object.keys(mapping);

    series=labels.map(k=>{
      const v=g[k];
      if(!v) return null;
      return parseFloat(v.replace("%",""));
    }).filter(v=>v!==null);
  }


  const hasGraph=series.length>0;

  const maxValue=Math.max(...series,0);

  let scaleMax=100;

  if(maxValue>1000) scaleMax=2000;
  else if(maxValue>500) scaleMax=1000;
  else if(maxValue>200) scaleMax=400;
  else if(maxValue>100) scaleMax=200;
  else if(maxValue>50) scaleMax=100;
  else scaleMax=50;


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


  {/* TARGET TEXT */}

  <div style={{fontSize:12,color:"#777",marginBottom:6}}>
  Target: {target}
  </div>


  {/* GRAPH */}

  {hasGraph && (

  <div style={{display:"flex",gap:6}}>

  {/* Y AXIS */}

  <div style={{
  fontSize:10,
  color:"#888",
  display:"flex",
  flexDirection:"column",
  justifyContent:"space-between",
  height:50
  }}>
  <span>{scaleMax}</span>
  <span>{Math.round(scaleMax/2)}</span>
  <span>0</span>
  </div>


  {/* BARS */}

  <div style={{flex:1}}>

  <div style={{
  display:"flex",
  alignItems:"flex-end",
  height:50,
  gap:8
  }}>

  {series.map((v,i)=>{

  const h=(v/scaleMax)*50;

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

  {labels.map(l=>(
  <span key={l}>
  {l.replace("_score","").replace("_"," ").slice(0,3)}
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
