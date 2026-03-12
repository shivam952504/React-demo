import React, { useEffect, useState } from "react";
import axios from "axios";
import { Select, Row, Col, Card, Segmented, Table, Progress, Spin } from "antd";

const { Option } = Select;

const API_BASE = "http://localhost:9009/api";

export default function ConcoraAnalytics() {

const [viewBy,setViewBy] = useState("Day");
const [loading,setLoading] = useState(false);

const [filters,setFilters] = useState({
year_type:"Calendar Year",
year:2026,
month:"March",
geo:"ALL",
client_name:"ALL",
program:"ALL",
lob:"ALL",
supervisor:"ALL",
job_code:"ALL",
tenure_unit:"days",
tenure_lower:0,
tenure_upper:0
});

const [filterOptions,setFilterOptions] = useState({});
const [metrics,setMetrics] = useState({});
const [columns,setColumns] = useState([]);
const [tableData,setTableData] = useState([]);


/* ---------------- API SWITCH ---------------- */

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


/* ---------------- DYNAMIC PAYLOAD ---------------- */

const buildPayload=()=>{
return{
year:filters.year,
year_type:filters.year_type,
month:filters.month,
geo:filters.geo,
client_name:filters.client_name,
program:filters.program,
lob:filters.lob,
supervisor:filters.supervisor,
tenure_unit:filters.tenure_unit,
tenure_lower:Number(filters.tenure_lower),
tenure_upper:Number(filters.tenure_upper)
};
};


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
setFilterOptions(res.data);
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

const firstKey = Object.keys(response)[0];
if(!firstKey) return;

const firstWeek = response[firstKey];

setMetrics({
aht:firstWeek.AHT,
csat:firstWeek.CSAT?.overall,
quality:firstWeek.CallQuality,
adherence:firstWeek.Adherence,
attrition:firstWeek.Attrition
});

buildDynamicTable(response);

};


/* ---------------- DYNAMIC TABLE ---------------- */

const buildDynamicTable=(response)=>{

const firstKey = Object.keys(response)[0];
const firstWeek = response[firstKey];

const dates = Object.keys(firstWeek.CSAT.entry_dates);

const cols=[
{
title:"Metric",
dataIndex:"metric",
fixed:"left"
},
{
title:"Target",
dataIndex:"target"
}
];

dates.forEach(date=>{
cols.push({
title:date,
dataIndex:date,
render:(val)=>(
<div
style={{
background:getColor(val),
padding:4,
textAlign:"center"
}}
>
{val}
</div>
)
});
});

setColumns(cols);

buildRows(response,dates);

};


/* ---------------- BUILD ROWS ---------------- */

const buildRows=(response,dates)=>{

const metricsList=[
{label:"AHT (CS)",key:"AHT",target:657},
{label:"CSAT (CS)",key:"csat_score",target:90},
{label:"Overall Call Quality",key:"CallQuality",target:95},
{label:"Overall Adherence",key:"Adherence",target:85},
{label:"Production Hours",key:"ProductionHours",target:2000},
{label:"Absenteeism %",key:"Absenteeism",target:3},
{label:"Shrinkage %",key:"Shrinkage",target:15}
];

const rows=[];

metricsList.forEach(metric=>{

const row={
metric:metric.label,
target:metric.target
};

dates.forEach(date=>{

Object.values(response).forEach(week=>{

row[date]=week[metric.key] || 0;

});

});

rows.push(row);

});

setTableData(rows);

};


/* ---------------- HEATMAP COLOR ---------------- */

const getColor=(value)=>{

if(!value) return "#f5f5f5";
if(value>=95) return "#d7f5e9";
if(value>=85) return "#fff5d6";

return "#fde2e1";

};


/* ---------------- UI ---------------- */

return(

<div style={{padding:24}}>

<h2 style={{marginBottom:16}}>Concora Credit Inc</h2>

<Filters filters={filters} setFilters={setFilters} filterOptions={filterOptions}/>

<ViewBy viewBy={viewBy} setViewBy={setViewBy}/>

<KpiSection metrics={metrics}/>

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

}


/* ---------------- FILTERS ---------------- */

function Filters({filters,setFilters,filterOptions}){

const FilterBox=(label,key,options)=>(
<div style={{width:160}}>

<div style={{fontSize:12,fontWeight:600,marginBottom:4}}>
{label}
</div>

<Select
value={filters[key]}
style={{width:"100%"}}
onChange={(v)=>setFilters({...filters,[key]:v})}
>
<Option value="ALL">All</Option>
{options?.map(v=>(
<Option key={v}>{v}</Option>
))}
</Select>

</div>
);

return(

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

{FilterBox("YEAR TYPE","year_type")}
{FilterBox("YEAR","year")}
{FilterBox("MONTH","month")}
{FilterBox("GEOGRAPHY","geo",filterOptions.geo)}
{FilterBox("CLIENT","client_name",filterOptions.client)}
{FilterBox("JOB CODE","job_code",filterOptions.job_code)}
{FilterBox("LINE OF BUSINESS","lob",filterOptions.lob)}
{FilterBox("TENURE","tenure")}
{FilterBox("SUPERVISOR","supervisor",filterOptions.supervisor)}

</div>

);

}


/* ---------------- VIEW BY ---------------- */

function ViewBy({viewBy,setViewBy}){

return(

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

);

}


/* ---------------- KPI SECTION ---------------- */

function KpiSection({metrics}){

return(

<Row gutter={16} style={{marginTop:20}}>

<Kpi title="AHT (CS)" value={metrics.aht} target={657} unit="sec"/>
<Kpi title="CSAT (CS)" value={metrics.csat} target={90} unit="%"/>
<Kpi title="OVERALL QUALITY" value={metrics.quality} target={95} unit="%"/>
<Kpi title="ADHERENCE" value={metrics.adherence} target={88} unit="%"/>
<Kpi title="ATTRITION %" value={metrics.attrition} target={8} unit="%"/>

</Row>

);

}


/* ---------------- KPI CARD ---------------- */

function Kpi({title,value,target,unit}){

const percent=value ? (value/target)*100 : 0;

return(

<Col span={4}>

<Card>

<div style={{fontWeight:600,fontSize:13}}>
{title}
</div>

<div style={{fontSize:26,fontWeight:700}}>
{value || "--"} {unit}
</div>

<Progress percent={percent} showInfo={false}/>

<div style={{fontSize:12}}>
Target: {target}
</div>

</Card>

</Col>

);

}
