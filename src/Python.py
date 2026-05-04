# “””
File Layout & Column Validator

Supports: CSV, XLSX, XLS, JSON
Sources:  Frontend upload (local path) | SharePoint (via Office365-REST-Python-Client)

Usage:
validator = FileValidator(layout_config=“layout_config.json”)
result = validator.validate(“path/to/file.xlsx”)
print(result.summary())
“””

import os
import json
import pandas as pd
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime

# ──────────────────────────────────────────────

# 1. LAYOUT CONFIGURATION

# Define your expected schema here (or load from a JSON file).

# Column order does NOT matter — validation is by name only.

# ──────────────────────────────────────────────

DEFAULT_LAYOUT = {
“layout_name”: “Call_Center_KPI_Layout_v1”,
“description”: “Expected schema for KPI dashboard uploads”,
“required_columns”: [
“Agent_ID”,
“Agent_Name”,
“Call_Date”,
“Handle_Time”,
“CSAT_Score”,
“Adherence_Pct”,
],
“optional_columns”: [
“Queue_Name”,
“Supervisor”,
“Bonus_Eligible”,
“Call_Type”,
“Disposition”,
],
“column_types”: {
# Expected dtype categories: “numeric”, “string”, “datetime”, “boolean”
“Agent_ID”:       “string”,
“Agent_Name”:     “string”,
“Call_Date”:      “datetime”,
“Handle_Time”:    “numeric”,
“CSAT_Score”:     “numeric”,
“Adherence_Pct”:  “numeric”,
“Queue_Name”:     “string”,
“Supervisor”:     “string”,
“Bonus_Eligible”: “boolean”,
“Call_Type”:      “string”,
“Disposition”:    “string”,
},
“allow_extra_columns”: True,   # If False, unexpected columns are flagged
“max_null_pct”: 20.0,          # Max % of nulls allowed per required column
}

# ──────────────────────────────────────────────

# 2. VALIDATION RESULT

# ──────────────────────────────────────────────

@dataclass
class ValidationResult:
file_path: str
layout_name: str
validated_at: str = field(default_factory=lambda: datetime.now().isoformat())

```
# Column checks
missing_required: list = field(default_factory=list)
present_required: list = field(default_factory=list)
optional_found: list = field(default_factory=list)
extra_columns: list = field(default_factory=list)

# Type checks
type_mismatches: dict = field(default_factory=dict)   # col -> (expected, actual)

# Quality checks
null_violations: dict = field(default_factory=dict)   # col -> null_pct

# Position info
column_positions: dict = field(default_factory=dict)  # col -> index in file

# Overall
is_valid: bool = False
errors: list = field(default_factory=list)
warnings: list = field(default_factory=list)

def summary(self) -> str:
    lines = [
        "=" * 60,
        f"  FILE VALIDATION REPORT",
        f"  Layout : {self.layout_name}",
        f"  File   : {os.path.basename(self.file_path)}",
        f"  Time   : {self.validated_at}",
        f"  Status : {'✅ VALID' if self.is_valid else '❌ INVALID'}",
        "=" * 60,
    ]

    if self.missing_required:
        lines.append(f"\n❌ Missing Required Columns ({len(self.missing_required)}):")
        for c in self.missing_required:
            lines.append(f"     - {c}")

    if self.present_required:
        lines.append(f"\n✅ Required Columns Present ({len(self.present_required)}):")
        for c in self.present_required:
            pos = self.column_positions.get(c, "?")
            lines.append(f"     - {c}  (position: col #{pos})")

    if self.optional_found:
        lines.append(f"\n🔵 Optional Columns Found ({len(self.optional_found)}):")
        for c in self.optional_found:
            lines.append(f"     - {c}")

    if self.extra_columns:
        lines.append(f"\n⚠️  Extra/Unexpected Columns ({len(self.extra_columns)}):")
        for c in self.extra_columns:
            lines.append(f"     - {c}")

    if self.type_mismatches:
        lines.append(f"\n⚠️  Type Mismatches:")
        for col, (expected, actual) in self.type_mismatches.items():
            lines.append(f"     - {col}: expected={expected}, found={actual}")

    if self.null_violations:
        lines.append(f"\n⚠️  Null % Exceeds Threshold:")
        for col, pct in self.null_violations.items():
            lines.append(f"     - {col}: {pct:.1f}% nulls")

    if self.errors:
        lines.append(f"\n🔴 Errors:")
        for e in self.errors:
            lines.append(f"     - {e}")

    if self.warnings:
        lines.append(f"\n🟡 Warnings:")
        for w in self.warnings:
            lines.append(f"     - {w}")

    lines.append("\n" + "─" * 60)
    lines.append("  NOTE: Column POSITION does not matter — validation")
    lines.append("  matches columns by NAME, not by their index/order.")
    lines.append("─" * 60)

    return "\n".join(lines)
```

# ──────────────────────────────────────────────

# 3. FILE READER  (CSV / XLSX / XLS / JSON)

# ──────────────────────────────────────────────

class FileReader:
“”“Reads a file into a pandas DataFrame regardless of format.”””

```
@staticmethod
def read(file_path: str, sheet_name: str = 0) -> pd.DataFrame:
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".csv":
        return pd.read_csv(file_path)

    elif ext in (".xlsx", ".xlsm"):
        return pd.read_excel(file_path, sheet_name=sheet_name, engine="openpyxl")

    elif ext == ".xls":
        return pd.read_excel(file_path, sheet_name=sheet_name, engine="xlrd")

    elif ext == ".json":
        return pd.read_json(file_path)

    else:
        raise ValueError(
            f"Unsupported file type: '{ext}'. "
            "Supported: .csv, .xlsx, .xlsm, .xls, .json"
        )
```

# ──────────────────────────────────────────────

# 4. SHAREPOINT READER  (optional — install dependency first)

# pip install Office365-REST-Python-Client

# ──────────────────────────────────────────────

class SharePointReader:
“””
Downloads a file from SharePoint into memory, then reads it as a DataFrame.

```
Usage:
    sp = SharePointReader(
        site_url="https://yourorg.sharepoint.com/sites/YourSite",
        username="you@yourorg.com",
        password="your_password"          # Or use token auth (see below)
    )
    df = sp.read("Shared Documents/Reports/kpi_data.xlsx")
"""

def __init__(self, site_url: str, username: str = None, password: str = None):
    self.site_url = site_url
    self.username = username
    self.password = password
    self._ctx = None

def _get_context(self):
    if self._ctx is None:
        try:
            from office365.runtime.auth.user_credential import UserCredential
            from office365.sharepoint.client_context import ClientContext

            credentials = UserCredential(self.username, self.password)
            self._ctx = ClientContext(self.site_url).with_credentials(credentials)
        except ImportError:
            raise ImportError(
                "SharePoint support requires: pip install Office365-REST-Python-Client"
            )
    return self._ctx

def read(self, relative_url: str, sheet_name: int = 0) -> pd.DataFrame:
    """
    relative_url: path relative to site, e.g. "Shared Documents/file.xlsx"
    """
    import io

    ctx = self._get_context()
    file_url = f"{self.site_url}/{relative_url}"
    response = ctx.web.get_file_by_server_relative_url(file_url).execute_query()

    with io.BytesIO() as buf:
        response.download(buf).execute_query()
        buf.seek(0)

        ext = os.path.splitext(relative_url)[1].lower()
        if ext == ".csv":
            return pd.read_csv(buf)
        elif ext in (".xlsx", ".xlsm"):
            return pd.read_excel(buf, sheet_name=sheet_name, engine="openpyxl")
        elif ext == ".xls":
            return pd.read_excel(buf, sheet_name=sheet_name, engine="xlrd")
        elif ext == ".json":
            return pd.read_json(buf)
        else:
            raise ValueError(f"Unsupported SharePoint file type: {ext}")
```

# ──────────────────────────────────────────────

# 5. TYPE CHECKER

# ──────────────────────────────────────────────

class TypeChecker:
“””
Maps pandas dtype to a human-readable category and checks
whether it matches the expected category from layout config.
“””

```
DTYPE_MAP = {
    "int64": "numeric",
    "int32": "numeric",
    "float64": "numeric",
    "float32": "numeric",
    "object": "string",
    "bool": "boolean",
    "datetime64[ns]": "datetime",
    "category": "string",
}

@classmethod
def infer(cls, series: pd.Series) -> str:
    dtype_str = str(series.dtype)

    # Explicit datetime check via pd.to_datetime attempt
    if dtype_str == "object":
        sample = series.dropna().head(20)
        try:
            pd.to_datetime(sample, infer_datetime_format=True)
            # If it doesn't raise, it looks like a datetime
            return "datetime"
        except Exception:
            pass

    return cls.DTYPE_MAP.get(dtype_str, "unknown")

@classmethod
def matches(cls, series: pd.Series, expected: str) -> bool:
    inferred = cls.infer(series)
    # Allow numeric → string (e.g., IDs stored as numbers)
    if expected == "string" and inferred == "numeric":
        return True
    return inferred == expected
```

# ──────────────────────────────────────────────

# 6. MAIN VALIDATOR

# ──────────────────────────────────────────────

class FileValidator:
“””
Validates a file (from frontend or SharePoint) against a layout config.

```
Key behaviour:
- Column NAME matching only — position/order is irrelevant.
- Checks required vs optional columns.
- Checks data types per column.
- Checks null percentages.
- Flags extra columns (configurable).
- Saves layout config as JSON for reuse.
"""

def __init__(self, layout_config: Optional[dict] = None, config_path: Optional[str] = None):
    """
    layout_config : dict with layout definition (use DEFAULT_LAYOUT as template)
    config_path   : path to a JSON file with the layout config (alternative to dict)
    """
    if config_path and os.path.exists(config_path):
        with open(config_path, "r") as f:
            self.layout = json.load(f)
    elif layout_config:
        self.layout = layout_config
    else:
        self.layout = DEFAULT_LAYOUT

def save_layout(self, path: str = "layout_config.json"):
    """Persist the layout config to JSON for future reuse."""
    with open(path, "w") as f:
        json.dump(self.layout, f, indent=2)
    print(f"Layout saved to: {path}")

def validate(self, file_path: str, sheet_name: int = 0) -> ValidationResult:
    """Validate a local file against the layout."""
    result = ValidationResult(
        file_path=file_path,
        layout_name=self.layout.get("layout_name", "Unknown"),
    )

    # ── Read the file ──────────────────────────────────────
    try:
        df = FileReader.read(file_path, sheet_name=sheet_name)
    except Exception as e:
        result.errors.append(f"Cannot read file: {e}")
        return result

    return self._validate_df(df, result)

def validate_sharepoint(
    self,
    sp_reader: SharePointReader,
    relative_url: str,
    sheet_name: int = 0,
) -> ValidationResult:
    """Validate a SharePoint file against the layout."""
    result = ValidationResult(
        file_path=relative_url,
        layout_name=self.layout.get("layout_name", "Unknown"),
    )

    try:
        df = sp_reader.read(relative_url, sheet_name=sheet_name)
    except Exception as e:
        result.errors.append(f"Cannot read SharePoint file: {e}")
        return result

    return self._validate_df(df, result)

def validate_dataframe(self, df: pd.DataFrame, label: str = "DataFrame") -> ValidationResult:
    """Validate a DataFrame that's already loaded (e.g. from a frontend upload handler)."""
    result = ValidationResult(
        file_path=label,
        layout_name=self.layout.get("layout_name", "Unknown"),
    )
    return self._validate_df(df, result)

# ──────────────────────────────────────────
# Internal validation logic
# ──────────────────────────────────────────

def _validate_df(self, df: pd.DataFrame, result: ValidationResult) -> ValidationResult:
    required     = self.layout.get("required_columns", [])
    optional     = self.layout.get("optional_columns", [])
    col_types    = self.layout.get("column_types", {})
    allow_extra  = self.layout.get("allow_extra_columns", True)
    max_null_pct = self.layout.get("max_null_pct", 20.0)

    # Normalise column names for comparison (strip whitespace)
    file_cols        = [c.strip() for c in df.columns.tolist()]
    file_cols_set    = set(file_cols)
    required_set     = set(required)
    optional_set     = set(optional)
    known_set        = required_set | optional_set

    # ── 1. Record actual column positions (name → 1-based index) ──
    result.column_positions = {col: idx + 1 for idx, col in enumerate(file_cols)}

    # ── 2. Required column check ──────────────────────────────────
    result.missing_required = sorted(required_set - file_cols_set)
    result.present_required = sorted(required_set & file_cols_set)

    # ── 3. Optional columns found ─────────────────────────────────
    result.optional_found = sorted(optional_set & file_cols_set)

    # ── 4. Extra/unexpected columns ───────────────────────────────
    extra = file_cols_set - known_set
    result.extra_columns = sorted(extra)
    if extra and not allow_extra:
        result.warnings.append(
            f"Unexpected columns found (allow_extra_columns=False): {sorted(extra)}"
        )

    # ── 5. Type validation (only for present columns) ─────────────
    for col in result.present_required + result.optional_found:
        expected_type = col_types.get(col)
        if expected_type and col in df.columns:
            if not TypeChecker.matches(df[col], expected_type):
                actual_type = TypeChecker.infer(df[col])
                result.type_mismatches[col] = (expected_type, actual_type)

    # ── 6. Null % validation (required columns only) ──────────────
    total_rows = len(df)
    if total_rows > 0:
        for col in result.present_required:
            null_pct = (df[col].isna().sum() / total_rows) * 100
            if null_pct > max_null_pct:
                result.null_violations[col] = round(null_pct, 2)

    # ── 7. Overall validity ───────────────────────────────────────
    has_errors = bool(
        result.missing_required
        or result.errors
        or result.type_mismatches
        or result.null_violations
        or (result.extra_columns and not allow_extra)
    )
    result.is_valid = not has_errors

    return result
```

# ──────────────────────────────────────────────

# 7.  QUICK DEMO / ENTRY POINT

# ──────────────────────────────────────────────

if **name** == “**main**”:
import sys

```
# ── Save the default layout config for future reuse ──
validator = FileValidator(layout_config=DEFAULT_LAYOUT)
validator.save_layout("layout_config.json")

# ── Example 1: Validate a local file ──────────────────
if len(sys.argv) > 1:
    file_path = sys.argv[1]
    print(f"\nValidating: {file_path}")
    result = validator.validate(file_path)
    print(result.summary())

# ── Example 2: Validate from SharePoint ───────────────
# Uncomment and fill in your credentials:
#
# sp = SharePointReader(
#     site_url="https://yourorg.sharepoint.com/sites/YourSite",
#     username="you@yourorg.com",
#     password="your_password"
# )
# result = validator.validate_sharepoint(sp, "Shared Documents/kpi_data.xlsx")
# print(result.summary())

# ── Example 3: Validate a DataFrame already in memory ─
# (e.g. from a FastAPI / Flask upload endpoint)
#
# import io
# contents = await file.read()          # FastAPI UploadFile
# df = pd.read_excel(io.BytesIO(contents))
# result = validator.validate_dataframe(df, label="uploaded_kpi.xlsx")
# print(result.summary())

else:
    # Demo with a synthetic DataFrame when no file is passed
    print("\n── Running demo with synthetic data ──\n")
    demo_data = {
        # Note: columns are in a DIFFERENT order than the layout.
        # Validation will still pass because matching is by NAME.
        "Call_Date":     ["2024-01-01", "2024-01-02", None],
        "CSAT_Score":    [4.5, 3.8, 5.0],
        "Agent_Name":    ["Alice", "Bob", "Carol"],
        "Agent_ID":      ["A001", "A002", "A003"],
        "Handle_Time":   [320, 410, 280],
        "Adherence_Pct": [95.0, 88.5, None],      # 1 null → 33% (will violate)
        "Extra_Column":  ["x", "y", "z"],           # unexpected
    }
    df_demo = pd.DataFrame(demo_data)
    result = validator.validate_dataframe(df_demo, label="demo_dataframe")
    print(result.summary())
```
