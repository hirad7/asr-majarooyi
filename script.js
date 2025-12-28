// Telegram Mini App bootstrap
const tg = window.Telegram?.WebApp;

function initTelegram(){
  if(!tg) return;
  tg.ready();
  tg.expand();
  // Safe area padding for iOS
  document.documentElement.style.setProperty('--tg-viewport-height', tg.viewportHeight + 'px');
  // Use Telegram theme (optional)
  // const t = tg.themeParams;
}

initTelegram();

// State
const state = {
  امتیازها: {},
  خاندان: null,
  کاربر: null,
};

const screens = [...document.querySelectorAll('.screen')];
function show(id){
  screens.forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(tg){
    tg.HapticFeedback?.impactOccurred?.('light');
  }
  // Persist progress (MVP)
  try{
    localStorage.setItem('aa_demo_state', JSON.stringify(state));
  }catch(e){}
}

// Restore (optional)
try{
  const saved = localStorage.getItem('aa_demo_state');
  if(saved){
    const obj = JSON.parse(saved);
    if(obj && typeof obj === 'object'){
      Object.assign(state, obj);
    }
  }
}catch(e){}

// Identify user (if inside Telegram)
if(tg?.initDataUnsafe?.user){
  const u = tg.initDataUnsafe.user;
  state.کاربر = (u.first_name || '') + (u.last_name ? (' ' + u.last_name) : '');
}

// Navigation buttons
document.querySelectorAll('[data-next]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const score = btn.getAttribute('data-score');
    if(score){
      const obj = JSON.parse(score);
      Object.keys(obj).forEach(k=>{
        state.امتیازها[k] = (state.امتیازها[k] || 0) + obj[k];
      });
    }
    const next = btn.getAttribute('data-next');
    show(next);
  }, {passive:true});
});

// Clan pick
document.querySelectorAll('.pick').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const card = btn.closest('.card');
    state.خاندان = card.getAttribute('data-clan');
  }, {passive:true});
});

// Restart
document.getElementById('restart').addEventListener('click', ()=>{
  try{ localStorage.removeItem('aa_demo_state'); }catch(e){}
  location.reload();
});

// Summary render on end
const obs = new MutationObserver(()=>{
  const end = document.getElementById('s-end');
  if(end.classList.contains('active')){
    const userLine = state.کاربر ? `<p>نام: <b>${state.کاربر}</b></p>` : '';
    document.getElementById('summary').innerHTML =
      userLine +
      `<p>خاندان: <b>${state.خاندان || '—'}</b></p>
       <p>امتیازها: <code>${JSON.stringify(state.امتیازها)}</code></p>
       <p class="muted">این داده‌ها بعداً برای انتخاب دعوت‌شدگان فاز واقعی استفاده می‌شود.</p>`;
  }
});
obs.observe(document.body,{attributes:true,subtree:true,attributeFilter:['class']});

// Audio (Telegram blocks autoplay; start only after first user gesture)
let audioOn = false;
let ctx, osc, gain, lfo, lfoGain;

function startAudio(){
  if(audioOn) return;
  audioOn = true;
  try{
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    osc = ctx.createOscillator();
    gain = ctx.createGain();
    lfo = ctx.createOscillator();
    lfoGain = ctx.createGain();

    // Base tone (ambient drone)
    osc.type = 'sine';
    osc.frequency.value = 110; // A2
    gain.gain.value = 0.03;

    // Slow modulation for "breathing" feel
    lfo.type = 'sine';
    lfo.frequency.value = 0.12;
    lfoGain.gain.value = 0.012;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    osc.connect(gain).connect(ctx.destination);
    lfo.start();
    osc.start();
  }catch(e){
    audioOn = false;
  }
}

function stopAudio(){
  if(!audioOn) return;
  audioOn = false;
  try{
    osc?.stop(); lfo?.stop();
    osc?.disconnect(); lfo?.disconnect();
    ctx?.close();
  }catch(e){}
  osc = gain = lfo = lfoGain = ctx = null;
}

const audioBtn = document.getElementById('audioToggle');
audioBtn.addEventListener('click', ()=>{
  if(!audioOn){
    startAudio();
    audioBtn.textContent = '🔊';
    tg?.HapticFeedback?.notificationOccurred?.('success');
  }else{
    stopAudio();
    audioBtn.textContent = '🔇';
    tg?.HapticFeedback?.notificationOccurred?.('warning');
  }
});

// First gesture auto-enables audio (optional)
let first = true;
document.addEventListener('pointerdown', ()=>{
  if(first){
    first = false;
    // Do not force audio on; just allow it to start later without errors.
  }
}, {once:true, passive:true});
