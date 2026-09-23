// POWER CRUNCH v2.0.4 — canonical Week 4 ratings + fixed synthetic FCS 60/60/60.
(function(){
const D={
"TEX":[99,99,99,1],"UGA":[98,99,97,2],"MIA":[98,98,98,3],"IU":[97,94,99,4],"TTU":[95,96,95,5],
"MISS":[95,99,91,6],"ALA":[94,99,90,7],"OSU":[94,96,92,8],"USC":[93,99,88,9],"ORE":[93,95,92,10],
"ND":[93,95,91,11],"MICH":[93,90,97,12],"BYU":[92,89,95,13],"TENN":[91,92,90,14],"TA&M":[91,95,87,15],
"IOWA":[90,87,94,16],"OU":[90,84,96,17],"UTAH":[89,90,87,18],"VAN":[88,96,80,19],"WASH":[88,87,89,20],
"UVA":[87,88,85,21],"ILL":[85,87,84,22],"ARIZ":[83,78,88,23],"SMU":[83,75,91,24],"LSU":[83,85,80,25],
"HOU":[82,84,81,26],"MIZ":[82,81,84,27],"LEH":[82,82,81,28],"TCU":[81,76,85,29],"PITT":[81,76,85,30],
"LOU":[81,82,80,31],"GT":[81,75,86,32],"DUKE":[80,75,86,33],"VT":[80,82,77,34],"WAKE":[79,80,78,35],
"PSU":[79,79,78,36],"UCLA":[78,86,71,37],"FLA":[78,83,73,38],"OKST":[78,81,75,39],"NEB":[78,83,73,40],
"CIN":[78,74,82,41],"MSST":[78,77,78,42],"BOISE":[77,84,71,43],"NCSU":[77,77,77,44],"ARMY":[77,78,75,45],
"UK":[77,82,71,46],"TLN":[76,75,77,47],"CAL":[76,77,76,48],"NAVY":[76,71,81,49],"UNC":[76,69,82,50],
"MEM":[76,81,70,51],"ASU":[76,77,74,52],"USF":[75,69,82,53],"MINN":[75,77,73,54],"CLEM":[75,80,70,55],
"MD":[75,75,75,56],"FSU":[75,76,73,57],"AUB":[75,74,75,58],"TLSA":[74,67,82,59],"UCF":[74,69,79,60],
"UConn":[74,77,71,61],"KSU":[74,72,76,62],"KU":[73,69,77,63],"BAY":[73,69,76,64],"UNT":[72,76,69,65],
"WIS":[72,71,74,66],"ARK":[72,68,77,67],"NU":[72,71,73,68],"SYR":[72,72,71,69],"MSU":[72,74,70,70],
"HC":[72,71,72,71],"WVU":[71,73,70,72],"COLO":[71,68,75,73],"NDSU":[71,79,63,74],"STAN":[71,75,66,75],
"ODU":[71,64,77,76],"SC":[71,70,71,77],"FAU":[71,70,71,78],"FRES":[70,62,78,79],"SDSU":[70,62,78,80],
"ECU":[70,66,74,81],"NM":[70,67,73,82],"TEM":[69,65,74,83],"PUR":[69,70,68,84],"ISU":[69,66,71,85],
"MRSH":[69,66,71,86],"PRIN":[69,71,66,87],"TXST":[68,75,62,88],"BC":[68,64,72,89],"UTSA":[68,71,65,90],
"DEL":[68,62,74,91],"WSU":[68,65,70,92],"NIU":[67,67,68,93],"USU":[67,66,69,94],"COLG":[67,71,64,95],
"GAST":[67,73,62,96],"CSU":[66,70,63,97],"RUTG":[66,69,63,98],"PENN":[66,72,60,99],"ORST":[66,64,68,100],
"COR":[66,66,66,101],"BUFF":[65,64,66,102],"UNLV":[65,61,69,103],"SJSU":[64,63,65,104],"AF":[64,64,64,105],
"NEV":[64,64,64,106],"TROY":[64,60,67,107],"HAW":[63,60,66,108],"USM":[63,66,60,109],"UAB":[63,65,60,110],
"LT":[63,65,60,111],"RICE":[62,63,62,112],"HARV":[62,64,60,113],"FIU":[62,60,63,114],"NMSU":[62,60,63,115],
"WYO":[62,62,61,116],"GASO":[61,61,62,117],"MTSU":[61,60,62,118],"UTEP":[60,61,60,119],"CCU":[60,60,60,120],
"YALE":[60,60,60,121]
};
const FCS=new Set(["ARST","CHAR","CP","DUQ","EMU","IDHO","SAC","SUU","TOL","ULL","ULM","WKU","WMU"]);
const seen=new Set(),fcsSeen=new Set();
window.TEAMS=(window.TEAMS||[]).map(row=>{
  const code=row[1];
  if(FCS.has(code)){fcsSeen.add(code);return [row[0],code,60,60,60,row[5],row[6]];}
  const v=D[code];
  if(!v)throw new Error('v2.0.4 missing canonical rating for '+code);
  seen.add(code);
  return [row[0],code,v[0],v[1],v[2],row[5],row[6]];
});
if(seen.size!==121)throw new Error('v2.0.4 canonical coverage mismatch: '+seen.size+'/121');
if(fcsSeen.size!==13)throw new Error('v2.0.4 FCS coverage mismatch: '+fcsSeen.size+'/13');
window.PC_RATING_MAP=D;
window.PC_FCS_CODES=[...FCS];
window.PC_CANONICAL_RANK=Object.fromEntries(Object.entries(D).map(([code,v])=>[code,v[3]]));
window.PC_ENGINE_VERSION='PC-MOBILE-v2.0.4';
window.PC_DATA_VERSION='2026-week4-canonical-ratings-v204-fcs60';
window.PC_MODEL_NAME='Week 4 canonical TEAM/OFF/DEF ratings + FCS 60/60/60 + reciprocal live strength prototypes';
window.PC_RATING_SOURCE='User-supplied 121-team v2.0.4 rating table';
})();