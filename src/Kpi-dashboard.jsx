import React, { useEffect, useState } from "react";
import axios from "axios";
import { Select, Table, Segmented, Card, Row, Col, Spin } from "antd";

const { Option } = Select;

const API_BASE = "http://localhost:9009/api";

export default function ConcoraAnalytics() {

/* ---------------- STATE ---------------- */

const [loading,setLoading] = useState(false);
const [viewBy,setViewBy] = useState("Day");

const [columns,setColumns] = useState([]);
const [tableData,setTableData] = useState([]);

const [metrics,setMetrics] = useState({});

const [filters,setFilters] = useState({
year_type:"Calendar Year",
year:2026,
month:"February",
geo:"ALL",
client_name:"ALL",
program:"ALL",
lob:"ALL",
supervisor:"ALL",
tenure_unit:"days",
tenure_lower:0,
tenure_upper:0
});

const [filterOptions,setFilterOptions] = useState({});

/* ---------------- API ENDPOINTS ---------------- */

const getDataEndpoint=()=>{
if(viewBy==="Day") return "/get_concora_daily_data/";
if(viewBy==="Week") return "/get_concora_weekly_data/";
return "/get_concora_monthly_data/";
};

const getFilterEndpoint=()=>{
if(viewBy==="Day") return "/get_concora_daily_filters/";
if(viewBy==="Week") return "/get_concora_weekly_filters/";
return "/get_concora_monthly_filters/";
};

/* ---------------- BUILD PAYLOAD ---------------- */

const buildPayload=()=>({
year:filters.year,
year_type:filters.year_type,
month:filters.month,
geo:filters.geo,
client_name:filters.client_name,
program:filters.program,
lob:filters.lob,
supervisor:filters.supervisor,
tenure_unit:filters.tenure_unit,
tenure_lower:filters.tenure_lower,
tenure_upper:filters.tenure_upper
});

/* ---------------- LOAD FILTER OPTIONS ---------------- */

useEffect(()=>{

axios.post(API_BASE + getFilterEndpoint(),{
geo:"ALL",
supervisor:"ALL",
program:"ALL",
lob:"ALL",
client_name:"ALL"
})
.then(res=>{

setFilterOptions(res.data || {});

});

},[viewBy]);

/* ---------------- LOAD DATA ---------------- */

useEffect(()=>{

setLoading(true);

axios.post(API_BASE + getDataEndpoint(),buildPayload())
.then(res=>{

parseResponse(res.data);

setLoading(false);

})
.catch(()=>setLoading(false));

},[filters,viewBy]);

/* ---------------- PARSE RESPONSE ---------------- */

const parseResponse=(response)=>{

if(!response || Object.keys(response).length===0){
setColumns([]);
setTableData([]);
return;
}

buildDynamicTable(response);

};

/* ---------------- UNIVERSAL TABLE BUILDER ---------------- */

const buildDynamicTable=(response)=>{

let dates=[];
let dataMap={};

const firstValue=response[Object.keys(response)[0]];

/* DAILY STRUCTURE */

if(firstValue && firstValue.CSAT){

dates=Object.keys(response);

dates.forEach(d=>{
dataMap[d]=response[d];
});

}

/* WEEKLY / MONTHLY */

else{

Object.values(response).forEach(group=>{

Object.keys(group).forEach(date=>{
dates.push(date);
dataMap[date]=group[date];
});

});

}

dates.sort();

/* ---------- TABLE COLUMNS ---------- */

const cols=[
{
title:"Metric",
dataIndex:"metric",
fixed:"left",
width:220
},
{
title:"Target",
dataIndex:"target",
width:100
}
];

dates.forEach(date=>{
cols.push({
title:date,
dataIndex:date,
width:110,
render:(val)=>(
<div
style={{
background:getHeatColor(val),
padding:"6px",
borderRadius:4,
textAlign:"center"
}}
>
{val}
</div>
)
});
});

setColumns(cols);

/* ---------- ROWS ---------- */

const metricList=[
{label:"AHT (CS)",key:"AHT",target:657},
{label:"CSAT (CS)",key:"csat_score",target:90,csat:true},
{label:"Overall Call Quality",key:"CallQuality",target:95},
{label:"Overall Adherence",key:"Adherence",target:85},
{label:"Production Hours",key:"ProductionHours",target:2000},
{label:"Absenteeism %",key:"Absenteeism",target:3},
{label:"Shrinkage %",key:"Shrinkage",target:15},
{label:"Attrition %",key:"Attrition",target:8}
];

const rows=[];

metricList.forEach(metric=>{

const row={
metric:metric.label,
target:metric.target
};

dates.forEach(date=>{

const entry=dataMap[date];

let value=0;

if(metric.csat){

value=entry?.CSAT?.csat_score || 0;

if(typeof value==="string"){
value=parseFloat(value.replace("%",""));
}

}else{

value=entry?.[metric.key] || 0;

}

row[date]=value;

});

rows.push(row);

});

setTableData(rows);

/* ---------- KPI CARDS ---------- */

const first=dataMap[dates[0]];

setMetrics({
aht:first?.AHT || "--",
csat:first?.CSAT?.overall || "--",
quality:first?.CallQuality || "--",
adherence:first?.Adherence || "--",
attrition:first?.Attrition || "--"
});

};

/* ---------------- HEATMAP COLOR ---------------- */

const getHeatColor=(value)=>{

if(!value) return "#fde2e1";

if(value>=95) return "#d7f5e9";

if(value>=85) return "#fff4cc";

return "#fde2e1";

};

/* ---------------- FILTER CHANGE ---------------- */

const updateFilter=(key,val)=>{
setFilters(prev=>({...prev,[key]:val}));
};

/* ---------------- UI ---------------- */

return(

<div style={{padding:24}}>

<h2>Concora Credit Inc</h2>

{/* FILTER BOX */}

<div
style={{
background:"#fff",
padding:16,
borderRadius:10,
boxShadow:"0 2px 8px rgba(0,0,0,0.08)",
display:"flex",
gap:16,
flexWrap:"wrap"
}}
>

{renderFilter("YEAR TYPE","year_type")}
{renderFilter("YEAR","year")}
{renderFilter("MONTH","month")}
{renderFilter("GEOGRAPHY","geo")}
{renderFilter("CLIENT","client_name")}
{renderFilter("JOB CODE","program")}
{renderFilter("LINE OF BUSINESS","lob")}
{renderFilter("TENURE","tenure_unit")}
{renderFilter("SUPERVISOR","supervisor")}

</div>

{/* VIEW BY */}

<div
style={{
marginTop:12,
background:"#fff",
padding:12,
borderRadius:10,
boxShadow:"0 2px 8px rgba(0,0,0,0.08)",
display:"flex",
justifyContent:"flex-end",
gap:10
}}
>

<span style={{fontWeight:600}}>View By:</span>

<Segmented
options={["Day","Week","Month"]}
value={viewBy}
onChange={setViewBy}
/>

</div>

{/* KPI CARDS */}

<Row gutter={16} style={{marginTop:20}}>

{renderKpi("AHT (CS)",metrics.aht,"sec",657)}
{renderKpi("CSAT (CS)",metrics.csat,"% ",90)}
{renderKpi("OVERALL QUALITY",metrics.quality,"% ",95)}
{renderKpi("ADHERENCE",metrics.adherence,"% ",88)}
{renderKpi("ATTRITION %",metrics.attrition,"% ",8)}

</Row>

{/* TABLE */}

<div style={{marginTop:24}}>

{loading ? <Spin/> :

<Table
columns={columns}
dataSource={tableData}
pagination={false}
scroll={{x:true}}
/>

}

</div>

</div>

);

/* ---------------- FILTER UI ---------------- */

function renderFilter(label,key){

return(

<div style={{width:160}}>

<div
style={{
fontSize:12,
fontWeight:600,
marginBottom:4
}}
>
{label}
</div>

<Select
value={filters[key]}
style={{width:"100%"}}
onChange={(v)=>updateFilter(key,v)}
>

<Option value="ALL">All</Option>

{filterOptions[key]?.map(v=>(
<Option key={v}>{v}</Option>
))}

</Select>

</div>

);

}

/* ---------------- KPI CARD ---------------- */

function renderKpi(title,value,unit,target){

let display=value;

if(typeof display==="string"){
display=display.replace("%","");
}

return(

<Col span={4}>

<Card>

<div style={{fontSize:13,fontWeight:600}}>
{title}
</div>

<div style={{fontSize:26,fontWeight:700}}>
{display} {unit}
</div>

<div style={{fontSize:12}}>
Target: {target}
</div>

</Card>

</Col>

);

}

}
