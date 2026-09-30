'use strict';
const assert=require('node:assert/strict');
const {ITEM_KEYS,officialQuantities,confirmedQuantities}=require('../src/rules');
const base={const:4,in:'○',big:'2',mid:'1',small:'',infant:'1'};
assert.deepEqual(officialQuantities(base).people,{big:2,mid:1,small:0,infant:1});
assert.equal(officialQuantities(base).items.mouth,3);
assert.equal(officialQuantities(base).items.slippers,4);
assert.equal(officialQuantities(base).items.kids,2);
for(const capacity of [2,3,4,5,6]){
 for(const status of ['○','－']){
  const v=officialQuantities({...base,const:capacity,in:status}).items;
  assert.equal(v.mouth,status==='○'?3:capacity);
  assert.equal(v.slippers,status==='○'?4:capacity);
  for(const k of ['shaver','cotton','showerCap','hairbrush','bathrobe']) assert.equal(v[k],capacity<=4?2:3);
  for(const k of ['toothbrush','samue','towel'])assert.equal(v[k],capacity);
 }
}
assert.equal(officialQuantities({...base,in:''}).items.mouth,null,'unconfirmed in is not no-entry');
assert.equal(officialQuantities({...base,in:''}).items.slippers,null);
assert.equal(officialQuantities({...base,big:'?',infant:''}).items.mouth,null,'unreadable is not zero');
const blank=officialQuantities({...base,big:'',mid:'',small:'',infant:''});
assert.equal(blank.items.mouth,0);assert.equal(blank.items.slippers,0);assert.equal(blank.items.kids,0);
assert.equal(officialQuantities({...base,const:7}).items.shaver,null,'unsupported capacity not inferred');
for(const k of ITEM_KEYS){const r=confirmedQuantities({...base,overrides:{[k]:'9'}});assert.equal(r.items[k],9,'all auto quantities manually editable');}
assert.equal(confirmedQuantities({...base,overrides:{samue:'6'}}).items.towel,6);
assert.equal(confirmedQuantities({...base,overrides:{samue:'6',towel:'7'}}).items.towel,7);
for(const invalid of ['-1','1.5','?','1e2'])assert.equal(confirmedQuantities({...base,overrides:{mouth:invalid}}).items.mouth,null);
// Verify every small count combination, with and without check-in, across capacities.
for(const capacity of [2,3,4,5,6])for(const inValue of ['○','－'])for(let big=0;big<4;big++)for(let mid=0;mid<3;mid++)for(let small=0;small<3;small++)for(let infant=0;infant<3;infant++){
 const v=officialQuantities({const:capacity,in:inValue,big,mid,small,infant}).items;
 assert.equal(v.mouth,inValue==='○'?big+mid+small:capacity);
 assert.equal(v.slippers,inValue==='○'?big+mid+small+infant:capacity);
 assert.equal(v.kids,mid+small+infant);
}
console.log('OK: official counts, blanks, all five amenity constants, all overrides and 1080 count combinations');
