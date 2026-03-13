import React, { useEffect, useState } from "react";
import axios from "axios";
import { Select, Table, Segmented, Card, Row, Col, Spin } from "antd";

const { Option } = Select;
const API_BASE = "http://localhost:9009/api";

/* ONLY UI CONFIG — NOT DATA */
const TILE_KEYS = ["AHT","CSAT","CallQuality","Adherence","ProductionHours"];

export default function KPIDashboard(){

const [loading,setLoading]=useState(false);
const [viewBy,setViewBy]=useState("Day");

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

const [filterOptions,setFilterOptions]=useState({});
const [columns,setColumns]=useState([]);
const [tableData,setTableData]=useState([]);
const [tileData,setTileData]=useState({});
const [graphData,setGraphData]=useState({});
const [dates,setDates]=useState([]);

/* ---------------- ENDPOINTS ---------------- */

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

/* ---------------- PAYLOAD ---------------- */

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

/* ---------------- LOAD FILTERS ---------------- */

useEffect(()=>{

axios.post(API_BASE+getFilterEndpoint(),{
geo:"ALL",
supervisor:"ALL",
program:"ALL",
lob:"ALL",
client_name:"ALL"
})
.then(res=>setFilterOptions(res.data||{}));

},[viewBy]);

/* ---------------- LOAD DATA ---------------- */

useEffect(()=>{

setLoading(true);

axios.post(API_BASE+getDataEndpoint(),payload)
.then(res=>{

const response=res.data;

buildDynamicTable(response);

setTileData(response.tile || {});

})
.finally(()=>setLoading(false));

},[filters,viewBy]);

/* ---------------- TABLE BUILDER ---------------- */

function buildDynamicTable(response){

if(!response || Object.keys(response).length===0){
setColumns([]);
setTableData([]);
return;
}

let dateList=[];
let dataMap={};

const first=response[Object.keys(response)[0]];

/* DAILY */

if(first && first.CSAT){

dateList=Object.keys(response).filter(k=>k!=="tile");

dateList.forEach(d=>{
dataMap[d]=response[d];
});

}

/* WEEK / MONTH */

else{

Object.values(response).forEach(group=>{
Object.keys(group).forEach(date=>{
dateList.push(date);
dataMap[date]=group[date];
});
});

}

dateList=[...new Set(dateList)];
dateList.sort();

setDates(dateList);

/* GRAPH DATA */

let graphKeys=[];

if(viewBy==="Day") graphKeys=dateList.slice(-7);
if(viewBy==="Week") graphKeys=dateList.slice(-6);
if(viewBy==="Month") graphKeys=dateList.slice(-12);

const graph={};

graphKeys.forEach(k=>{
graph[k]=dataMap[k];
});

setGraphData(graph);

/* ---------------- COLUMNS ---------------- */

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
width:90,
fixed:"left"
}
];

dateList.forEach(date=>{
cols.push({
title:date,
dataIndex:date,
render:(val)=><div className="heat-cell">{val}</div>
});
});

setColumns(cols);

/* ---------------- ROWS ---------------- */

const metrics=Object.keys(dataMap[dateList[0]] || {});

const rows=[];

metrics.forEach(metric=>{

const row={
metric:metric,
target:dataMap[dateList[0]]?.targets?.[metric]
};

dateList.forEach(date=>{

let value=dataMap[date]?.[metric];

if(typeof value==="string"){
value=parseFloat(value.replace("%",""));
}

row[date]=value || 0;

});

rows.push(row);

});

setTableData(rows);

}

/* ---------------- UPDATE FILTER ---------------- */

const updateFilter=(key,val)=>{
setFilters(prev=>({...prev,[key]:val}));
};

/* ---------------- KPI TILE ---------------- */

function renderKpi(title,value,unit,target){

let display=value;

if(typeof display==="string"){
display=parseFloat(display.replace("%",""));
}

if(display===undefined || display===null) display="--";

const percent=target?(display/target)*100:0;

return(

<Col span={4} key={title}>

<Card style={{borderRadius:10}}>

<div style={{fontSize:13,fontWeight:600,color:"#555"}}>
{title}
</div>

<div style={{fontSize:28,fontWeight:700}}>
{display} {unit}
</div>

<div style={{
height:6,
background:"#eee",
borderRadius:4,
overflow:"hidden",
marginTop:6
}}>

<div style={{
width:`${percent}%`,
background:percent>=100?"green":"#52c41a",
height:"100%"
}}/>

</div>

<div style={{fontSize:12,marginTop:6}}>
Target: {target}
</div>

</Card>

</Col>

);

}

/* ---------------- FILTER RENDER ---------------- */

function renderFilter(label,key){

return(

<div className="filter-box">

<label style={{fontSize:12,fontWeight:600}}>
{label}
</label>

<Select
value={filters[key]}
style={{width:"100%"}}
popupMatchSelectWidth={false}
styles={{popup:{minWidth:200}}}
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

/* ---------------- UI ---------------- */

return(

<div style={{padding:24}}>

{/* FILTERS */}

<div className="filter-wrapper">

{viewBy!=="Week" && renderFilter("YEAR TYPE","year_type")}
{viewBy!=="Week" && renderFilter("YEAR","year")}
{viewBy==="Month" && renderFilter("MONTH","month")}

{renderFilter("GEOGRAPHY","geo")}
{renderFilter("CLIENT","client_name")}
{renderFilter("JOB CODE","program")}
{renderFilter("LINE OF BUSINESS","lob")}
{renderFilter("TENURE","tenure_unit")}
{renderFilter("SUPERVISOR","supervisor")}

</div>

{/* VIEW BY */}

<div className="viewbox">

<div style={{fontWeight:600,marginRight:10}}>
View By :
</div>

<Segmented
options={[
{label:"Day",value:"Day"},
{label:"Week",value:"Week"},
{label:"Month",value:"Month"}
]}
value={viewBy}
onChange={(v)=>setViewBy(v)}
/>

</div>

{/* KPI TILES */}

<Row gutter={16} style={{marginBottom:20}}>

{tileData &&
Object.keys(tileData)
.filter(k=>TILE_KEYS.includes(k))
.map(key=>{

let value=tileData[key];

if(key==="CSAT"){
value=tileData.CSAT?.overall;
}

return renderKpi(
key==="AHT"?"AHT (CS)":
key==="CSAT"?"CSAT (CS)":
key==="CallQuality"?"OVERALL QUALITY":
key==="Adherence"?"ADHERENCE":
"PRODUCTION HOURS",
value,
key==="AHT"?"sec":"%",
tileData?.targets?.[key]
);

})}

</Row>

{/* TABLE */}

<div style={{marginTop:20}}>

{loading ?

<Spin/>

:

<Table
columns={columns}
dataSource={tableData}
pagination={false}
bordered
size="small"
scroll={{x:"max-content",y:500}}
/>

}

</div>

</div>

);

}
