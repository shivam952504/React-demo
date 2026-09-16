There are many things that are still pending.

For example:

Confirmed/current understanding

* Voice/Phone support is in scope.
* Chat/Message support is in scope.
* Clark, Philippines is a Voice/Phone location.
* Hyderabad, India is a Chat/Message location.
* Email support is currently out of scope.
* Employee/Agent information is required.
* WFM data is required.
* Volume data is required.
* KPI calculations are required.
* Historical trends are required.
* Dashboard filtering is required.
* Drill-down is required where permitted.
* Data validation and exception handling are required.
* Access control is required.
* SharePoint is currently expected to be the data-sharing mechanism, subject to approval.

Still pending

The BRD specifically leaves things like these open:

* final LOB list
* LOB/sub-LOB hierarchy
* exact employee master source
* exact KPI formulas
* KPI targets
* Green/Amber/Red thresholds
* Quality calculation
* CSAT requirements
* Line Adherence
* detailed Salesforce/Chat WFM extraction process
* final database/storage architecture
* dashboard hosting
* authentication architecture
* retention period
* security rules
* API/automation possibilities
* Assemble API capability
* Snowflake availability
* future Level AI data
* exact SharePoint structure

This distinction is extremely important when you talk to the client.

Don’t say:

“We will use Azure SQL.”

Say:

“The BRD references an Azure-based architecture, but the final storage architecture is still pending security and data-sharing confirmation.”


Let’s understand the data

Suppose we have one employee:

Employee ID: E10025
Name: Rahul
LOB: Customer Service
Site: Hyderabad
Team: Team A
Manager: Amit

Now different systems provide different pieces of information.

WFM might give:

Employee ID
Date
Scheduled Hours
Login Hours
State
Attendance
Schedule

Amazon Connect might give:

Employee ID
Date
Calls Handled
Talk Time
AHT

Salesforce might give:

Employee ID
Date
Chats Handled
Messages
Handling Time


The problem is that these are separate datasets.

The system needs to bring them together.

  5. Employee Master is extremely important

This section of the BRD is actually one of the most important technical pieces.

The system needs an Employee/Agent database containing things like:
Employee ID
Employee Name
ALOB
Job Code
Program
Vertical
Reporting Person
Senior Manager
Other employee attributes

Think of this as the master mapping table.
for example

Employee ID | Name   | LOB              | Site       | Team | Manager
------------|--------|------------------|------------|------|--------
E001        | Rahul  | Customer Service | Hyderabad  | T01  | Amit
E002        | Neha   | Risk             | Hyderabad  | T02  | Priya
E003        | John   | Customer Service | Clark      | T03  | David
  
Then other data can be connected using Employee ID.

6. Why this mapping matters

Imagine WFM says:

E001 → 8 login hours
and Looker says:
E001 → 120 cases
and Quality says:
E001 → 94% quality

The application can combine them:
E001
 ├── Login Hours = 8
 ├── Cases = 120
 └── Quality = 94%

   Then the dashboard can show:

 Rahul
Customer Service
Hyderabad

Login Hours       8
Cases             120
Quality           94%
Attendance        Present
Productivity      ...

  This is why the BRD mentions Employee/LOB mappings and reconciliation repeatedly.

  7. The WFM data is slightly tricky

The BRD says the current reporting dataset has one employee/day record.

So conceptually:
Employee + Date = one reporting record

for example

E001 | 15-Sep | Available | 8 hrs
E001 | 16-Sep | Available | 7.5 hrs
E001 | 17-Sep | Offline   | ...

  And one of the existing rules is:

Records where State = Offline are removed from the current working dataset.

So your processing layer may eventually have logic similar to:

if record.state == "Offline":
    exclude(record)

But don’t hard-code this blindly yet. The BRD calls these “business rules identified so far”, and final rules still need validation.

