const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const html = fs.readFileSync(require('path').join(__dirname, '..', 'index.html'),'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert(match, 'JavaScript block not found');
const js = match[1];
new vm.Script(js); // JavaScript syntax
const dataMatch = js.match(/const DATA = (\{[^\n]*\});/);
assert(dataMatch, 'DATA missing');
const data = JSON.parse(dataMatch[1]);
assert.strictEqual(data['1'].rooms.length,23);
assert.strictEqual(data['2'].rooms.length,27);
for(const building of ['1','2']){
  const roomIds = new Set();
  for(const r of data[building].rooms){
    assert(!roomIds.has(r.room), `duplicate room ${r.room}`); roomIds.add(r.room);
    assert.strictEqual(r.toothbrush,r.const,`歯ブラシ ${r.room}`);
    assert.strictEqual(r.samue,r.const,`サムエ ${r.room}`);
    assert.strictEqual(r.towel,r.const,`タオル ${r.room}`);
    const mouth = r.in === '○' ? r.big+r.mid+r.small : r.const;
    const slippers = r.in === '○' ? mouth+r.infant : r.const;
    assert.strictEqual(r.mouth,mouth,`お口 ${r.room}`);
    assert.strictEqual(r.slippers,slippers,`スリッパ ${r.room}`);
    const kids=r.mid+r.small+r.infant;
    const kidNote=r.notes.find(n=>n.startsWith('子供セット ×'));
    assert.strictEqual(kidNote, kids?`子供セット ×${kids}`:undefined,`子供セット ${r.room}`);
  }
}
assert(!html.includes('ライフスタッフさん'),'unwanted notice present');
console.log('OK: 50 rooms, counts, calculations, and JS syntax');
