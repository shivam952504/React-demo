import React, { useEffect, useState } from "react";
import axios from "axios";
import { Select, Table, Button, Card, Spin } from "antd";
import "./KeyMetricsSummary.css";

const { Option } = Select;

export default function KeyMetricsSummary() {

const BASE_URL="http://localhost:9009/api"

/* ------------------- STATE ------------------- */

const [viewBy,setViewBy]=useState("day")
const [loading,setLoading]=useState(false)

const [cards,setCards]=useState({})
const [tableData,setTableData]=useState([])
const [filtersData,setFiltersData]=useState({})

const [filters,setFilters]=useState({
year_type:"Fiscal",
year:2026,
month:"February",
geo:"ALL",
client_name:"ALL",
job_code:["ALL"],
program:"ALL",
lob:"ALL",
supervisor:"ALL",
tenure_unit:"month",
tenure_lower:0,
tenure_upper:0
})

/* ------------------- FILTER API ------------------- */

const loadFilters=async(body)=>{

const res=await axios.post(
`${BASE_URL}/get_concora_daily_filters/`,
body
)

setFiltersData(res.data)

}

/* ------------------- TABLE API ------------------- */

const loadTable=async(body)=>{

setLoading(true)

const res=await axios.post(
`${BASE_URL}/get_concora_daily_data/`,
body
)

const response=res.data

const dates=Object.keys(response)

const metrics=[
"AHT",
"CSAT",
"CallQuality",
"Adherence",
"ProductionHours",
"Absenteeism",
"Shrinkage",
"Attrition"
]

const rows=metrics.map(metric=>{

const row={metric}

dates.forEach(date=>{

if(metric==="CSAT"){
row[date]=response[date].CSAT?.overall ?? "-"
}else{
row[date]=response[date][metric] ?? "-"
}

})

return row
})

setTableData(rows)
setLoading(false)

}

/* ------------------- CARDS API ------------------- */

const loadCards=async(body)=>{

let url=`${BASE_URL}/concora_csat_daily/`

if(viewBy==="week") url=`${BASE_URL}/concora_csat_weekly/`
if(viewBy==="month") url=`${BASE_URL}/concora_csat_monthly/`

const res=await axios.post(url,body)

setCards(res.data)

}

/* ------------------- PAGE LOAD ------------------- */

useEffect(()=>{

loadFilters(filters)
loadTable(filters)
loadCards(filters)

},[])

/* ------------------- FILTER CHANGE ------------------- */

const updateFilter=(key,value)=>{

const updated={...filters,[key]:value}

setFilters(updated)

loadFilters(updated)
loadTable(updated)
loadCards(updated)

}

/* ------------------- VIEW MODE ------------------- */

const changeView=(mode)=>{

setViewBy(mode)

loadCards(filters)

}

/* ------------------- TABLE COLUMNS ------------------- */

const dateColumns=tableData.length
?Object.keys(tableData[0]).filter(c=>c!=="metric")
:[]

const columns=[
{
title:"Metric",
dataIndex:"metric",
fixed:"left",
width:200
},
...dateColumns.map(date=>({
title:date,
dataIndex:date,
render:(value)=>{

let cls="heat-low"

if(value>=95) cls="heat-high"
else if(value>=85) cls="heat-mid"

return(
<div className={`heat-cell ${cls}`}>
{value}
</div>
)

}
}))
]

/* ------------------- JSX ------------------- */

return(

<div className="km-container">

{/* FILTERS */}

<div className="filters">

<div className="filter">
<label>YEAR TYPE</label>
<Select
value={filters.year_type}
onChange={(v)=>updateFilter("year_type",v)}
>
<Option value="Fiscal">Fiscal Year</Option>
<Option value="Calendar">Calendar Year</Option>
</Select>
</div>

<div className="filter">
<label>YEAR</label>
<Select
value={filters.year}
onChange={(v)=>updateFilter("year",v)}
>
{filtersData.year?.map(y=>
<Option key={y}>{y}</Option>
)}
</Select>
</div>

{viewBy==="day"&&(

<div className="filter">
<label>MONTH</label>
<Select
value={filters.month}
onChange={(v)=>updateFilter("month",v)}
>
{filtersData.month?.map(m=>
<Option key={m}>{m}</Option>
)}
</Select>
</div>

)}

<div className="filter">
<label>GEOGRAPHY</label>
<Select
value={filters.geo}
onChange={(v)=>updateFilter("geo",v)}
>
{filtersData.geo?.map(g=>
<Option key={g}>{g}</Option>
)}
</Select>
</div>

<div className="filter">
<label>CLIENT</label>
<Select
value={filters.client_name}
onChange={(v)=>updateFilter("client_name",v)}
>
{filtersData.client_name?.map(c=>
<Option key={c}>{c}</Option>
)}
</Select>
</div>

<div className="filter">
<label>JOB CODE</label>
<Select
mode="multiple"
value={filters.job_code}
onChange={(v)=>updateFilter("job_code",v)}
>
{filtersData.job_code?.map(j=>
<Option key={j}>{j}</Option>
)}
</Select>
</div>

<div className="filter">
<label>LOB</label>
<Select
value={filters.program}
onChange={(v)=>updateFilter("program",v)}
>
{filtersData.program?.map(p=>
<Option key={p}>{p}</Option>
)}
</Select>
</div>

<div className="filter">
<label>SUPERVISOR</label>
<Select
value={filters.supervisor}
onChange={(v)=>updateFilter("supervisor",v)}
>
{filtersData.supervisor?.map(s=>
<Option key={s}>{s}</Option>
)}
</Select>
</div>

</div>

{/* CARDS */}

<div className="cards">

<Card className="metric">
<h4>AHT</h4>
<h2>{cards?.AHT ?? "-"}</h2>
</Card>

<Card className="metric">
<h4>CSAT</h4>
<h2>{cards?.CSAT?.overall ?? "-"}</h2>
</Card>

<Card className="metric">
<h4>OVERALL QUALITY</h4>
<h2>{cards?.CallQuality ?? "-"}</h2>
</Card>

<Card className="metric">
<h4>ADHERENCE</h4>
<h2>{cards?.Adherence ?? "-"}</h2>
</Card>

<Card className="metric">
<h4>ATTRITION</h4>
<h2>{cards?.Attrition ?? "-"}</h2>
</Card>

</div>

{/* VIEW MODE */}

<div className="view-mode">

<span>View By:</span>

<Button
className={viewBy==="day"?"active":""}
onClick={()=>changeView("day")}
>
Day
</Button>

<Button
className={viewBy==="week"?"active":""}
onClick={()=>changeView("week")}
>
Week
</Button>

<Button
className={viewBy==="month"?"active":""}
onClick={()=>changeView("month")}
>
Month
</Button>

</div>

{/* TABLE */}

{loading?(
<Spin size="large"/>
):(
<Table
columns={columns}
dataSource={tableData}
pagination={false}
scroll={{x:true}}
/>
)}

</div>

)

}

.km-container{
padding:20px;
}

.filters{
display:flex;
flex-wrap:wrap;
gap:20px;
background:white;
padding:20px;
border-radius:10px;
box-shadow:0 2px 10px rgba(0,0,0,0.08);
margin-bottom:20px;
}

.filter{
display:flex;
flex-direction:column;
}

.filter label{
font-size:12px;
color:#8c8c8c;
margin-bottom:5px;
}

.cards{
display:flex;
gap:20px;
margin-bottom:20px;
}

.metric{
width:200px;
text-align:center;
}

.view-mode{
display:flex;
align-items:center;
gap:10px;
margin-bottom:20px;
}

.view-mode button{
background:#f1f1f1;
border:none;
}

.view-mode button.active{
background:#1f8a70;
color:white;
}

.heat-cell{
padding:6px;
border-radius:4px;
text-align:center;
}

.heat-high{
background:#d4edda;
}

.heat-mid{
background:#fff3cd;
}

.heat-low{
background:#f8d7da;
}

