'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { makeDemo } = require('../scripts/build-demo');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'docs/index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const data = JSON.parse(script.match(/const DATA = (\{[^\n]*\});/)[1]);
assert.deepEqual(data, makeDemo(), 'Published data must equal deterministic fictional data');
const inventory = JSON.parse(fs.readFileSync(path.join(root, 'data/rooms.json'), 'utf8'));
for (const id of ['1', '2']) {
  const b = inventory[id];
  assert.deepEqual(Object.keys(b).sort(), ['name', 'rooms', 'theme']);
  assert(data[id].date === '2099/1/1（テスト）');
  for (const r of b.rooms) assert.deepEqual(Object.keys(r).sort(), ['const', 'room', 'type']);
  assert.deepEqual(data[id].rooms.map(r => r.room), b.rooms.map(r => r.room));
}
assert.deepEqual(fs.readdirSync(path.join(root, 'docs')).sort(), ['.nojekyll', 'index.html']);
assert(html.includes('実際の清掃には使用しないでください'));
// Exercise the existing navigation/rendering logic without network or private data.
const elements = new Map();
const document = { getElementById(id) {
  if (!elements.has(id)) {
    const classes = new Set(id === 'home' ? ['active'] : []);
    elements.set(id, { innerHTML: '', className: '', getBoundingClientRect: () => ({ top:600, height:170 }), classList: {
      add: x => classes.add(x), remove: x => classes.delete(x),
      toggle: (x, on) => on ? classes.add(x) : classes.delete(x), contains: x => classes.has(x)
    } });
  }
  return elements.get(id);
} };
let scrollRequest;
const ctx = vm.createContext({ document, window: { scrollY:0, scrollTo(...args) { scrollRequest=args; }, matchMedia() { return {matches:false}; } } });
vm.runInContext(script, ctx);
for (const [id, count] of [['1', 23], ['2', 27]]) {
  vm.runInContext(`openBuilding('${id}')`, ctx);
  assert.equal((document.getElementById('rooms').innerHTML.match(/<article /g) || []).length, count);
  assert(document.getElementById('detail').classList.contains('active'));
  assert(document.getElementById('headcard').innerHTML.includes('2099/1/1（テスト）'));
  assert.deepEqual([...document.getElementById('rooms').innerHTML.matchAll(/id="room-(\d{4})"/g)].map(m=>m[1]), data[id].rooms.map(r=>r.room));
  for (const floor of ['1','2','3','4']) {
    const first=data[id].rooms.find(r=>r.room[1]===floor);
    let measured=false;
    document.getElementById(`room-${first.room}`).getBoundingClientRect=()=>{ measured=true; return {top:600}; };
    vm.runInContext(`jumpToFloor('${floor}')`,ctx);
    assert(measured, `first room selected for building ${id}, floor ${floor}`);
    assert.equal(scrollRequest[0].top,422,'header height plus gap subtracted');
    assert.equal(scrollRequest[0].behavior,'smooth');
  }
}
for (const [room,floor] of [['1127','1'],['1215','2'],['1310','3'],['1405','4']]) assert.equal(vm.runInContext(`roomFloor('${room}')`,ctx),floor);
assert.equal(vm.runInContext("roomFloor('123')",ctx),null);
vm.runInContext('goHome()', ctx);
assert(document.getElementById('home').classList.contains('active'));
assert(!document.getElementById('detail').classList.contains('active'));
console.log('OK: test-only publication, all room IDs, navigation and rendering');
