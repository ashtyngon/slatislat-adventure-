/* main.js — 3D arena (voxel vibe), auto-start, mobile joystick, attack/dash.
   No assets, only Three.js. Runs on phones. */

// ---------- Setup ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:false, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); // clamp for phones
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;

// scene & camera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e15);
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 7, 12);

// lighting (cheap for mobile)
scene.add(new THREE.AmbientLight(0x8899aa, 0.7));
const sun = new THREE.DirectionalLight(0xfff3bf, 1.0);
sun.position.set(8, 14, 6);
scene.add(sun);

// helpers
const flat = (c)=> new THREE.MeshStandardMaterial({ color:c, roughness:0.8, metalness:0.0, flatShading:true });

// ---------- Arena ----------
const arena = new THREE.Group();
scene.add(arena);

// floor grid
{
  const floor = new THREE.Mesh(new THREE.BoxGeometry(40, 1, 40), flat(0x1a2436));
  floor.position.y = -0.6;
  arena.add(floor);

  // moat water (simple animated color)
  const waterMat = new THREE.MeshStandardMaterial({ color:0x1f78ff, roughness:0.2, metalness:0.0, flatShading:true, emissive:0x001133, emissiveIntensity:0.8 });
  const moat1 = new THREE.Mesh(new THREE.BoxGeometry(36, 0.2, 4), waterMat); moat1.position.set(0,-0.49,-14);
  const moat2 = moat1.clone(); moat2.position.set(0,-0.49, 14);
  arena.add(moat1, moat2);

  // ring walls (blocks)
  for (let i=0;i<32;i++){
    const angle = (i/32)*Math.PI*2;
    const r = 17;
    const h = 4 + Math.sin(i*0.6)*0.5;
    const b = new THREE.Mesh(new THREE.BoxGeometry(2, h, 2), flat(0x33425b));
    b.position.set(Math.cos(angle)*r, h/2-0.6, Math.sin(angle)*r);
    arena.add(b);
  }
}

// ---------- Prince Slatislav (voxel body) ----------
function makePrince(){
  const g = new THREE.Group();
  // legs
  const legL = new THREE.Mesh(new THREE.BoxGeometry(1.4,2.2,1.4), flat(0x9e6f52)); legL.position.set(-0.8,1.1,0);
  const legR = legL.clone(); legR.position.x = 0.8;
  // torso + “pecs”
  const torso = new THREE.Mesh(new THREE.BoxGeometry(4.2,2.8,2.2), flat(0xc28d6b)); torso.position.set(0,3.3,0);
  const pecLine = new THREE.Mesh(new THREE.BoxGeometry(4.1,0.2,2.21), flat(0x8b5e44)); pecLine.position.set(0,4.1,0);
  // arms
  const armL = new THREE.Mesh(new THREE.BoxGeometry(1.6,2.2,1.6), flat(0xc28d6b)); armL.position.set(-3.1,3.2,0);
  const armR = armL.clone(); armR.position.x = 3.1;
  // belt + kilt
  const belt = new THREE.Mesh(new THREE.BoxGeometry(3.4,0.6,2.2), flat(0x5a2e1f)); belt.position.set(0,2.2,0);
  const kilt = new THREE.Mesh(new THREE.BoxGeometry(3.0,1.1,2.0), flat(0x3d1f14)); kilt.position.set(0,1.4,0);
  // head
  const head  = new THREE.Mesh(new THREE.BoxGeometry(1.9,1.7,1.7), flat(0xc28d6b)); head.position.set(0,5,0);
  // helmet + wings
  const helm  = new THREE.Mesh(new THREE.BoxGeometry(2.3,1.0,1.9), flat(0xb8b8c0)); helm.position.set(0,5.3,0);
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.2,1.0,1.4), flat(0xdedee6)); wingL.position.set(-1.3,5.3,0);
  const wingR = wingL.clone(); wingR.position.x = 1.3;
  // shoulder pads
  const padL = new THREE.Mesh(new THREE.BoxGeometry(1.4,0.8,1.8), flat(0xc9a24a)); padL.position.set(-2.2,4.1,0);
  const padR = padL.clone(); padR.position.x = 2.2;
  // cape (short)
  const cape = new THREE.Mesh(new THREE.BoxGeometry(4.4,3.2,0.4), flat(0x7a1e1e)); cape.position.set(0,3.4,-1.3);

  // sword (right hand)
  const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.3,0.8,0.3), flat(0x74421e)); hilt.position.set(3.6,3.2,0);
  const blade= new THREE.Mesh(new THREE.BoxGeometry(0.3,2.2,0.7), flat(0xc0c7cf)); blade.position.set(3.6,4.3,0);

  // “ball” prop (left hand)
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9,0), flat(0x8f7b6a));
  ball.position.set(-3.6,3.2,0);

  g.add(legL, legR, torso, pecLine, armL, armR, belt, kilt, head, helm, wingL, wingR, padL, padR, cape, hilt, blade, ball);
  g.position.set(0,0,0);
  g.traverse(o=>{o.castShadow=false; o.receiveShadow=false;});
  return g;
}

const prince = makePrince();
scene.add(prince);

// shadow of prince as fake circle (cheap)
const blob = new THREE.Mesh(new THREE.CircleGeometry(1.6, 20), new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:0.35 }));
blob.rotation.x = -Math.PI/2;
blob.position.y = 0.01;
scene.add(blob);

// ---------- Enemies ----------
function makeEnemy(){
  const m = new THREE.Mesh(new THREE.BoxGeometry(1.8,1.8,1.8), flat(0x396c55));
  m.userData = { hp:2, speed:2.1 + Math.random()*0.7 };
  return m;
}
const enemies = [];
function spawnEnemies(n=4){
  for(let i=0;i<n;i++){
    const e = makeEnemy();
    const a = Math.random()*Math.PI*2, R = 10 + Math.random()*4;
    e.position.set(Math.cos(a)*R, 0.9, Math.sin(a)*R);
    scene.add(e); enemies.push(e);
  }
}
spawnEnemies(5);

// ---------- Gameplay state ----------
const input = { x:0, y:0, attack:false, dash:false };
const speed = 4.0;              // m/s
const dashPower = 9.5;          // burst
let dashCd = 0;                 // cooldown ms
let hp = 5;
let score = 0;
let attackTimer = 0;

const healthEl = document.getElementById('health');
const scoreEl  = document.getElementById('score');

function setHP(v){
  hp = Math.max(0, Math.min(5,v));
  healthEl.innerHTML = '';
  for(let i=0;i<hp;i++){
    const h = document.createElement('div');
    h.className = 'heart';
    healthEl.appendChild(h);
  }
}
function addScore(n){ score = Math.max(0, score + n); scoreEl.textContent = 'SCORE: ' + String(score).padStart(6,'0'); }
setHP(5); addScore(0);

// ---------- Input: keyboard ----------
window.addEventListener('keydown', e=>{
  if (e.repeat) return;
  if (e.key==='ArrowLeft' || e.key==='a' || e.key==='A') input.x = -1;
  if (e.key==='ArrowRight'|| e.key==='d' || e.key==='D') input.x =  1;
  if (e.key==='ArrowUp'   || e.key==='w' || e.key==='W') input.y =  1;
  if (e.key==='ArrowDown' || e.key==='s' || e.key==='S') input.y = -1;
  if (e.key==='j' || e.key==='J') input.attack = true;
  if (e.key==='k' || e.key==='K') input.dash = true;
}, {passive:true});
window.addEventListener('keyup', e=>{
  if (['ArrowLeft','a','A','ArrowRight','d','D'].includes(e.key)) input.x = 0;
  if (['ArrowUp','w','W','ArrowDown','s','S'].includes(e.key))   input.y = 0;
  if (e.key==='j' || e.key==='J') input.attack = false;
  if (e.key==='k' || e.key==='K') input.dash = false;
}, {passive:true});

// ---------- Input: touch joystick ----------
const stick = document.getElementById('stick');
const nub   = stick.querySelector('.nub');
let activeId = null;
function setNub(cx, cy){
  const rect = stick.getBoundingClientRect();
  const x = cx - (rect.left + rect.width/2);
  const y = cy - (rect.top  + rect.height/2);
  const max = rect.width*0.4;
  const len = Math.hypot(x,y);
  const nx = (len>0? x/len : 0), ny = (len>0? y/len : 0);
  const clamp = Math.min(len, max);
  nub.style.transform = `translate(${nx*clamp}px, ${ny*clamp}px)`;
  input.x = nx;
  input.y = -ny;
}
stick.addEventListener('pointerdown', (e)=>{ activeId = e.pointerId; stick.setPointerCapture(activeId); setNub(e.clientX,e.clientY); }, {passive:false});
stick.addEventListener('pointermove', (e)=>{ if (e.pointerId===activeId) setNub(e.clientX,e.clientY); }, {passive:false});
stick.addEventListener('pointerup',   (e)=>{ if (e.pointerId===activeId){ activeId=null; nub.style.transform='translate(0,0)'; input.x=0; input.y=0; } }, {passive:false});

document.getElementById('btn-attack').addEventListener('pointerdown', ()=> input.attack=true, {passive:true});
document.getElementById('btn-attack').addEventListener('pointerup',   ()=> input.attack=false, {passive:true});
document.getElementById('btn-dash').addEventListener('pointerdown',   ()=> input.dash=true, {passive:true});
document.getElementById('btn-dash').addEventListener('pointerup',     ()=> input.dash=false, {passive:true});

// ---------- Movement/Camera ----------
const tmpVec = new THREE.Vector3();
let invul = 0;

function update(dt){
  // dash cooldown
  dashCd = Math.max(0, dashCd - dt*1000);
  invul  = Math.max(0, invul  - dt*1000);
  attackTimer = Math.max(0, attackTimer - dt*1000);

  // move
  const dir = new THREE.Vector3(input.x, 0, -input.y);
  const len = dir.length();
  if (len>0){
    dir.normalize();
    let v = speed;
    if (input.dash && dashCd<=0){
      v += dashPower; dashCd = 600; // ms
    }
    prince.position.addScaledVector(dir, v*dt);
    blob.position.set(prince.position.x, 0.01, prince.position.z);
    // face move direction
    prince.rotation.y = Math.atan2(dir.x, dir.z);
  }

  // clamp to arena
  const R = 17.5;
  const r = Math.hypot(prince.position.x, prince.position.z);
  if (r > R) {
    prince.position.multiplyScalar(R / r);
    blob.position.set(prince.position.x, 0.01, prince.position.z);
  }

  // simple camera follow
  tmpVec.set(prince.position.x, 0, prince.position.z);
  camera.position.lerp(new THREE.Vector3(tmpVec.x, 7, tmpVec.z + 10), 0.08);
  camera.lookAt(prince.position.x, 3.2, prince.position.z);

  // attack hitbox (short arc in front)
  if (input.attack && attackTimer<=0){
    attackTimer = 240; // ms
    // detect enemies in cone
    const forward = new THREE.Vector3( Math.sin(prince.rotation.y), 0, Math.cos(prince.rotation.y) );
    for (const e of enemies){
      if (!e.visible) continue;
      const toE = e.position.clone().sub(prince.position);
      const dist = toE.length();
      if (dist < 2.8){
        toE.normalize();
        const dot = forward.dot(toE); // cosine angle
        if (dot > 0.4){ // within arc
          e.userData.hp -= 1;
          if (e.userData.hp<=0){
            e.visible = false;
            addScore(150);
          } else {
            addScore(50);
          }
        }
      }
    }
  }

  // enemy AI: chase + touch damage
  for (const e of enemies){
    if (!e.visible) continue;
    const toP = prince.position.clone().sub(e.position);
    const dist = toP.length();
    if (dist>0.01){
      toP.normalize();
      e.position.addScaledVector(toP, e.userData.speed * dt);
    }
    if (dist < 1.6 && invul<=0){
      setHP(hp-1);
      invul = 700; // ms
      if (hp<=0){ gameOver(); return; }
    }
  }
}

// ---------- Water twinkle ----------
let tAccum = 0;
function animate(time){
  requestAnimationFrame(animate);
  const dt = Math.min(0.033, renderer.info.render.frame > 0 ? (time - animate._last)/1000 : 0.016);
  animate._last = time;

  tAccum += dt;
  // pulsing water emissive
  arena.children.forEach(m=>{
    if (m.material && m.material.emissive){
      m.material.emissiveIntensity = 0.7 + Math.sin(tAccum*3.0)*0.2;
    }
  });

  update(dt);
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

// ---------- Game flow ----------
function gameOver(){
  // reset to quick-retry
  setHP(5);
  addScore(-250); // penalty
  prince.position.set(0,0,0);
  enemies.forEach(e=>{ e.visible = true; e.userData.hp = 2; const a=Math.random()*Math.PI*2, R=10+Math.random()*4; e.position.set(Math.cos(a)*R,0.9,Math.sin(a)*R); });
  invul = 1000;
}

// ---------- Resize ----------
function onResize(){
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  camera.aspect = w/h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize, {passive:true});
