const maxValue = Math.max(...series, 0);

/* create nice rounded scale like figma */
let scaleMax = 100;

if(maxValue > 1000) scaleMax = 2000;
else if(maxValue > 500) scaleMax = 1000;
else if(maxValue > 200) scaleMax = 400;
else if(maxValue > 100) scaleMax = 200;
else if(maxValue > 50) scaleMax = 100;
else scaleMax = 50;

<div style={{fontSize:10,color:"#888",lineHeight:"18px"}}>
0<br/>
{Math.round(scaleMax/2)}<br/>
{scaleMax}
</div>

const h = (v / scaleMax) * 50;
