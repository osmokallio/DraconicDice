const KEY='kcd2DiceTracker.v1';
const colors=['#8b3f32','#2d6a4f','#3c5f8a','#8a6b2d','#704f8a','#9a5a26','#39706b','#8c4562'];
let state={players:[],target:2000,game:null,history:[],theme:'system'};
let selectedDice=[];
let manualScore='';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+Math.random().toString(16).slice(2);
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x)state={...state,...x}}catch{}applyTheme();render()}
function applyTheme(){const dark=state.theme==='dark'||(state.theme==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',dark)}
function addPlayer(){const n=$('playerName').value.trim();if(!n)return;if(state.players.some(p=>p.name.toLowerCase()===n.toLowerCase()))return alert('Samanniminen pelaaja on jo listalla.');state.players.push({id:uid(),name:n,color:colors[state.players.length%colors.length]});$('playerName').value='';save();render()}
function movePlayer(i,d){const j=i+d;if(j<0||j>=state.players.length)return;[state.players[i],state.players[j]]=[state.players[j],state.players[i]];save();render()}
function startGame(){if(state.players.length<2)return alert('Lisää vähintään kaksi pelaajaa.');state.target=+$('target').value;const starter=$('starter').value;state.game={id:uid(),startedAt:new Date().toISOString(),players:state.players.map(p=>({...p,score:0})),active:Math.max(0,state.players.findIndex(p=>p.id===starter)),turnScore:0,turns:[],undo:[],complete:false,winners:[]};save();render()}
function snapshot(){const g=state.game;g.undo.push(JSON.stringify({players:g.players,active:g.active,turnScore:g.turnScore,turns:g.turns,complete:g.complete,winners:g.winners}));if(g.undo.length>50)g.undo.shift()}
function addPoints(v){const g=state.game;if(!g||g.complete)return;v=Number(v);if(!Number.isFinite(v)||v<=0)return;snapshot();g.turnScore+=Math.round(v);save();render()}
function bank(){const g=state.game;if(!g||g.complete||g.turnScore<=0)return;snapshot();const p=g.players[g.active],pts=g.turnScore;p.score+=pts;g.turns.push({n:g.turns.length+1,playerId:p.id,player:p.name,points:pts,bust:false,total:p.score});g.turnScore=0;if(p.score>=state.target)finishGame([p.id]);else g.active=(g.active+1)%g.players.length;save();render()}
function bust(){const g=state.game;if(!g||g.complete)return;snapshot();const p=g.players[g.active];g.turns.push({n:g.turns.length+1,playerId:p.id,player:p.name,points:0,bust:true,total:p.score});g.turnScore=0;g.active=(g.active+1)%g.players.length;save();render()}
function finishGame(ids){const g=state.game;if(g.complete)return;g.complete=true;g.winners=ids?.length?ids:[...g.players].sort((a,b)=>b.score-a.score).filter((p,_,a)=>p.score===a[0].score).map(p=>p.id);state.history.push({id:g.id,date:new Date().toISOString(),target:state.target,players:g.players.map(p=>({id:p.id,name:p.name,score:p.score})),winners:g.winners,turns:g.turns})}
function manualEnd(){if(!state.game||state.game.complete)return;if(!confirm('Lopetetaanko peli nykyisiin pisteisiin?'))return;snapshot();finishGame();save();render()}
function undo(){const g=state.game;if(!g||!g.undo.length)return;const wasComplete=g.complete;const x=JSON.parse(g.undo.pop());if(wasComplete)state.history=state.history.filter(h=>h.id!==g.id);Object.assign(g,x);save();render()}
function newGame(){if(state.game&&!state.game.complete&&!confirm('Nykyinen peli jää kesken. Aloitetaanko uusi?'))return;state.game=null;selectedDice=[];manualScore='';save();render()}

function streakStats(turns,playerId=null){
  const relevant=playerId?turns.filter(t=>t.playerId===playerId):turns;
  let current=0,longest=0,run=0;
  for(const t of relevant){
    if(t.bust){run++;longest=Math.max(longest,run)}else run=0;
  }
  current=run;
  return {current,longest};
}

// Returns the highest valid KCD score that can be formed from dice from ONE roll.
function calcScore(ds){
  if(!ds.length||ds.length>6)return 0;
  const counts=[0,0,0,0,0,0,0]; ds.forEach(d=>counts[d]++);
  const memo=new Map();
  function solve(c){
    const key=c.slice(1).join(''); if(memo.has(key))return memo.get(key);
    let best=0;
    const can=arr=>arr.every(v=>c[v]>0);
    const tryCombo=(arr,pts)=>{if(!can(arr))return;const n=[...c];arr.forEach(v=>n[v]--);best=Math.max(best,pts+solve(n))};
    tryCombo([1,2,3,4,5,6],1500);
    tryCombo([1,2,3,4,5],500);
    tryCombo([2,3,4,5,6],750);
    for(let v=1;v<=6;v++){
      for(let n=3;n<=c[v];n++){const base=v===1?1000:v*100;const next=[...c];next[v]-=n;best=Math.max(best,base*Math.pow(2,n-3)+solve(next))}
    }
    if(c[1]){const n=[...c];n[1]--;best=Math.max(best,100+solve(n))}
    if(c[5]){const n=[...c];n[5]--;best=Math.max(best,50+solve(n))}
    memo.set(key,best);return best;
  }
  return solve(counts);
}
function toggleDie(v){if(selectedDice.length>=6)return;selectedDice.push(v);renderDice()}
function removeLastDie(){selectedDice.pop();renderDice()}
function clearDice(){selectedDice=[];renderDice()}
function renderDice(){const host=$('dice');host.innerHTML='';for(let v=1;v<=6;v++){const b=document.createElement('button');b.className='die';b.textContent=v;b.disabled=selectedDice.length>=6;b.onclick=()=>toggleDie(v);host.appendChild(b)}const s=calcScore(selectedDice);$('calcResult').textContent=selectedDice.length?`${selectedDice.join(' · ')} = ${s} pistettä`:'Valitse nopat';$('useCalc').disabled=s<=0;$('removeDie').disabled=!selectedDice.length}

function openScorePad(){manualScore='';renderScorePad();$('scoreDialog').showModal()}
function renderScorePad(){const value=manualScore?Number(manualScore):0;$('scoreEntry').textContent=value.toLocaleString('fi-FI');$('confirmScore').disabled=value<=0}
function appendScoreDigit(d){if(manualScore.length>=6)return;if(manualScore==='0')manualScore='';manualScore+=d;renderScorePad()}
function backspaceScore(){manualScore=manualScore.slice(0,-1);renderScorePad()}
function clearScore(){manualScore='';renderScorePad()}
function chooseQuickScore(v){manualScore=String(v);renderScorePad()}
function confirmManualScore(){const v=Number(manualScore);if(v>0){addPoints(v);$('scoreDialog').close();manualScore=''}}

function renderPlayers(){const h=$('playerList');h.innerHTML='';state.players.forEach((p,i)=>{const d=document.createElement('div');d.className='player-row';d.innerHTML=`<span class="name">${esc(p.name)}</span><button class="btn move" ${i===0?'disabled':''}>↑</button><button class="btn move" ${i===state.players.length-1?'disabled':''}>↓</button><button class="btn move">✕</button>`;const bs=d.querySelectorAll('button');bs[0].onclick=()=>movePlayer(i,-1);bs[1].onclick=()=>movePlayer(i,1);bs[2].onclick=()=>{state.players.splice(i,1);save();render()};h.appendChild(d)});$('starter').innerHTML=state.players.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');$('startGame').disabled=state.players.length<2}
function renderGame(){
  const g=state.game;if(!g)return;
  const sorted=[...g.players].sort((a,b)=>b.score-a.score);$('scoreboard').innerHTML='';
  g.players.forEach((p,i)=>{
    const rank=sorted.findIndex(x=>x.id===p.id)+1;
    const streak=streakStats(g.turns,p.id);
    const d=document.createElement('div');
    d.className='card p-card '+(i===g.active&&!g.complete?'active ':'')+(g.winners.includes(p.id)?'winner':'');
    d.style.setProperty('--pc',p.color);
    d.innerHTML=`<div class="rank">#${rank}</div><h3>${esc(p.name)}</h3><div class="score">${p.score}</div><div class="muted">${Math.max(0,state.target-p.score)} pistettä tavoitteeseen</div><div class="streak-line ${streak.current?'hot':''}">💥 Bust-putki <strong>${streak.current}</strong> <span class="muted">· pisin ${streak.longest}</span></div>`;
    $('scoreboard').appendChild(d)
  });
  const group=streakStats(g.turns);
  $('groupBust').innerHTML=`Ryhmän bust-putki <strong>${group.current}</strong> <span>· pisin ${group.longest}</span>`;
  $('groupBust').classList.toggle('hot',group.current>0);
  $('activeName').textContent=g.complete?'Peli päättynyt':g.players[g.active].name;
  $('turnScore').textContent=g.turnScore;
  $('bankBtn').disabled=g.turnScore<=0||g.complete;$('bustBtn').disabled=g.complete;$('addBtn').disabled=g.complete;$('undoBtn').disabled=!g.undo.length;
  const wb=$('winnerBanner');
  if(g.complete){const names=g.players.filter(p=>g.winners.includes(p.id)).map(p=>p.name);wb.classList.remove('hidden');wb.innerHTML=`<h2>🏆 ${esc(names.join(', '))}</h2><div>Peli päättyi. Voittopisteet: ${Math.max(...g.players.map(p=>p.score))}</div>`}else wb.classList.add('hidden');
  $('turnLog').innerHTML=[...g.turns].reverse().map(t=>`<div class="log-row"><span>#${t.n}</span><span>${esc(t.player)} ${t.bust?'<span class="bust-tag">BUST</span>':''}</span><strong>${t.points?`+${t.points}`:'0'}</strong></div>`).join('')||'<div class="muted">Ei vielä vuoroja.</div>'
}
function render(){const playing=!!state.game;$('setupView').classList.toggle('hidden',playing);$('gameView').classList.toggle('hidden',!playing);$('target').value=String(state.target);renderPlayers();renderGame();renderDice()}
function showStats(){
  const games=state.history,agg={};let longestGroup=0;
  games.forEach(g=>{
    longestGroup=Math.max(longestGroup,streakStats(g.turns).longest);
    g.players.forEach(p=>{
      agg[p.name]??={games:0,wins:0,points:0,longestBust:0};
      agg[p.name].games++;agg[p.name].points+=p.score;if(g.winners.includes(p.id))agg[p.name].wins++;
      agg[p.name].longestBust=Math.max(agg[p.name].longestBust,streakStats(g.turns,p.id).longest);
    })
  });
  $('statsContent').innerHTML=`<div class="stats-grid"><div class="stat"><span class="muted">Pelejä</span><strong>${games.length}</strong></div><div class="stat"><span class="muted">Vuoroja</span><strong>${games.reduce((a,g)=>a+g.turns.length,0)}</strong></div><div class="stat"><span class="muted">Ryhmän pisin bust-putki</span><strong>${longestGroup}</strong></div></div><h3 style="margin-top:16px">Pelaajat</h3>${Object.entries(agg).sort((a,b)=>b[1].wins-a[1].wins).map(([n,x])=>`<div class="player-row stats-player"><span class="name">${esc(n)}</span><span>${x.wins} voittoa / ${x.games} peliä</span><span>💥 pisin ${x.longestBust}</span></div>`).join('')||'<p class="muted">Ei vielä valmiita pelejä.</p>'}`;
  $('statsDialog').showModal()
}
function exportData(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.download='kcd2-dice-tracker-backup.json';a.click();URL.revokeObjectURL(a.href)}
function importData(file){const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x||!Array.isArray(x.players)||!Array.isArray(x.history))throw 0;state={...state,...x};save();applyTheme();render();alert('Varmuuskopio tuotu.')}catch{alert('Tiedosto ei ole kelvollinen KCD2 Dice Tracker -varmuuskopio.')}};r.readAsText(file)}
$('addPlayer').onclick=addPlayer;$('playerName').onkeydown=e=>{if(e.key==='Enter')addPlayer()};$('startGame').onclick=startGame;$('bankBtn').onclick=bank;$('bustBtn').onclick=bust;$('addBtn').onclick=openScorePad;$('undoBtn').onclick=undo;$('endBtn').onclick=manualEnd;$('newBtn').onclick=newGame;$('rulesBtn').onclick=()=>$('rulesDialog').showModal();$('statsBtn').onclick=showStats;$('clearHistory').onclick=()=>{if(confirm('Poistetaanko koko pelihistoria?')){state.history=[];save();$('statsDialog').close();showStats()}};$('exportBtn').onclick=exportData;$('importFile').onchange=e=>e.target.files[0]&&importData(e.target.files[0]);$('useCalc').onclick=()=>{const v=calcScore(selectedDice);if(v){addPoints(v);clearDice()}};$('clearDice').onclick=clearDice;$('removeDie').onclick=removeLastDie;$('themeBtn').onclick=()=>{state.theme=document.documentElement.classList.contains('dark')?'light':'dark';save();applyTheme()};
document.querySelectorAll('[data-score]').forEach(b=>b.onclick=()=>chooseQuickScore(Number(b.dataset.score)));
document.querySelectorAll('[data-digit]').forEach(b=>b.onclick=()=>appendScoreDigit(b.dataset.digit));
$('scoreBackspace').onclick=backspaceScore;$('scoreClear').onclick=clearScore;$('confirmScore').onclick=confirmManualScore;
matchMedia('(prefers-color-scheme:dark)').addEventListener?.('change',()=>{if(state.theme==='system')applyTheme()});
load();