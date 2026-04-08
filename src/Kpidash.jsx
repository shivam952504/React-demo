import React, { useEffect, useState, useMemo } from “react”;
import axios from “axios”;
import { Select, Table, Spin } from “antd”;
import { LeftOutlined, RightOutlined } from “@ant-design/icons”;
import LoaderOverlay from “../loader/LoaderOverlay”;

const { Option } = Select;
const API_BASE   = “http://localhost:9009/api”;

const MONTH_NAMES = [
“January”,“February”,“March”,“April”,“May”,“June”,
“July”,“August”,“September”,“October”,“November”,“December”,
];
const CURRENT_YEAR = new Date().getFullYear();

/* ── color map ──────────────────────────────────────────────────*/
const COLOR_MAP = {
green:”#22c55e”, red:”#ef4444”, orange:”#f97316”,
blue:”#3b82f6”, yellow:”#eab308”, purple:”#a855f7”,
white:”#94a3b8”, gray:”#94a3b8”, grey:”#94a3b8”,
};
function resolveColor(c) {
if (!c) return “#22c55e”;
const lc = String(c).toLowerCase().trim();
return COLOR_MAP[lc] || c;
}
function colorToTint(c, alpha=0.12) {
const hex = resolveColor(c).replace(”#”,””);
if (hex.length!==6) return `rgba(34,197,94,${alpha})`;
const r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
return `rgba(${r},${g},${b},${alpha})`;
}

/* ── smart sort ─────────────────────────────────────────────────*/
const MONTH_ORDER={
january:1,february:2,march:3,april:4,may:5,june:6,
july:7,august:8,september:9,october:10,november:11,december:12,
jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
};
function dateKeyToSortValue(key){
const k=String(key).trim();
if(/^\d{4}-\d{2}-\d{2}$/.test(k)) return new Date(k).getTime();
if(/^\d{4}-\d{2}$/.test(k)) return new Date(k+”-01”).getTime();
const isoW=k.match(/^(\d{4})-W(\d{1,2})$/i);
if(isoW) return parseInt(isoW[1])*100+parseInt(isoW[2]);
const longW=k.match(/^week(\d{1,2})\s*(/i);
if(longW) return parseInt(longW[1]);
const bareW=k.match(/^w(?:eek\s*)?(\d{1,2})$/i);
if(bareW) return parseInt(bareW[1]);
const lk=k.toLowerCase();
if(MONTH_ORDER[lk]) return MONTH_ORDER[lk];
const mY=k.match(/^([a-z]+)[\s-](\d{4})$/i);
if(mY){const mo=MONTH_ORDER[mY[1].toLowerCase()];if(mo) return parseInt(mY[2])*100+mo;}
return k;
}
function smartSort(dates){
return […new Set(dates)].sort((a,b)=>{
const va=dateKeyToSortValue(a),vb=dateKeyToSortValue(b);
if(typeof va===“number”&&typeof vb===“number”) return va-vb;
return String(va).localeCompare(String(vb));
});
}

/* ── x-axis label ───────────────────────────────────────────────*/
function xAxisLabel(d,i,totalLen,viewBy){
const k=String(d).trim();
if(viewBy===“week”){
const m=k.match(/(?:^week|^W)(\d{1,2})/i);
return m?`W${m[1]}`:k.split(” “)[0];
}
if(viewBy===“month”){
const iso=k.match(/^\d{4}-(\d{2})$/);
if(iso) return MONTH_NAMES[parseInt(iso[1])-1]?.substring(0,3)??k;
const lk=k.toLowerCase();
if(MONTH_ORDER[lk]) return k.substring(0,3);
const my=k.match(/^([a-z]+)/i);
return my?my[1].substring(0,3):k.substring(0,3);
}
// day — show day number 1..31
const dt=new Date(k);
if(!isNaN(dt.getTime())) return String(dt.getDate());
return k.split(”-”).pop()||””;
}

/* ── field extractors ───────────────────────────────────────────*/
function extractField(raw,field){
if(raw===null||raw===undefined) return null;
if(typeof raw===“object”&&!Array.isArray(raw)) return raw[field]!==undefined?raw[field]:null;
if(field===“Overall”||field===“overall”) return raw;
return null;
}
function getOverall(raw){
const v=extractField(raw,“Overall”)??extractField(raw,“overall”)
??extractField(raw,“overall_percentage”)
??(typeof raw!==“object”?raw:null);
if(v===null||v===undefined) return null;
if(typeof v===“boolean”) return null;
const s=String(v).trim();
if(s===””||s===”-”||s===”–”||s.toLowerCase()===“nan”) return null;
const n=parseFloat(s.replace(”%”,””));
return isNaN(n)?s:n;
}
function getCellDisplay(raw){const v=getOverall(raw);return v!==null?v:”-”;}
function getCellColor(raw){return extractField(raw,“color”)||null;}
function getTarget(raw){
const t=extractField(raw,“target”);
if(t===null||t===undefined) return “-”;
const s=String(t).trim();
return(s===””||s===”-”||s===”–”)?”-”:s;
}
function getColor(raw){return resolveColor(extractField(raw,“color”));}
function getBoolFlag(raw,flag){if(!raw||typeof raw!==“object”) return false;return raw[flag]===true;}
function isNested(raw){
return raw!==null&&typeof raw===“object”&&!Array.isArray(raw)&&
(“Overall” in raw||“overall” in raw||“overall_percentage” in raw);
}

/* ── parse response ─────────────────────────────────────────────*/
function parseDateEntries(response){
const nonTile=Object.keys(response).filter(k=>k!==“tile”);
const first=response[nonTile[0]];
let dates=[],dataMap={};
const looksLikeEntry=v=>
v&&typeof v===“object”&&!Array.isArray(v)&&
Object.values(v).some(x=>
typeof x===“string”||typeof x===“number”||typeof x===“boolean”||
(typeof x===“object”&&x!==null&&“Overall” in x)
);
if(looksLikeEntry(first)){
dates=nonTile; nonTile.forEach(d=>{dataMap[d]=response[d];});
} else {
Object.values(response).forEach(group=>{
if(group&&typeof group===“object”&&!Array.isArray(group))
Object.keys(group).forEach(date=>{
if(date!==“tile”){dates.push(date);dataMap[date]=group[date];}
});
});
}
return{dates:smartSort(dates),dataMap};
}
function discoverMetricKeys(dates,dataMap){
const seen=new Set(),ordered=[];
dates.forEach(d=>{const e=dataMap[d];if(!e)return;Object.keys(e).forEach(k=>{if(!seen.has(k)){seen.add(k);ordered.push(k);}});});
return ordered;
}
function keyExistsInAnyEntry(key,dates,dataMap){return dates.some(d=>key in(dataMap[d]||{}));}
function hasRealValue(key,dates,dataMap){return dates.some(d=>getOverall(dataMap[d]?.[key])!==null);}
function metricPassesToggle(key,dates,dataMap,cOn,bOn,bqOn){
if(!cOn&&!bOn&&!bqOn) return true;
const isFlat=!dates.some(d=>isNested(dataMap[d]?.[key]));
if(isFlat) return true;
if(cOn&&!dates.some(d=>getBoolFlag(dataMap[d]?.[key],“Contractual”))) return false;
if(bOn&&!dates.some(d=>getBoolFlag(dataMap[d]?.[key],“Bonus and Penalty”))) return false;
if(bqOn&&!dates.some(d=>getBoolFlag(dataMap[d]?.[key],“Bonus Qualifier”))) return false;
return true;
}

/* =============================================================
COMPONENT
============================================================= */
export default function KPIDashboard(){
const [loading,         setLoading]         = useState(false);
const [tableLoading,    setTableLoading]     = useState(false);
const [viewBy,          setViewBy]           = useState(“day”);
const [contractualOn,   setContractualOn]    = useState(false);
const [bonusOn,         setBonusOn]          = useState(false);
const [bonusQOn,        setBonusQOn]         = useState(false);
const [columns,         setColumns]          = useState([]);
const [filterOptions,   setFilterOptions]    = useState({});
const [allTileData,     setAllTileData]      = useState([]);
const [allTableRows,    setAllTableRows]     = useState([]);
const [chartDates,      setChartDates]       = useState([]);
const [chartDataMap,    setChartDataMap]     = useState({});
const [showAllTiles,    setShowAllTiles]     = useState(false);
const [isFilterLoaded,  setIsFilterLoaded]   = useState(false);
const [error,           setError]            = useState(null);

const TILES_INITIAL = 6; // 2 rows × 3

const [filters,setFilters]=useState({
year_type:“Calendar Year”, year:CURRENT_YEAR, month:“January”,
geo:[“ALL”], program:[“ALL”], lob:[“ALL”],
supervisor:[“ALL”], tenure_units:[“ALL”],
});
const [debouncedFilters,setDebouncedFilters]=useState(null);
const debounceRef    = React.useRef(null);
const activeViewByRef= React.useRef(viewBy);

const dataEndpoint   = vb=>vb===“day”?”/get_concora_daily_data/”:vb===“week”?”/get_concora_weekly_data/”:”/get_concora_monthly_data/”;
const filterEndpoint = vb=>vb===“day”?”/get_concora_daily_filters/”:vb===“week”?”/get_concora_weekly_filters/”:”/get_concora_monthly_filters/”;
const buildPayload   = f=>({year_type:f.year_type,year:f.year,month:f.month,geo:f.geo,program:f.program,lob:f.lob,supervisor:f.supervisor,tenure_units:f.tenure_units});

useEffect(()=>{
if(debounceRef.current) clearTimeout(debounceRef.current);
debounceRef.current=setTimeout(()=>setDebouncedFilters({…filters}),600);
return()=>{if(debounceRef.current) clearTimeout(debounceRef.current);};
},[filters]);

/* EFFECT 1 — viewBy change */
useEffect(()=>{
const vb=viewBy;
activeViewByRef.current=vb;
setIsFilterLoaded(false);setLoading(true);setTableLoading(true);setError(null);
setAllTableRows([]);setAllTileData([]);setColumns([]);
const p=buildPayload(filters);
axios.post(API_BASE+filterEndpoint(vb),p)
.then(res=>{
if(activeViewByRef.current!==vb) return;
setFilterOptions(res.data||{});setIsFilterLoaded(true);setLoading(false);
return axios.post(API_BASE+dataEndpoint(vb),p);
})
.then(dr=>{
if(!dr||activeViewByRef.current!==vb) return;
if(!dr.data||!Object.keys(dr.data).length){setError(“No data available.”);return;}
buildDynamicTable(dr.data,vb);
})
.catch(()=>{if(activeViewByRef.current!==vb)return;setError(“Failed to load. Please try again.”);setAllTableRows([]);setAllTileData([]);setColumns([]);})
.finally(()=>{if(activeViewByRef.current===vb){setLoading(false);setTableLoading(false);}});
},[viewBy]); // eslint-disable-line

/* EFFECT 2 — debounced filter change */
useEffect(()=>{
if(!isFilterLoaded||!debouncedFilters) return;
const vb=viewBy;
setTableLoading(true);setError(null);
const p=buildPayload(debouncedFilters);
axios.post(API_BASE+filterEndpoint(vb),p)
.then(res=>{
if(activeViewByRef.current!==vb) return;
setFilterOptions(res.data||{});
return axios.post(API_BASE+dataEndpoint(vb),p);
})
.then(dr=>{
if(!dr||activeViewByRef.current!==vb) return;
if(!dr.data||!Object.keys(dr.data).length){setAllTableRows([]);setAllTileData([]);setColumns([]);setError(“No data available.”);return;}
buildDynamicTable(dr.data,vb);
})
.catch(()=>{if(activeViewByRef.current!==vb)return;setAllTableRows([]);setAllTileData([]);setColumns([]);setError(“Failed to load data.”);})
.finally(()=>{if(activeViewByRef.current===vb) setTableLoading(false);});
},[debouncedFilters]); // eslint-disable-line

/* BUILD TABLE & TILES */
const buildDynamicTable=(response,currentViewBy)=>{
const tileObj=response.tile||{};
const{dates,dataMap}=parseDateEntries(response);
if(!dates.length){setColumns([]);setAllTableRows([]);setAllTileData([]);return;}
setChartDates(dates);setChartDataMap(dataMap);
const metricKeys=discoverMetricKeys(dates,dataMap);
const activeKeys=metricKeys.filter(key=>keyExistsInAnyEntry(key,dates,dataMap));
const getMetricTarget=key=>{for(const d of dates){const t=getTarget(dataMap[d]?.[key]);if(t!==”-”)return t;}return “-”;};

```
/* COLUMNS */
const cols=[
  {title:"Metric",dataIndex:"metric",width:260,fixed:"left",render:text=><span style={{fontWeight:500,fontSize:13}}>{text}</span>},
  {title:"Target",dataIndex:"target",width:90,align:"center"},
  ...dates.map(date=>({
    title:date,dataIndex:date,align:"center",
    render:(val,record)=>{
      const raw=dataMap[date]?.[record.key];
      const cellColor=getCellColor(raw);
      const isEmpty=val===null||val===undefined||val===""||val==="-";
      const bg=isEmpty?"#f8fafc":cellColor?colorToTint(cellColor,0.18):"#f0fdf4";
      return(
        <div style={{background:bg,padding:"4px 6px",borderRadius:4,textAlign:"center",fontSize:12,color:isEmpty?"#94a3b8":"#1e293b"}}>
          {isEmpty?"-":val}
        </div>
      );
    },
  })),
];
setColumns(cols);

/* ROWS */
const rows=activeKeys.map(key=>{
  const row={key,metric:key,target:getMetricTarget(key)};
  dates.forEach(date=>{row[date]=getCellDisplay(dataMap[date]?.[key]);});
  return row;
});
setAllTableRows(rows);

/* TILES */
const graphDates=currentViewBy==="day"?dates:dates.slice(-12);
const tiles=activeKeys.filter(key=>hasRealValue(key,dates,dataMap)).map(key=>{
  let tileValue=getOverall(tileObj?.[key]);
  if(tileValue===null){for(let i=dates.length-1;i>=0;i--){const v=getOverall(dataMap[dates[i]]?.[key]);if(v!==null){tileValue=v;break;}}}
  let color=getColor(tileObj?.[key]);
  if(!color||color==="#94a3b8"){for(const d of dates){const c=getColor(dataMap[d]?.[key]);if(c&&c!=="#94a3b8"){color=c;break;}}}
  let target=getTarget(tileObj?.[key]);
  if(target==="-") target=getMetricTarget(key);
  const series=graphDates.map(d=>{
    const raw=dataMap[d]?.[key];
    const v=getOverall(raw);
    return{value:v!==null&&!isNaN(Number(v))?Number(v):null,color:getColor(raw)||color};
  });
  const sampleRaw=tileObj?.[key]??dataMap[dates[dates.length-1]]?.[key];
  const overallStr=String(extractField(sampleRaw,"Overall")??sampleRaw??"");
  const unit=overallStr.includes("%")?"%":"";
  const contractual=dates.some(d=>getBoolFlag(dataMap[d]?.[key],"Contractual"));
  const bonus=dates.some(d=>getBoolFlag(dataMap[d]?.[key],"Bonus and Penalty"));
  const bonusQ=dates.some(d=>getBoolFlag(dataMap[d]?.[key],"Bonus Qualifier"));
  const flat=!dates.some(d=>isNested(dataMap[d]?.[key]));
  const currentMonthStatus=extractField(tileObj?.[key],"current_month_status")??null;
  return{key,label:key,color,unit,value:tileValue,target,series,dates:graphDates,viewBy:currentViewBy,contractual,bonus,bonusQ,flat,currentMonthStatus};
});
setAllTileData(tiles);
setShowAllTiles(false);
```

};

/* FILTER LOGIC */
const tableData=useMemo(()=>{
if(!contractualOn&&!bonusOn&&!bonusQOn) return allTableRows;
return allTableRows.filter(r=>metricPassesToggle(r.key,chartDates,chartDataMap,contractualOn,bonusOn,bonusQOn));
},[contractualOn,bonusOn,bonusQOn,allTableRows,chartDates,chartDataMap]);

const filteredTiles=useMemo(()=>{
if(!contractualOn&&!bonusOn&&!bonusQOn) return allTileData;
return allTileData.filter(t=>{
if(t.flat) return true;
if(contractualOn&&!t.contractual) return false;
if(bonusOn&&!t.bonus) return false;
if(bonusQOn&&!t.bonusQ) return false;
return true;
});
},[contractualOn,bonusOn,bonusQOn,allTileData]);

const visibleTiles=showAllTiles?filteredTiles:filteredTiles.slice(0,TILES_INITIAL);
const hasMore=filteredTiles.length>TILES_INITIAL;

const updateMultiFilter=(key,val)=>{
let next=val;
if(val.length>1&&val[val.length-1]!==“ALL”) next=val.filter(v=>v!==“ALL”);
else if(val.includes(“ALL”)&&val[val.length-1]===“ALL”) next=[“ALL”];
if(!next.length) next=[“ALL”];
setFilters(p=>({…p,[key]:next}));
};

/* ════════════════════════════════════════════════════════════
RENDER
════════════════════════════════════════════════════════════*/
return(
<>
{loading&&<LoaderOverlay show={loading}/>}
<div style={{padding:“4px 0”,opacity:loading?0.5:1}}>
<style>{`/* ── selects inside dark panel ── */ .kpi-filter-row .ant-select-selector{ background:#fff !important; border-color:#334155 !important; height:32px !important; min-height:32px !important; padding:0 10px !important; display:flex !important; align-items:center !important; font-size:13px !important; border-radius:6px !important; } .kpi-filter-row .ant-select:not(.ant-select-multiple) .ant-select-selection-item, .kpi-filter-row .ant-select:not(.ant-select-multiple) .ant-select-selection-placeholder{ line-height:30px !important; font-size:13px !important; color:#1e293b !important; } .kpi-filter-row .ant-select-selection-overflow{ flex-wrap:nowrap; overflow:hidden; height:30px; align-items:center; } .kpi-filter-row .ant-select-selection-item{ height:22px !important; line-height:20px !important; font-size:12px !important; background:#e2e8f0 !important; border-color:#cbd5e1 !important; color:#1e293b !important; border-radius:4px !important; padding:0 6px !important; display:flex !important; align-items:center !important; } .kpi-filter-row .ant-select-selection-item-remove{ color:#64748b !important; font-size:10px !important; margin-left:3px !important; } .kpi-filter-row .ant-select-arrow{color:#64748b !important;} /* ── table ── */ .ant-table-thead>tr>th{ background:#1e3a5f !important; color:#fff !important; font-weight:600; font-size:12px; } /* ── tile card ── */ .kpi-tile-card{ background:#fff; border-radius:12px; box-shadow:0 1px 8px rgba(0,0,0,0.08); padding:16px 16px 14px 16px; box-sizing:border-box; display:flex; flex-direction:column; flex:1; min-width:0; }`}</style>

```
    {/* ════ FILTER PANEL — dark navy card (Figma) ═════════*/}
    <div className="kpi-filter-row" style={{
      background:"#0f172a", borderRadius:14,
      padding:"18px 20px", marginBottom:16,
    }}>
      {/* ROW 1: Year + Month  |  Toggles  |  View By */}
      <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:16,flexWrap:"nowrap"}}>

        {viewBy!=="week"&&(
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            <span style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"1px",textTransform:"uppercase"}}>Year</span>
            <Select value={filters.year} style={{width:110}}
              popupMatchSelectWidth={false} styles={{popup:{minWidth:100}}}
              onChange={v=>setFilters(p=>({...p,year:v}))}>
              {(filterOptions.year||[]).map(v=><Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        )}

        {viewBy==="day"&&(
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            <span style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"1px",textTransform:"uppercase"}}>Month</span>
            <Select value={filters.month} style={{width:130}}
              popupMatchSelectWidth={false} styles={{popup:{minWidth:140}}}
              onChange={v=>setFilters(p=>({...p,month:v}))}>
              {(filterOptions.month||[]).map(v=><Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        )}

        {/* spacer */}
        <div style={{flex:1}}/>

        {/* TOGGLES */}
        {[
          {label:"Contractual",    val:contractualOn, set:setContractualOn},
          {label:"Bonus & Penalty",val:bonusOn,       set:setBonusOn},
          {label:"Bonus Qualifier",val:bonusQOn,      set:setBonusQOn},
        ].map(({label,val,set})=>(
          <div key={label} onClick={()=>set(p=>!p)}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer",userSelect:"none"}}>
            <span style={{fontSize:11,fontWeight:700,color:val?"#60a5fa":"#64748b",whiteSpace:"nowrap",letterSpacing:"0.3px"}}>{label}</span>
            <div style={{width:36,height:20,borderRadius:10,background:val?"#3b82f6":"#334155",position:"relative",transition:"background 0.2s",flexShrink:0}}>
              <div style={{position:"absolute",top:3,left:val?18:3,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}}/>
            </div>
          </div>
        ))}

        {/* VIEW BY */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
          <span style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"1px",textTransform:"uppercase"}}>View By</span>
          <div style={{display:"flex",background:"#1e293b",borderRadius:8,padding:3,gap:2}}>
            {["Day","Week","Month"].map(lbl=>{
              const val=lbl.toLowerCase(),active=viewBy===val;
              return(
                <div key={val} onClick={()=>setViewBy(val)} style={{
                  padding:"5px 16px",cursor:"pointer",fontSize:13,fontWeight:700,
                  background:active?"#3b82f6":"transparent",
                  color:active?"#fff":"#94a3b8",
                  borderRadius:6,transition:"all 0.2s",whiteSpace:"nowrap",
                }}>{lbl}</div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROW 2: dropdown filters */}
      <div style={{display:"flex",gap:14,flexWrap:"nowrap",alignItems:"flex-end"}}>
        {[
          {label:"GEO",       key:"geo",          opts:filterOptions.geo||[]},
          {label:"JC",        key:"program",      opts:filterOptions.program||[]},
          {label:"LOB",       key:"lob",          opts:filterOptions.lob||[]},
          {label:"SUPERVISOR",key:"supervisor",   opts:filterOptions.supervisor||[]},
          {label:"TENURE",    key:"tenure_units", opts:filterOptions.tenure_units||filterOptions.tenure_unit||[]},
        ].map(({label,key,opts})=>(
          <div key={key} style={{display:"flex",flexDirection:"column",gap:5,flex:1,minWidth:0}}>
            <span style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"1px",textTransform:"uppercase"}}>{label}</span>
            <Select mode="multiple" value={filters[key]}
              style={{width:"100%"}} popupMatchSelectWidth={false}
              styles={{popup:{minWidth:180}}} maxTagCount="responsive"
              onChange={v=>updateMultiFilter(key,v)}>
              {opts.map(v=><Option key={v} value={v}>{v}</Option>)}
            </Select>
          </div>
        ))}
      </div>
    </div>

    {/* error */}
    {error&&(
      <div style={{marginBottom:12,padding:"10px 16px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,color:"#dc2626",fontSize:13,display:"flex",alignItems:"center",gap:8}}>
        <span>⚠️</span>{error}
      </div>
    )}

    {/* ════ TILES — 2×3 grid + show more/less ════════════*/}
    {filteredTiles.length>0&&(
      <div style={{marginBottom:20}}>
        {/* grid */}
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(3,1fr)",
          gap:14,
          marginBottom:12,
        }}>
          {visibleTiles.map(tile=>renderKpiCard(tile))}
          {/* fill last row if odd */}
          {visibleTiles.length%3!==0&&Array.from({length:3-visibleTiles.length%3}).map((_,i)=>(
            <div key={"pad"+i}/>
          ))}
        </div>

        {/* Show more / Show less */}
        {hasMore&&(
          <div style={{display:"flex",justifyContent:"center"}}>
            <button onClick={()=>setShowAllTiles(p=>!p)} style={{
              padding:"8px 28px",borderRadius:20,
              border:"1.5px solid #3b82f6",
              background:"#fff",color:"#3b82f6",
              fontSize:13,fontWeight:700,cursor:"pointer",
              display:"flex",alignItems:"center",gap:6,
              transition:"all 0.2s",
            }}
              onMouseEnter={e=>{e.currentTarget.style.background="#eff6ff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="#fff";}}>
              {showAllTiles?(
                <><LeftOutlined style={{fontSize:11}}/> Show Less</>
              ):(
                <>Show More <RightOutlined style={{fontSize:11}}/></>
              )}
            </button>
          </div>
        )}
      </div>
    )}

    {/* ════ TABLE ══════════════════════════════════════════*/}
    <div style={{minHeight:120}}>
      {tableLoading?(
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 0",background:"#fff",borderRadius:10,boxShadow:"0 1px 8px rgba(0,0,0,0.06)"}}>
          <Spin size="large" tip="Loading data..."/>
        </div>
      ):(
        <Table
          columns={columns} dataSource={tableData}
          pagination={false} bordered size="small"
          scroll={{x:"max-content",y:320}} rowKey="key"
        />
      )}
    </div>
  </div>
</>
```

);

/* ════════════════════════════════════════════════════════════
renderKpiCard — Figma style
════════════════════════════════════════════════════════════*/
function renderKpiCard(tile){
const{label,color,unit,value,target,series,dates:gdates,viewBy:tileViewBy,currentMonthStatus}=tile;
const display=(value===null||value===undefined)?”–”:value;
const targetNum=parseFloat(String(target).replace(”%”,””));
const valueNum=typeof display===“number”?display:parseFloat(String(display).replace(”%”,””));
const barPct=(!isNaN(targetNum)&&!isNaN(valueNum)&&targetNum>0)?Math.min((valueNum/targetNum)*100,100):0;

```
const cleanSeries=series.map(pt=>({
  value:pt.value!==null&&!isNaN(Number(pt.value))?Number(pt.value):null,
  color:pt.color||color,
}));
const validNums=cleanSeries.filter(pt=>pt.value!==null).map(pt=>pt.value);
const hasGraph=validNums.length>0;
const maxVal=hasGraph?Math.max(...validNums):0;
const scaleMax=maxVal>0?Math.ceil(maxVal/10)*10:10;
const GRAPH_H=70;
const targetLinePct=(!isNaN(targetNum)&&targetNum>0&&scaleMax>0)?Math.min((targetNum/scaleMax)*100,100):null;

return(
  <div className="kpi-tile-card" key={label}>

    {/* TITLE */}
    <div style={{fontSize:12,fontWeight:700,color:"#475569",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginBottom:6}} title={label}>
      {label}
    </div>

    {/* ABOVE/BELOW + TARGET */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
      <div style={{display:"flex",gap:10}}>
        {[["#22c55e","Above"],["#ef4444","Below"]].map(([c,lbl])=>(
          <span key={lbl} style={{fontSize:10,color:"#64748b",display:"flex",alignItems:"center",gap:3}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>
            {lbl}
          </span>
        ))}
      </div>
      {target!=="-"&&(
        <span style={{fontSize:11,fontWeight:700,color:"#64748b"}}>Target: <span style={{color}}>{target}</span></span>
      )}
    </div>

    {/* VALUE */}
    <div style={{fontSize:32,fontWeight:800,color,lineHeight:1,marginBottom:6}}>
      {display}{display!=="--"&&unit?` ${unit}`:""}
    </div>

    {/* TARGET PROGRESS BAR */}
    <div style={{height:4,background:"#f1f5f9",borderRadius:2,marginBottom:8,overflow:"hidden"}}>
      <div style={{width:`${barPct}%`,background:color,height:"100%",borderRadius:2}}/>
    </div>

    {/* GRAPH */}
    <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      {hasGraph?(
        <>
          <div style={{display:"flex",alignItems:"flex-end",gap:3}}>
            {/* Y AXIS */}
            <div style={{display:"flex",flexDirection:"column",justifyContent:"space-between",height:GRAPH_H,flexShrink:0,marginRight:4,minWidth:26,textAlign:"right"}}>
              <span style={{fontSize:10,fontWeight:600,color:"#94a3b8",lineHeight:1}}>{scaleMax}</span>
              <span style={{fontSize:10,fontWeight:600,color:"#94a3b8",lineHeight:1}}>{Math.round(scaleMax/2)}</span>
              <span style={{fontSize:10,fontWeight:600,color:"#94a3b8",lineHeight:1}}>0</span>
            </div>

            {/* BARS */}
            <div style={{flex:1,height:GRAPH_H,position:"relative",display:"flex",alignItems:"flex-end",gap:1.5,overflow:"hidden"}}>
              {cleanSeries.map((pt,i)=>{
                const barH=pt.value!==null?Math.max((pt.value/scaleMax)*GRAPH_H,2):0;
                // green = above/at target, red = below target (Figma style)
                const barColor=pt.value!==null&&!isNaN(targetNum)
                  ?(pt.value>=targetNum?"#22c55e":"#ef4444")
                  :(pt.color||color);
                return(
                  <div key={i} title={pt.value!==null?`${pt.value}${unit}`:"No data"} style={{
                    flex:1,height:barH,
                    background:pt.value!==null?barColor:"transparent",
                    borderRadius:"2px 2px 0 0",
                    transition:"height 0.3s",
                    minWidth:1.5,
                  }}/>
                );
              })}
              {/* target dotted line */}
              {targetLinePct!==null&&(
                <div style={{
                  position:"absolute",left:0,right:0,
                  bottom:`${targetLinePct}%`,
                  borderTop:"1.5px dashed #94a3b8",
                  opacity:0.8,pointerEvents:"none",zIndex:2,
                }}/>
              )}
            </div>
          </div>

          {/* X AXIS */}
          <div style={{display:"flex",paddingLeft:30,marginTop:4}}>
            {gdates.map((d,i)=>{
              const vb=tileViewBy||viewBy;
              const lbl=xAxisLabel(d,i,gdates.length,vb);
              const show=vb==="day"?(lbl!==""&&(gdates.length<=10||i%Math.ceil(gdates.length/10)===0)):
                (gdates.length<=6||i%2===0);
              return(
                <span key={String(d)} style={{flex:1,textAlign:"center",fontSize:9,fontWeight:600,color:"#94a3b8",whiteSpace:"nowrap",overflow:"visible"}}>
                  {show?lbl:""}
                </span>
              );
            })}
          </div>
        </>
      ):(
        <div style={{height:GRAPH_H+20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#cbd5e1"}}>No Data</div>
      )}
    </div>

    {/* CURRENT MONTH STATUS */}
    <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid #f1f5f9"}}>
      <span style={{fontSize:11,color:"#94a3b8"}}>Current Month: </span>
      <span style={{fontSize:11,fontWeight:700,color:
        currentMonthStatus==="Meeting Target"?"#22c55e":
        currentMonthStatus==="Not Meeting Target"?"#ef4444":"#cbd5e1"}}>
        {currentMonthStatus||"—"}
      </span>
    </div>
  </div>
);
```

}
}
