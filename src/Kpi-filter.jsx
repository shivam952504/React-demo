const defaultFilterPayload = {
  year_type: "Calendar Year",
  year: 0,
  month: "ALL",
  geo: "ALL",
  client_name: "ALL",
  program: "ALL",
  lob: "ALL",
  supervisor: "ALL",
  tenure_unit: "days",
  tenure_lower: 0,
  tenure_upper: 0
};

axios.post(API_BASE + getFilterEndpoint(), defaultFilterPayload)
.then(res=>{
  setFilterOptions(res.data || {});
});

const payload = {
  year: filters.year,
  year_type: filters.year_type,
  month: filters.month,
  geo: filters.geo,
  client_name: filters.client_name,
  program: filters.program,
  lob: filters.lob,
  supervisor: filters.supervisor,
  tenure_unit: filters.tenure_unit,
  tenure_lower: filters.tenure_lower,
  tenure_upper: filters.tenure_upper
};

.then(res=>{
  const data = res.data || {};

  setFilterOptions(data);

  setFilters({
    year_type: data.year_type?.[0],
    year: data.year?.[0],
    month: data.month?.[0],
    geo: "ALL",
    client_name: "ALL",
    lob: "ALL",
    program: data.program?.[0],
    supervisor: data.supervisor?.[0],
    tenure_unit: data.tenure_unit?.[0],
    tenure_lower: 0,
    tenure_upper: 0
  });
});

const allowAll = ["geo","client_name","lob"];

let options = filterOptions[key] || [];

if (allowAll.includes(key)) {
  options = ["ALL", ...options];
}



