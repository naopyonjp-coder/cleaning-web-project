'use strict';
const ITEM_KEYS=['mouth','slippers','kids','toothbrush','shaver','cotton','showerCap','hairbrush','bathrobe','samue','towel'];
function integerOrUnknown(value,blankIsZero=false){
  if(value===''||value===null||value===undefined) return blankIsZero?0:null;
  const s=String(value);return /^\d+$/.test(s)&&Number.isSafeInteger(Number(s))?Number(s):null;
}
function officialQuantities(room){
  const p={};for(const k of ['big','mid','small','infant'])p[k]=integerOrUnknown(room[k],true);
  const known=Object.values(p).every(n=>n!==null);
  const amenity=room.const>=2&&room.const<=4?2:room.const>=5&&room.const<=6?3:null;
  const inYes=room.in==='○';
  const inNone=room.in==='－';
  return {people:p,items:{mouth:inYes&&known?p.big+p.mid+p.small:inNone?room.const:null,
    slippers:inYes&&known?p.big+p.mid+p.small+p.infant:inNone?room.const:null,
    kids:known?p.mid+p.small+p.infant:null,toothbrush:room.const,
    shaver:amenity,cotton:amenity,showerCap:amenity,hairbrush:amenity,bathrobe:amenity,
    samue:room.const,towel:room.const}};
}
function confirmedQuantities(room){
  const calc=officialQuantities(room);const overrides=room.overrides||{};
  const items={};for(const k of ITEM_KEYS)items[k]=Object.prototype.hasOwnProperty.call(overrides,k)?integerOrUnknown(overrides[k]):calc.items[k];
  // Towel follows samue unless explicitly corrected by a person.
  if(!Object.prototype.hasOwnProperty.call(overrides,'towel'))items.towel=items.samue;
  return {people:calc.people,items};
}
if(typeof module!=='undefined')module.exports={ITEM_KEYS,integerOrUnknown,officialQuantities,confirmedQuantities};
