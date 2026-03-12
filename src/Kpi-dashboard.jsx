import React, { useEffect, useState } from "react";
import axios from "axios";
import { Select, Table, Segmented, Card, Row, Col, Spin } from "antd";

const { Option } = Select;
const API_BASE = "http://localhost:9009/api";

export default function ConcoraAnalytics() {

const [loading,setLoading]=useState(false);
const [viewBy,setViewBy]=useState("Day");
const [columns,setColumns]=useState([]);
const [tableData,setTableData]=useState([]);
const [metrics,setMetrics]=useState({});
const [filterOptions,setFilterOptions]=useState({});

const [filters,setFilters]=useState({
year_type:"Calendar Year",
year:2026,
month:"January",
geo:"ALL",
client_name:"ALL",
program:"ALL",
lob:"ALL",
supervisor:"ALL",
tenure_unit:"days",
tenure_lower:0,
tenure_upper:0
});

/* ---------- API ENDPOINTS ---------- */

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

/* ---------- PAYLOAD ---------- */

const payload={
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
};

/* ---------- LOAD FILTERS ---------- */

useEffect(()=>{

axios.post(API_BASE+getFilterEndpoint(),{
geo:"ALL",
supervisor:"ALL",
program:"ALL",
lob:"ALL",
client_name:"ALL"
})
.then(res=>{
setFilterOptions(res.data||{});
});

},[viewBy]);

/* ---------- LOAD DATA ---------- */

useEffect(()=>{

setLoading(true);

axios.post(API_BASE+getDataEndpoint(),payload)
.then(res=>{
buildDynamicTable(res.data);
setLoading(false);
})
.catch(()=>setLoading(false));

},[filters,viewBy]);

/* ---------- TABLE BUILDER ---------- */

const buildDynamicTable=(response)=>{

if(!response || Object.keys(response).length===0){
setColumns([]);
setTableData([]);
return;
}

let dates=[];
let dataMap={};

const firstValue=response[Object.keys(response)[0]];

if(firstValue && firstValue.CSAT){

dates=Object.keys(response);

dates.forEach(d=>{
dataMap[d]=response[d];
});

}else{

Object.values(response).forEach(group=>{
Object.keys(group).forEach(date=>{
dates.push(date);
dataMap[date]=group[date];
});
});

}

dates.sort();

/* COLUMNS */

const cols=[
{
title:"Metric",
dataIndex:"metric",
width:200,
fixed:"left"
},
{
title:"Target",
dataIndex:"target",
width:90
}
];

dates.forEach(date=>{
cols.push({
title:date,
dataIndex:date,
width:95,
render:(val)=>(
<div className="heat-cell">
{val}
</div>
)
});
});

setColumns(cols);

/* ROWS */

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
value=entry?.CSAT?.csat_score||0;
if(typeof value==="string"){
value=parseFloat(value.replace("%",""));
}
}else{
value=entry?.[metric.key]||0;
}

row[date]=value;

});

rows.push(row);

});

setTableData(rows);

/* KPI */

const first=dataMap[dates[0]];

setMetrics({
aht:first?.AHT||"--",
csat:first?.CSAT?.overall||"--",
quality:first?.CallQuality||"--",
adherence:first?.Adherence||"--",
attrition:first?.Attrition||"--"
});

};

/* ---------- FILTER UPDATE ---------- */

const updateFilter=(key,val)=>{
setFilters(prev=>({...prev,[key]:val}));
};

/* ---------- UI ---------- */

return(

<div style={{padding:24}}>

<style>{`

.filter-wrapper{
display:grid;
grid-template-columns: repeat(9, 1fr);
gap:14px;
}

.filter-box{
display:flex;
flex-direction:column;
width:100%;
}

.viewbox{
margin-left:auto;
}

.heat-cell{
background:#d7f5e9;
padding:4px;
border-radius:4px;
text-align:center;
}

.ant-table-thead > tr > th{
background:#153a6f !important;
color:white !important;
font-weight:600;
}

`}</style>

<h2 style={{marginBottom:10}}>Concora Credit Inc</h2>

{/* TOP ROW */}

<div style={{display:"flex",gap:16,alignItems:"flex-start"}}>

{/* FILTER BOX */}

<div style={{
background:"#fff",
padding:16,
borderRadius:10,
boxShadow:"0 2px 8px rgba(0,0,0,0.08)",
flex:1
}}>

<div className="filter-wrapper">

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

</div>

{/* VIEW BY BOX */}

<div className="viewbox"
style={{
background:"#fff",
padding:16,
borderRadius:10,
boxShadow:"0 2px 8px rgba(0,0,0,0.08)"
}}
>

<div style={{fontWeight:600,marginBottom:8}}>
View By
</div>

<Segmented
options={["Day","Week","Month"]}
value={viewBy}
onChange={setViewBy}
/>

</div>

</div>

{/* KPI */}

<Row gutter={16} style={{marginTop:20}}>

{renderKpi("AHT (CS)",metrics.aht,"sec",657)}
{renderKpi("CSAT (CS)",metrics.csat,"%",90)}
{renderKpi("OVERALL QUALITY",metrics.quality,"%",95)}
{renderKpi("ADHERENCE",metrics.adherence,"%",88)}
{renderKpi("ATTRITION %",metrics.attrition,"%",8)}

</Row>

{/* TABLE */}

<div style={{marginTop:20}}>

{loading ? <Spin/> :

<Table
columns={columns}
dataSource={tableData}
pagination={false}
bordered
size="small"
scroll={{x:true}}
/>

}

</div>

</div>

);

/* ---------- FILTER ---------- */

function renderFilter(label,key){

return(

<div className="filter-box">

<label style={{fontSize:12,fontWeight:600}}>
{label}
</label>

<Select
value={filters[key]}
style={{width:"100%"}}
dropdownMatchSelectWidth={false}
dropdownStyle={{minWidth:200}}
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

/* ---------- KPI ---------- */

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

<div style={{fontSize:24,fontWeight:700}}>
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
