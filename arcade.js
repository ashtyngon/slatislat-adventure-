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
    new Rect(0,0,320,8), new Rect(0,172,320,8), new Rect(0,0,8,180), new Rect(312,0,8,180),
    // препятствия
    new Rect(60,60,28,8), new Rect(120,95,60,8), new Rect(200,40,8,40),
    new Rect(240,120,36,8),
  ];
}

function spawnLevel1(){
  buildWalls();
  World.enemies = [ new Enemy(200,120,'taxman'), new Enemy(100,130,'guard') ];
  World.barks  = [ new Bark(70,30), new Bark(250,150), new Bark(150,50) ];
  World.triggers = [
    new Trigger(140,85,40,10,'cutscene_intro'),
    new Trigger(300,150,12,12,'exit_lvl1'),
  ];
}

// ===== rendering =====
function drawPlayer(ctx,p){
  ctx.save();
  ctx.translate(p.x,p.y);
  // плащ
  ctx.fillStyle = '#8b1d1d'; ctx.fillRect(-7,-8,14,6);
  // торс/«грудь»
  ctx.fillStyle = '#c98f6b'; ctx.fillRect(-5,-6,10,12);
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-5,-1,10,2);
  // голова
  ctx.fillStyle = '#c98f6b'; ctx.fillRect(-3,-10,6,4);
  // меч (по направлению взгляда)
  ctx.rotate(Math.atan2(p.dir.y,p.dir.x));
  ctx.fillStyle = '#c0c7cf'; ctx.fillRect(6,-1,10,2);
  ctx.restore();

  // вспышка атаки
  if (now() - state.player._lastAtk < 120){
    ctx.save(); ctx.translate(p.x,p.y);
    ctx.rotate(Math.atan2(p.dir.y,p.dir.x));
    ctx.fillStyle = 'rgba(255,240,150,0.6)'; ctx.fillRect(10,-3,12,6);
    ctx.restore();
  }
}

function drawEnemy(ctx,e){
  ctx.save(); ctx.translate(e.x,e.y);
  ctx.fillStyle = e.type==='taxman' ? '#3a6' : (e.type==='boss' ? '#b33' : '#568');
  ctx.fillRect(-5,-5,10,10);
  ctx.restore();
}

function drawBark(ctx,b){
  if(b.collected) return;
  ctx.save(); ctx.translate(b.x,b.y);
  ctx.fillStyle = '#d4b483'; ctx.fillRect(-4,-4,8,8);
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(-2,-1,4,2);
  ctx.restore();
}

function drawWorld(ctx){
  // фон
  ctx.fillStyle = '#0b0f16'; ctx.fillRect(0,0,World.width,World.height);
  ctx.fillStyle = '#0f1420';
  for(let y=0;y<World.height;y+=16) for(let x=0;x<World.width;x+=16) ctx.fillRect(x,y,1,1);
  // стены
  ctx.fillStyle = '#394357';
  World.walls.forEach(w => ctx.fillRect(w.x,w.y,w.w,w.h));
}

// ===== state =====
const state = {
  running:false, paused:false,
  player:new Player(40,40),
  last:0,
  ctx:null, canvas:null,
  ui:{ hearts: null, quest:null },
  storyStage: 0, // 0: начало, 1: собери бересту, 2: победи сборщика, 3: выход
};

function updateHUD(){
  state.ui.hearts.textContent = '❤'.repeat(Math.max(0,state.player.hp)).padEnd(3,' ');
  const stageText = [
    'Квест: Войти в берестяной лес',
    'Квест: Собери 3 бересты',
    'Квест: Победи налогового сборщика',
    'Квест: Дойди до выхода и найди Радогоста',
  ][state.storyStage] || '';
  state.ui.quest.textContent = stageText;
}

function collideWalls(r){
  for(const w of World.walls) if (r.intersects(w)) return true;
  return false;
}

// ===== gameplay =====
function movePlayer(dt){
  const p = state.player;
  let vx = (Keys.right ? 1:0) - (Keys.left ? 1:0);
  let vy = (Keys.down ? 1:0) - (Keys.up ? 1:0);

  if (vx!==0 || vy!==0){
    const len = Math.hypot(vx,vy) || 1; vx/=len; vy/=len;
    p.dir.x = vx; p.dir.y = vy;
  }

  let speed = p.speed;
  const t = now();
  if (Keys.dash && p.canDash(t)){
    speed += p.dashPower; p._lastDash = t;
  }

  // X
  let nx = p.x + vx*speed*dt;
  let rx = new Rect(nx-5,p.y-6,p.w,p.h);
  if (!collideWalls(rx)) p.x = nx;

  // Y
  let ny = p.y + vy*speed*dt;
  let ry = new Rect(p.x-5,ny-6,p.w,p.h);
  if (!collideWalls(ry)) p.y = ny;

  // атака
  if (Keys.attack && p.canAttack(t)){ p._lastAtk = t; attack(); }

  // инвулн
  if (p.invul>0) p.invul -= dt;
}

function attack(){
  const p = state.player;
  const hb = new Rect(p.x + p.dir.x*10 -7, p.y + p.dir.y*10 -7, 14, 14);
  for (const e of World.enemies){
    if (e.hp>0 && hb.intersects(e.rect())) e.hp--;
  }
}

function enemiesAI(dt){
  const p = state.player;
  const t = now();
  for (const e of World.enemies){
    if (e.hp<=0) continue;
    const dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.hypot(dx,dy) || 1;
    const vx = dx/d, vy = dy/d;

    let sp = e.speed;
    if (e.type==='boss' && e.hp<=3){ e.enrage = true; sp *= 1.25; }

    e.x += vx*sp*dt; e.y += vy*sp*dt;

    if (e.rect().intersects(p.rect()) && t - e._lastHit > e.hitCd){
      e._lastHit = t;
      if (p.invul<=0){ p.hp--; p.invul = 800; if (p.hp<=0) gameOver(); }
    }
  }
}

function pickups(){
  const p = state.player;
  for (const b of World.barks){
    if (!b.collected && p.rect().intersects(b.rect())){
      b.collected = true; p.bark++;
      toast('Ты сорвал бересту: «Печать письма»');
    }
  }
}

function triggers(){
  const p = state.player;
  for (const tr of World.triggers){
    if (tr.done) continue;
    if (tr.area.intersects(p.rect())){
      if (tr.id==='cutscene_intro' && state.storyStage===0){
        state.storyStage=1;
        toast('Берестяной лес Мурома. «Собери знаки — обретёшь право на меч». Радогост ждёт у опушки.');
        tr.done=true;
      }
      if (tr.id==='exit_lvl1' && state.storyStage>=2 && state.player.bark>=3){
        state.storyStage=3;
        toast('У опушки Радогост: «Князь, в Муроме бесчинствуют сборщики окского сбора». По коням.');
      }
    }
  }
  if (state.storyStage===1 && state.player.bark>=3){
    state.storyStage=2;
    // призовём мини-босса
    World.enemies.push(new Enemy(260,90,'boss'));
    toast('Меч поёт в руках. Найди и победи Старшего Сборщика.');
  }
}

let _toastT=0, _toastMsg='';
function toast(msg){ _toastMsg=msg; _toastT=now(); }

function render(){
  const ctx = state.ctx, p = state.player;
  drawWorld(ctx);
  World.barks.forEach(b => drawBark(ctx,b));
  World.enemies.forEach(e => { if(e.hp>0) drawEnemy(ctx,e); });

  // игрок мигает при инвулнерабилити
  if (p.invul>0) {
    if (Math.floor(now()/100)%2===0) drawPlayer(ctx,p);
  } else {
    drawPlayer(ctx,p);
  }

  // UI-toast
  if (now()-_toastT < 2500){
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(10,140,300,30);
    ctx.fillStyle='#ffe9b0'; ctx.font='8px monospace'; ctx.fillText(_toastMsg, 14, 158);
  }
}

function gameOver(){
  state.running=false;
  toast('Пал Князь… Нажми «Аркадный режим», чтобы начать заново.');
  const q = document.getElementById('quest');
  if (q) q.textContent = 'Князь пал. Перезапусти аркаду.';
}

// ===== loop =====
function tick(ts){
  if (!state.running) return;
  const dt = ts - state.last; state.last = ts;

  if (!Keys.pause){
    movePlayer(dt);
    enemiesAI(dt);
    pickups();
    triggers();
    updateHUD();
    render();
  } else {
    // можно добавить экран паузы
  }
  requestAnimationFrame(tick);
}

// ===== bootstrap =====
function startArcade(){
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('No canvas#game');
  const ctx = canvas.getContext('2d');
  state.canvas = canvas; state.ctx = ctx;
  state.ui.hearts = document.getElementById('hearts');
  state.ui.quest  = document.getElementById('quest');
  state.player = new Player(40,40);

  spawnLevel1();
  state.storyStage=0; updateHUD();
  document.getElementById('arcade-root').style.display='flex';
  state.running=true; state.last=now();
  requestAnimationFrame(tick);
}

function boot(){
  hookKeyboard();
  const btn = document.getElementById('start-arcade');
  if (btn) btn.addEventListener('click', startArcade);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
