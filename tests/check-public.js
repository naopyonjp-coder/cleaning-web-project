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
const document = { documentElement:{lang:'ja'}, querySelectorAll(){return [];}, addEventListener(){}, getElementById(id) {
  if (!elements.has(id)) {
    const classes = new Set(id === 'home' ? ['active'] : []);
    elements.set(id, { innerHTML: '', className: '', setAttribute(){}, getBoundingClientRect: () => ({ top:600, height:170 }), classList: {
      add: x => classes.add(x), remove: x => classes.delete(x),
      toggle: (x, on) => on ? classes.add(x) : classes.delete(x), contains: x => classes.has(x)
    } });
  }
  return elements.get(id);
} };
let scrollRequest;
const savedLanguage=new Map();
let scheduledDelay;
let scheduledCallback;
const ctx = vm.createContext({ document, setTimeout(fn,delay){scheduledDelay=delay;scheduledCallback=fn;return 1;},clearTimeout(){},
  localStorage:{getItem:key=>savedLanguage.get(key),setItem:(key,value)=>savedLanguage.set(key,value)},
  window: { addEventListener(){},scrollY:0, scrollTo(...args) { scrollRequest=args; }, matchMedia() { return {matches:false}; } } });
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
// UTC/Japan boundary, weekday and year rollover use the Japanese date even on other devices.
assert.equal(vm.runInContext("formatToday(new Date('2026-09-29T15:00:00Z'),'ja')",ctx),'2026年9月30日（水）');
assert.equal(vm.runInContext("formatToday(new Date('2026-09-30T15:00:00Z'),'ja')",ctx),'2026年10月1日（木）');
assert.equal(vm.runInContext("formatToday(new Date('2026-12-31T15:00:00Z'),'ja')",ctx),'2027年1月1日（金）');
assert.equal(vm.runInContext("formatToday(new Date('2026-09-29T15:00:00Z'),'ne')",ctx),'2026 वर्ष 9 महिना 30 गते (बुधबार)');
assert(scheduledDelay>0 && scheduledDelay<=86400100);
vm.runInContext("setLanguage('ne')",ctx);
assert.equal(savedLanguage.get('cleaning-web-language'),'ne');
assert.equal(document.documentElement.lang,'ne');
for(const id of ['1','2']){
  vm.runInContext(`openBuilding('${id}')`,ctx);
  const visible=(document.getElementById('rooms').innerHTML+document.getElementById('headcard').innerHTML).replace(/<[^>]*>/g,'');
  assert(!/[ぁ-んァ-ヶ一-龯A-Za-z]/.test(visible),'Nepali cards must contain no Japanese or Latin labels');
  const numbers=[...document.getElementById('rooms').innerHTML.matchAll(/class="roomno">(\d+)</g)].map(m=>m[1]);
  assert.deepEqual(numbers,data[id].rooms.map(r=>r.room));
}
vm.runInContext("setLanguage('ja')",ctx);
assert.equal(savedLanguage.get('cleaning-web-language'),'ja');
let fakeNow='2026-09-30T14:59:59.000Z';
ctx.Date=class extends Date {constructor(...args){super(...(args.length?args:[fakeNow]));}};
vm.runInContext('updateToday()',ctx);
assert.equal(document.getElementById('today').textContent,'2026年9月30日（水）');
assert.equal(scheduledDelay,1100);
fakeNow='2026-09-30T15:00:00.100Z';
scheduledCallback();
assert.equal(document.getElementById('today').textContent,'2026年10月1日（木）');
savedLanguage.set('cleaning-web-language','ne');
const revisit=vm.createContext({...ctx});
vm.runInContext(script,revisit);
assert.equal(document.documentElement.lang,'ne','saved choice restored on next visit');
const blockedStorage=vm.createContext({...ctx,localStorage:{getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}}});
vm.runInContext(script,blockedStorage);
assert.equal(document.documentElement.lang,'ja','fresh visit defaults to Japanese even when storage is blocked');
vm.runInContext("setLanguage('ne')",blockedStorage);
assert.equal(document.documentElement.lang,'ne');
console.log('OK: test-only publication, all room IDs, navigation and rendering');
