"""Read the archived XLSX independently and check all deployed rating values."""
from pathlib import Path
import hashlib
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

base=Path(__file__).resolve().parent
meta=json.loads((base/'ratings-update.json').read_text())
if len(sys.argv)!=2:
    raise SystemExit('Usage: python3 validate_workbook.py /path/to/approved-source.xlsx')
source=Path(sys.argv[1])
assert hashlib.sha256(source.read_bytes()).hexdigest()==meta['sourceSha256']
n={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(source) as z:
    shared=[''.join(si.itertext()) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))] if 'xl/sharedStrings.xml' in z.namelist() else []
    workbook=ET.fromstring(z.read('xl/workbook.xml'))
    sheets=workbook.find('m:sheets',n)
    assert sheets[0].get('name')=='Ranked Ratings'
    data=[]
    for row in ET.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//m:sheetData/m:row',n):
        values={}
        for cell in row:
            assert cell.find('m:f',n) is None, 'BLOCKED: source formula requires review'
            value=cell.find('m:v',n)
            text=value.text if value is not None else ''
            if cell.get('t')=='s':text=shared[int(text)]
            if cell.get('t')=='inlineStr':text=''.join(cell.find('m:is',n).itertext())
            values[re.sub(r'\d','',cell.get('r'))]=text
        data.append(values)
assert data.pop(0)==dict(zip('ABCDEF',['Rank','Team','Team ID','TEAM','OFF','DEF']))
assert len(data)==121 and len({r['C'] for r in data})==121
assert [int(r['A']) for r in data]==list(range(1,122))
runtime=json.loads((base/'ratings.json').read_text())
previous=json.loads((base/'history-v206/ratings.json').read_text())
extracted=json.loads((base/'source/approved-ratings.json').read_text())
by={r[1]:r for r in runtime[:121]}
assert len(by)==121 and set(by)=={r['C'] for r in data}
for i,row in enumerate(data):
    triple=[int(row[k]) for k in 'DEF']
    assert all(str(v)==row[k] and 60<=v<=99 for k,v in zip('DEF',triple))
    assert by[row['C']][4:]==triple,(row['C'],triple,by[row['C']][4:])
    assert extracted[i]==dict(rank=int(row['A']),name=row['B'],code=row['C'],TEAM=triple[0],OFF=triple[1],DEF=triple[2])
assert len(runtime)==134 and len({r[1] for r in runtime})==134
assert runtime[121:]==previous[121:]
assert all(r[4:]==[60,60,60] for r in runtime[121:])
assert sum(len(r[4:]) for r in runtime)==402
print('PASS: 121 exact workbook codes, 363 canonical values, 13 fixed FCS profiles, 134 teams / 402 values')
