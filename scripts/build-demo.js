'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const {confirmedQuantities}=require('../src/rules');

function makeDemo() {
  // Only room inventory is read. Never read private/original or operational data.
  const inventory = JSON.parse(fs.readFileSync(path.join(root, 'data/rooms.json'), 'utf8'));
  const data = {};
  for (const [id, building] of Object.entries(inventory)) {
    const rooms = building.rooms.map((room, i) => {
      const active = i % 4 !== 0;
      const big = active ? 1 : 0;
      const mid = active && room.const >= 4 && i % 3 === 0 ? 1 : 0;
      const small = active && room.const >= 4 && i % 3 === 1 ? 1 : 0;
      const infant = active && room.const >= 4 && i % 3 === 2 ? 1 : 0;
      const mouth = active ? big + mid + small : room.const;
      const kids = mid + small + infant;
      const notes = [];
      const items=confirmedQuantities({...room,in:active?'○':'－',big,mid,small,infant}).items;
      if (!active) notes.push('N.C（テスト）');
      if (i === 1) notes.push('CK');
      if (i === 2) notes.push('PD');
      if (infant) notes.push('ベビーベッド ×1（テスト）');
      if (kids) notes.push(`子供セット×${kids}`);
      return { room: room.room, type: room.type, const: room.const,
        in: active ? '○' : '－', big, mid, small, infant,
        ...items, notes };
    });
    data[id] = { name: building.name, theme: building.theme, date: '2099/1/1（テスト）',
      summary: { out: rooms.filter(r => r.in === '○').length,
        stay: rooms.filter(r => r.in !== '○').length,
        ck: rooms.filter(r => r.notes.includes('CK')).length }, rooms };
  }
  return data;
}
function makeHtml() {
  const template = fs.readFileSync(path.join(root, 'src/template.html'), 'utf8');
  if (template.split('__DEMO_DATA__').length !== 2) throw new Error('Template must have one data placeholder');
  return template.replace('__RULES_CODE__',fs.readFileSync(path.join(root,'src/rules.js'),'utf8')).replace('__DEMO_DATA__', JSON.stringify(makeDemo()));
}
if (require.main === module) {
  const html = makeHtml();
  if (process.argv.includes('--check')) {
    for (const file of ['index.html', 'docs/index.html']) {
      if (fs.readFileSync(path.join(root, file), 'utf8') !== html) throw new Error(`${file}: regenerate test data`);
    }
    console.log('OK: both public HTML files exactly match generated test data');
  } else {
    fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
    for (const file of ['index.html', 'docs/index.html']) fs.writeFileSync(path.join(root, file), html);
    fs.writeFileSync(path.join(root, 'docs/.nojekyll'), '');
    console.log('Built test-only index.html and docs/index.html');
  }
}
module.exports = { makeDemo, makeHtml };
