// arcade.js — топ-даун аркада 90-х со Слатислатом. Чистый Canvas, без сборки.

// ===== helpers =====
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const now = () => performance.now();
const rand = (a,b)=> a + Math.random()*(b-a);

// ===== input =====
const Keys = { left:false,right:false,up:false,down:false, attack:false, dash:false, interact:false, pause:false };

function hookKeyboard(){
  window.addEventListener('keydown', (e)=>{
    if (['ArrowLeft','a','A'].includes(e.key)) Keys.left = true;
    if (['ArrowRight','d','D'].includes(e.key)) Keys.right = true;
    if (['ArrowUp','w','W'].includes(e.key)) Keys.up = true;
    if (['ArrowDown','s','S'].includes(e.key)) Keys.down = true;
    if (['j','J'].includes(e.key)) Keys.attack = true;
    if (['k','K'].includes(e.key)) Keys.dash = true;
    if (['e','E'].includes(e.key)) Keys.interact = true;
    if (['p','P'].includes(e.key)) Keys.pause = !Keys.pause;
  });
  window.addEventListener('keyup', (e)=>{
    if (['ArrowLeft','a','A'].includes(e.key)) Keys.left = false;
    if (['ArrowRight','d','D'].includes(e.key)) Keys.right = false;
    if (['ArrowUp','w','W'].includes(e.key)) Keys.up = false;
    if (['ArrowDown','s','S'].includes(e.key)) Keys.down = false;
    if (['j','J'].includes(e.key)) Keys.attack = false;
    if (['k','K'].includes(e.key)) Keys.dash = false;
    if (['e','E'].includes(e.key)) Keys.interact = false;
  });
}

// ===== geometry =====
class Rect {
  constructor(x,y,w,h){ this.x=x; this.y=y; this.w=w; this.h=h; }
  intersects(o){ return !(this.x+this.w<o.x || this.x>o.x+o.w || this.y+this.h<o.y || this.y>o.y+o.h); }
}

// ===== entities =====
class Player {
  constructor(x,y){
    this.x=x; this.y=y; this.w=10; this.h=12;
    this.speed=0.085; this.dashPower=0.35; this.dashCd=700; this._lastDash= -9999;
    this.dir = {x:1,y:0};
    this.attackCd=300; this._lastAtk=-9999; this.attackRange=16;
    this.hp=3; this.invul=0;
    this.bark=0; // береста
    this.kills=0;
  }
  rect(){ return new Rect(this.x-5,this.y-6,this.w,this.h); }
  canDash(t){ return t - this._lastDash > this.dashCd; }
  canAttack(t){ return t - this._lastAtk > this.attackCd; }
}

class Enemy {
  constructor(x,y,type='taxman'){
    this.x=x; this.y=y; this.w=10; this.h=10;
    this.type=type; this.hp = (type==='boss'? 6 : 2);
    this.speed= (type==='guard'? 0.055 : 0.045);
    this.hitCd=700; this._lastHit=-9999;
    this.enrage=false;
  }
  rect(){ return new Rect(this.x-5,this.y-5,this.w,this.h); }
}

class Bark {
  constructor(x,y){ this.x=x; this.y=y; this.r=4; this.collected=false; }
  rect(){ return new Rect(this.x-4,this.y-4,8,8); }
}

class Trigger {
  constructor(x,y,w,h,id){ this.area=new Rect(x,y,w,h); this.id=id; this.done=false; }
}

// ===== world =====
const World = {
  width: 320, height: 180,
  walls: [],
  enemies: [],
  barks: [],
  triggers: [],
};

function buildWalls(){
  World.walls = [
    // границы
    new Rect(
