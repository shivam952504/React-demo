import React, { useState, useEffect } from "react";
import axios from "axios";
import { Select, Input, Radio, Card } from "antd";

const { Option } = Select;

export default function ConcoraAnalytics() {

const [viewBy,setViewBy] = useState("day");
const [data,setData] = useState({});
const [filters,setFilters] = useState({
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
});

const [filterOptions,setFilterOptions] = useState({});


// ---------- API URL SWITCH ----------
const getDataUrl = ()=>{
if(viewBy==="day") return "/api/get_concora_daily_data/";
if(viewBy==="week") return "/api/get_concora_weekly_data/";
if(viewBy==="month") return "/api/get_concora_monthly_data/";
};

const getFilterUrl = ()=>{
if(viewBy==="day") return "/api/get_concora_daily_filters/";
if(viewBy==="week") return "/api/get_concora_weekly_filters/";
if(viewBy==="month") return "/api/get_concora_monthly_filters/";
};


// ---------- LOAD FILTERS ----------
useEffect(()=>{

axios.post(getFilterUrl(),{
geo:"ALL",
supervisor:"ALL",
program:"ALL",
lob:"ALL",
client_name:"ALL"
})
.then(res=>{
setFilterOptions(res.data)
})

},[viewBy])


// ---------- LOAD DATA ----------
useEffect(()=>{

const payload = {
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
}

axios.post(getDataUrl(),payload)
.then(res=>{
setData(res.data)
})

},[viewBy,filters])



const getColor=(val)=>{

if(val>=95) return "#d4edda"
if(val>=85) return "#fff3cd"
return "#f8d7da"

}



return(

<div style={{padding:20}}>


{/* ---------- VIEW BY ---------- */}

<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>

<span style={{fontWeight:500}}>View By</span>

<Radio.Group
value={viewBy}
onChange={(e)=>setViewBy(e.target.value)}
>

<Radio.Button value="day">Day</Radio.Button>
<Radio.Button value="week">Week</Radio.Button>
<Radio.Button value="month">Month</Radio.Button>

</Radio.Group>

</div>



{/* ---------- FILTERS ---------- */}

<div style={{
display:"flex",
gap:12,
flexWrap:"wrap",
background:"#fff",
padding:15,
borderRadius:8,
boxShadow:"0 2px 8px rgba(0,0,0,0.08)"
}}>


<Select
value={filters.year_type}
style={{width:160}}
onChange={(v)=>setFilters({...filters,year_type:v})}
>
<Option value="Calendar Year">Calendar Year</Option>
<Option value="Fiscal Year">Fiscal Year</Option>
</Select>


<Select
value={filters.year}
style={{width:120}}
onChange={(v)=>setFilters({...filters,year:v})}
>
<Option value={2025}>2025</Option>
<Option value={2026}>2026</Option>
</Select>


<Select
value={filters.month}
style={{width:140}}
onChange={(v)=>setFilters({...filters,month:v})}
>
<Option value="January">January</Option>
<Option value="February">February</Option>
<Option value="March">March</Option>
</Select>


<Select
value={filters.geo}
style={{width:160}}
onChange={(v)=>setFilters({...filters,geo:v})}
>
{(filterOptions.geo||[]).map(x=>
<Option key={x}>{x}</Option>
)}
</Select>


<Select
value={filters.program}
style={{width:200}}
onChange={(v)=>setFilters({...filters,program:v})}
>
{(filterOptions.program||[]).map(x=>
<Option key={x}>{x}</Option>
)}
</Select>


<Select
value={filters.lob}
style={{width:200}}
onChange={(v)=>setFilters({...filters,lob:v})}
>
{(filterOptions.lob||[]).map(x=>
<Option key={x}>{x}</Option>
)}
</Select>


<Select
value={filters.supervisor}
style={{width:220}}
onChange={(v)=>setFilters({...filters,supervisor:v})}
>
{(filterOptions.supervisor||[]).map(x=>
<Option key={x}>{x}</Option>
)}
</Select>


<Input
placeholder="Tenure Lower"
style={{width:120}}
value={filters.tenure_lower}
onChange={(e)=>setFilters({...filters,tenure_lower:e.target.value})}
/>


<Input
placeholder="Tenure Upper"
style={{width:120}}
value={filters.tenure_upper}
onChange={(e)=>setFilters({...filters,tenure_upper:e.target.value})}
/>


</div>



{/* ---------- KPI CARDS ---------- */}

<div style={{display:"flex",gap:20,marginTop:25}}>

<Card style={{width:200}}>AHT</Card>
<Card style={{width:200}}>CSAT</Card>
<Card style={{width:200}}>Overall Quality</Card>
<Card style={{width:200}}>Adherence</Card>
<Card style={{width:200}}>Attrition</Card>

</div>



{/* ---------- TABLE ---------- */}

<div style={{marginTop:25}}>

{Object.keys(data).map(week=>{

const row = data[week]

return(

<div key={week} style={{marginBottom:20}}>

<div style={{fontWeight:600,marginBottom:8}}>{week}</div>

<div style={{display:"flex",gap:6}}>

{Object.keys(row.CSAT.entry_dates).map(date=>{

const value = row.CSAT.overall

return(

<div
key={date}
style={{
padding:"6px 12px",
background:getColor(value),
borderRadius:4
}}
>

{value}

</div>

)

})}

</div>

</div>

)

})}

</div>



</div>

)

}
