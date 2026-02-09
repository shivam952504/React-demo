const normalizeJobCodes = (values = []) => {
  if (values.length === 0) return ["ALL"];

  // If ALL is selected with others → remove ALL
  if (values.includes("ALL") && values.length > 1) {
    return values.filter(v => v !== "ALL");
  }

  return values;
};

const cacheKey = `${clientSlug}_${[...jobCodes].sort().join(",")}`;

<Select
  mode="multiple"
  allowClear
  style={{ width: 220 }}
  value={jobCodes}
  placeholder="Select Job Codes"
  onChange={(values) => setJobCodes(normalizeJobCodes(values))}
>
  <Option value="ALL">All Job Codes</Option>
  {data?.job_codes?.map(code => {
    const value = String(code);
    return (
      <Option key={value} value={value}>
        {value}
      </Option>
    );
  })}
</Select>
