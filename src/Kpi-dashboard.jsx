import React, { useEffect, useState } from "react";
import axios from "axios";
import { Select, Row, Col, Card, Segmented, Table } from "antd";

const { Option } = Select;

const API = "http://localhost:9009/api";

export default function ConcoraAnalytics() {

const [viewBy,setViewBy] = useState("Day")

const [filters,setFilters] = useState({
year_type:"Fiscal Year",
year:"FY2",
month:"Nov",
geo:"All",
client:"All",
job_code:"All",
lob:"All",
tenure:"All",
supervisor:"All"
})

const [filterOptions,setFilterOptions] = useState({})
const [metrics,setMetrics] = useState({})
const [tableData,setTableData] = useState([])


/* ---------------- API ENDPOINT ---------------- */

const dataEndpoint = ()=>{
if(viewBy==="Day") return "/get_concora_daily_data/"
if(viewBy==="Week") return "/get_concora_weekly_data/"
return "/get_concora_monthly_data/"
}

const filterEndpoint = ()=>{
if(viewBy==="Day") return "/get_concora_daily_filters/"
if(viewBy==="Week") return "/get_concora_weekly_filters/"
return "/get_concora_monthly_filters/"
}


/* ---------------- PAYLOAD ---------------- */

const payload = {
year:2026,
year_type:"Calendar Year",
month:"March",
geo:"ALL",
client_name:"ALL",
program:"ALL",
lob:"ALL",
supervisor:"ALL",
tenure_unit:"days",
tenure_lower:0,
tenure_upper:0
}


/* ---------------- LOAD FILTERS ---------------- */

useEffect(()=>{

axios.post(API + filterEndpoint(),payload)
.then(res=>{
setFilterOptions(res.data)
})

},[viewBy])


/* ---------------- LOAD DATA ---------------- */

useEffect(()=>{

axios.post(API + dataEndpoint(),payload)
.then(res=>{

const data = res.data
const firstKey = Object.keys(data)[0]

if(!firstKey) return

const row = data[firstKey]

setMetrics({
aht:row.AHT,
csat:row.CSAT?.overall,
quality:row.CallQuality,
adherence:row.Adherence,
attrition:row.Attrition
})

})

},[viewBy])


/* ---------------- TABLE ---------------- */

const columns = [
{title:"Metric",dataIndex:"metric"},
{title:"Target",dataIndex:"target"},
{title:"1-Nov",dataIndex:"d1"},
{title:"2-Nov",dataIndex:"d2"},
{title:"3-Nov",dataIndex:"d3"},
{title:"4-Nov",dataIndex:"d4"},
{title:"5-Nov",dataIndex:"d5"}
]


/* ---------------- UI ---------------- */

return(

<div style={{padding:24}}>

<h2 style={{marginBottom:16}}>Concora Credit Inc</h2>


{/* FILTER CONTAINER */}

<div style={{
background:"#fff",
padding:16,
borderRadius:10,
boxShadow:"0 2px 8px rgba(0,0,0,0.1)",
display:"flex",
gap:16,
flexWrap:"wrap"
}}>

<Filter label="YEAR TYPE"/>
<Filter label="YEAR"/>
<Filter label="MONTH"/>
<Filter label="GEOGRAPHY"/>
<Filter label="CLIENT"/>
<Filter label="JOB CODE"/>
<Filter label="LINE OF BUSINESS"/>
<Filter label="TENURE"/>
<Filter label="SUPERVISOR"/>

</div>


{/* VIEW BY */}

<div style={{
marginTop:12,
background:"#fff",
padding:12,
borderRadius:10,
boxShadow:"0 2px 8px rgba(0,0,0,0.1)",
display:"flex",
justifyContent:"flex-end",
alignItems:"center",
gap:10
}}>

<span style={{fontWeight:500}}>View By:</span>

<Segmented
options={["Day","Week","Month"]}
value={viewBy}
onChange={setViewBy}
/>

</div>


{/* KPI CARDS */}

<Row gutter={16} style={{marginTop:20}}>

<Kpi title="AHT (CS)" value={metrics.aht} target="657"/>
<Kpi title="CSAT (CS)" value={metrics.csat} target="90"/>
<Kpi title="OVERALL QUALITY" value={metrics.quality} target="95"/>
<Kpi title="ADHERENCE" value={metrics.adherence} target="88"/>
<Kpi title="ATTRITION %" value={metrics.attrition} target="8"/>

</Row>


{/* TABLE */}

<div style={{marginTop:24}}>

<Table
columns={columns}
dataSource={tableData}
pagination={false}
/>

</div>


</div>

)

}



/* ---------------- FILTER COMPONENT ---------------- */

function Filter({label}){

return(

<div style={{width:150}}>

<div style={{
fontSize:12,
fontWeight:600,
marginBottom:4
}}>
{label}
</div>

<Select style={{width:"100%"}}>
<Option>All</Option>
</Select>

</div>

)

}



/* ---------------- KPI CARD ---------------- */

function Kpi({title,value,target}){

return(

<Col span={4}>

<Card>

<div style={{fontSize:13,fontWeight:600}}>
{title}
</div>

<div style={{fontSize:28,fontWeight:700}}>
{value || "--"}
</div>

<div style={{fontSize:12,color:"#888"}}>
Target: {target}
</div>

</Card>

</Col>

)

}
