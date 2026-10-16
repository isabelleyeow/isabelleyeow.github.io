
// different variations of of teas and milk
var TEAS = [
  { id: 'black',      name: 'Black tea',  colour: '#8C5230' },
  { id: 'jasmine',    name: 'Jasmine',    colour: '#CBBE72' },
  { id: 'oolong',     name: 'Oolong',     colour: '#B57B3E' },
  { id: 'matcha',     name: 'Matcha',     colour: '#7FA650' },
  { id: 'taro',       name: 'Taro',       colour: '#9B86D6' },
  { id: 'strawberry', name: 'Strawberry', colour: '#E2738F' }
];
 
var MILKS = [
  { id: 'none',  name: 'No milk', colour: '#EFE6DF', price: 0 },
  { id: 'dairy', name: 'Dairy',   colour: '#FBF4EC', price: 0.50 },
  { id: 'oat',   name: 'Oat',     colour: '#F2E6D2', price: 0.90 }
];

// different toppings 
var TOPPINGS = [
  { id: 'pearls',  name: 'Pearls',       colour: '#2E2A28', price: 0.80, sinks: true,  shape: 'pearl',   pieces: 7 },
  { id: 'lychee',  name: 'Lychee jelly', colour: '#F3DCE6', price: 0.80, sinks: true,  shape: 'jelly',   pieces: 5 },
  { id: 'popping', name: 'Popping boba', colour: '#E9704E', price: 0.90, sinks: true,  shape: 'boba',    pieces: 6 },
  { id: 'pudding', name: 'Pudding',      colour: '#F0CE6A', price: 0.90, sinks: true,  shape: 'pudding', pieces: 3 },
  { id: 'foam',    name: 'Cheese foam',  colour: '#F6E3C2', price: 1.20, sinks: false, shape: 'foam',    pieces: 0 }
];
 
var BASE_PRICE = 5.00;
var MAX_TOPPINGS = 3;
var MAX_SUGAR = 4;
var MAX_ICE = 3;
var ICE_WORDS = ['No ice', 'Less ice', 'Regular ice', 'Extra ice'];

// the state theyre in 
var state = {
  tea: null, 
  milk: 'none',
  sugar: 0,  
  ice: 0,
  toppings: [],
  shake: 0, 
  sealed: false 
};
 
function $(id) { return document.getElementById(id); }
 
var cup = $('cup');
var dropzone = $('dropzone');
var liquid = $('liquid');

// sound
var Sound = {
  ctx: null,
  on: true,
 
  // sound happens after the first click
  wake: function () {
    if (!this.ctx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) { this.ctx = new Ctx(); }
    }
    if (this.ctx && this.ctx.state === 'suspended') { this.ctx.resume(); }
  },
 
  tone: function (from, to, length, type, volume) {
    if (!this.on || !this.ctx) { return; }
    var now = this.ctx.currentTime;
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
 
    osc.type = type;
    osc.frequency.setValueAtTime(from, now);
    osc.frequency.exponentialRampToValueAtTime(to, now + length);
 
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
 
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + length + 0.02);
  },
 
  noise: function (length, filterFrom, filterTo, volume) {
    if (!this.on || !this.ctx) { return; }
    var now = this.ctx.currentTime;
    var frames = Math.floor(this.ctx.sampleRate * length);
    var buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    var data = buffer.getChannelData(0);
 
    for (var i = 0; i < frames; i++) {
      data[i] = Math.random() * 2 - 1; 
    }
 
    var src = this.ctx.createBufferSource();
    src.buffer = buffer;
 
    var filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFrom, now);
    filter.frequency.exponentialRampToValueAtTime(filterTo, now + length);
 
    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
 
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
  },
 
  pick:  function () { this.tone(520, 760, 0.09, 'sine', 0.10); },
  back:  function () { this.tone(430, 250, 0.14, 'sine', 0.09); },
  pour:  function () { this.noise(0.55, 2200, 380, 0.16); this.tone(200, 120, 0.3, 'sine', 0.08); },
  plink: function () { this.tone(900, 620, 0.13, 'triangle', 0.10); },
  plop:  function () { this.tone(320, 130, 0.16, 'sine', 0.13); },
  nope:  function () { this.tone(170, 120, 0.12, 'square', 0.07); },
  tick:  function (progress) { this.noise(0.07, 700 + progress * 14, 300, 0.13); },
  seal:  function () { this.tone(700, 980, 0.12, 'triangle', 0.10); },

  done: function () {
    var self = this;
    [660, 880, 1175].forEach(function (note, i) {
      setTimeout(function () { self.tone(note, note, 0.18, 'triangle', 0.09); }, i * 110);
    });
  }
};
 
document.addEventListener('pointerdown', function () { Sound.wake(); });
 
$('sound-toggle').addEventListener('click', function () {
  Sound.on = !Sound.on;
  this.setAttribute('aria-pressed', String(Sound.on));
  this.innerHTML = '<span aria-hidden="true">♪</span> Sound ' + (Sound.on ? 'on' : 'off');
  if (Sound.on) { Sound.pick(); }
});
 
// shelves

function makeChip(item, kind) {
  var b = document.createElement('button');
  b.className = 'chip';
  b.dataset.kind = kind; 
  b.dataset.id = item.id;
  b.innerHTML = '<span class="swatch' + (item.cube ? ' cube' : '') +
                '" style="background:' + item.colour + '"></span>' + item.name;
  b.setAttribute('aria-label', 'Add ' + item.name + ' to the cup');
  return b;
}
 
TEAS.forEach(function (t) { $('shelf-tea').appendChild(makeChip(t, 'tea')); });
MILKS.forEach(function (m) { $('shelf-milk').appendChild(makeChip(m, 'milk')); });
TOPPINGS.forEach(function (t) { $('shelf-top').appendChild(makeChip(t, 'topping')); });
$('shelf-sugar').appendChild(makeChip({ id: 'sugar', name: 'Sugar cube', colour: '#F3E3BE', cube: true }, 'sugar'));
$('shelf-ice').appendChild(makeChip({ id: 'ice', name: 'Ice cube', colour: '#D6E9F5', cube: true }, 'ice'));

// dragging feature, i had to keep going back and forth with mdn because there was a problem i couldnt figure out but after a while i managed to solve it and everything seemed to work as it should 

var drag = null;
 
document.addEventListener('pointerdown', function (e) {
  var chip = e.target.closest('.chip');
  if (!chip || state.sealed) { return; }
  drag = {
    src: chip,
    kind: chip.dataset.kind,
    id: chip.dataset.id,
    x0: e.clientX,
    y0: e.clientY,
    moved: false,
    ghost: null
  };
});
 
document.addEventListener('pointermove', function (e) {
  if (!drag) { return; }

  if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) {
    drag.moved = true;
    drag.src.classList.add('is-held');
    drag.ghost = drag.src.cloneNode(true);
    drag.ghost.className = 'ghost';
    document.body.appendChild(drag.ghost);
    Sound.pick();
  }
  if (!drag.moved) { return; }
 
  drag.ghost.style.left = e.clientX + 'px';
  drag.ghost.style.top = e.clientY + 'px';
  dropzone.classList.toggle('hot', overCup(e.clientX, e.clientY));
});
 
document.addEventListener('pointerup', function (e) {
  if (!drag) { return; }
  var d = drag;
  drag = null;
  dropzone.classList.remove('hot');
 
  if (!d.moved) { add(d.kind, d.id); return; } 
 
  d.src.classList.remove('is-held');
 
  if (overCup(e.clientX, e.clientY)) {
    d.ghost.remove();
    add(d.kind, d.id);
  } else {
    
    var r = d.src.getBoundingClientRect();
    d.ghost.classList.add('returning');
    d.ghost.style.left = (r.left + r.width / 2) + 'px';
    d.ghost.style.top = (r.top + r.height / 2) + 'px';
    d.ghost.style.opacity = '0';
    Sound.back();
    setTimeout(function () { d.ghost.remove(); }, 300);
  }
});

function overCup(x, y) {
  var r = cup.getBoundingClientRect();
  return x > r.left - 26 && x < r.right + 26 && y > r.top - 26 && y < r.bottom + 26;
}

// adding and removing 

function add(kind, id) {
  if (state.sealed) { return; }
 
  if (kind === 'tea') {
    state.tea = id;
    splash();
    Sound.pour();
 
  } else if (kind === 'milk') {
    state.milk = id;
    splash();
    Sound.pour();
 
  } else if (kind === 'sugar') {
    if (state.sugar >= MAX_SUGAR) { return reject("that's as sweet as it gets"); }
    state.sugar++;
    dissolveCube();
    Sound.plink();
 
  } else if (kind === 'ice') {
    if (state.ice >= MAX_ICE) { return reject("that's plenty of ice"); }
    state.ice++;
    Sound.plink();
 
  } else if (kind === 'topping') {
    if (!state.tea) { return reject('pour a tea base first'); }
    if (state.toppings.indexOf(id) !== -1) { return reject('already in the cup'); }
    if (state.toppings.length >= MAX_TOPPINGS) { return reject("cup's full!"); }
    state.toppings.push(id);
    Sound.plop();
  }
  state.shake = 0;
  render();
}
 
function removeTopping(id) {
  state.toppings = state.toppings.filter(function (t) { return t !== id; });
  state.shake = 0;
  Sound.back();
  render();
}

function reject(message) {
  cup.classList.remove('wobble');
  void cup.offsetWidth;
  cup.classList.add('wobble');
  Sound.nope();
  toast(message);
}
 
function splash() {
  var s = $('splash');
  s.classList.remove('go');
  void s.offsetWidth;
  s.classList.add('go');
}
 
function dissolveCube() {
  var c = document.createElement('div');
  c.className = 'cube sugar';
  $('sugar-layer').appendChild(c);
  setTimeout(function () { c.remove(); }, 1100); 
}
 
var toastTimer;
function toast(message) {
  var t = $('toast');
  t.textContent = message;
  t.classList.add('up');
  $('live').textContent = message; 
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove('up'); }, 1700);
}
 
// shaking
var shakeDrag = null;
 
cup.addEventListener('pointerdown', function (e) {
  if (!canShake() || e.target.closest('.bit')) { return; }
  shakeDrag = { last: e.clientX, dir: 0 };
  cup.setPointerCapture(e.pointerId);
});
 
cup.addEventListener('pointermove', function (e) {
  if (!shakeDrag) { return; }
  var dx = e.clientX - shakeDrag.last;
  if (Math.abs(dx) < 9) { return; }  
  var dir = Math.sign(dx);
  if (dir !== shakeDrag.dir) {   
    shakeDrag.dir = dir;
    bumpShake(9);
  }
  shakeDrag.last = e.clientX;
});
 
cup.addEventListener('pointerup', function () { shakeDrag = null; });
cup.addEventListener('pointercancel', function () { shakeDrag = null; });
 
$('shake-btn').addEventListener('click', function () {
  if (!canShake()) { return; }
  cup.classList.add('shaking');
  var timer = setInterval(function () {
    bumpShake(7);
    if (state.shake >= 100) {
      clearInterval(timer);
      cup.classList.remove('shaking');
    }
  }, 70);
});
 
function canShake() {
  return state.tea !== null && !state.sealed && state.shake < 100;
}
 
function bumpShake(amount) {
  Sound.tick(state.shake);
  state.shake = Math.min(100, state.shake + amount);
  if (state.shake >= 100) { toast('mixed and ready'); }
  render();
}

// name of the item and its price

function find(list, id) {
  return list.filter(function (item) { return item.id === id; })[0];
}
 
function teaObj()     { return find(TEAS, state.tea); }
function milkObj()    { return find(MILKS, state.milk); }
function topObj(id)   { return find(TOPPINGS, id); }
 
function price() {
  if (!state.tea) { return 0; }
  var p = BASE_PRICE + milkObj().price;
  state.toppings.forEach(function (id) { p += topObj(id).price; });
  return p;
}
 
function money(n) { return '$' + n.toFixed(2); }
 
// i want it to build a sentence of the final order so users can know what theyre ordering or what they have ordered before checking out 
function drinkName() {
  if (!state.tea) { return 'Empty cup'; }
  var n = teaObj().name;
  if (state.milk === 'dairy') { n += ' milk tea'; }
  else if (state.milk === 'oat') { n += ' oat milk tea'; }
 
  if (state.toppings.length) {
    var names = state.toppings.map(function (id) { return topObj(id).name.toLowerCase(); });
    n += ' with ' + (names.length === 1
      ? names[0]
      : names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1]);
  }
  return n;
}
 
// to blend the tea and the milk from the 2 separated colours to one lighter coloured of the original base
function mix(a, b, t) {
  function parts(hex) {
    return [1, 3, 5].map(function (i) { return parseInt(hex.substr(i, 2), 16); });
  }
  var c1 = parts(a), c2 = parts(b);
  function channel(x, y) {
    return Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  }
  return '#' + channel(c1[0], c2[0]) + channel(c1[1], c2[1]) + channel(c1[2], c2[2]);
}

// to render everything 

function render() {
  var hasTea = state.tea !== null;
 
  // measures how full the cup is and never allowing it to overflow from the top of the cup as it would be unrealistic 
  var fill = 0;
  if (hasTea) {
    fill = 52;
    if (state.milk !== 'none') { fill += 9; }
    fill += state.ice * 4 + state.sugar * 1;
    state.toppings.forEach(function (id) { fill += topObj(id).sinks ? 5 : 6; });
  }
  fill = Math.min(fill, 86); 
  liquid.style.height = fill + '%';
 
  // milk only blends in as the shaking goes
  if (hasTea) {
    var blend = state.milk === 'none' ? 0 : 0.42 * (state.shake / 100);
    liquid.style.backgroundColor = mix(teaObj().colour, milkObj().colour, blend);
  }
  var swirl = $('swirl');
  var milkBand = Math.round(fill * 0.42);
  swirl.style.setProperty('--milk', milkObj().colour);
  swirl.style.height = milkBand + '%';
  swirl.style.bottom = (fill - milkBand) + '%';
  swirl.style.opacity = (hasTea && state.milk !== 'none')
    ? String(0.94 * (1 - state.shake / 100))
    : '0';
 
  // for cheese foam to always be on top as these type fo ingredients are always situated at the top of the drink
  var foam = $('foam');
  foam.style.opacity = state.toppings.indexOf('foam') !== -1 ? '1' : '0';
  foam.style.bottom = (fill - 3) + '%';
 
  // i wanted the toppings like boba, popping pearls etc to sink into the drink but it would depend on how many is added and how theyre sat on top of each other
  var sink = $('sinkers');
  sink.innerHTML = '';
  state.toppings.filter(function (id) { return topObj(id).sinks; }).forEach(function (id) {
    var t = topObj(id);
    for (var i = 0; i < t.pieces; i++) {
      var b = document.createElement('button');
      b.className = 'bit ' + t.shape;
      b.dataset.topping = id;
      b.setAttribute('aria-label', 'Remove ' + t.name);
      sink.appendChild(b);
    }
  });
 
  // for the ice to float from the liquids 
  var iceLayer = $('ice-layer');
  iceLayer.innerHTML = '';
  iceLayer.style.bottom = Math.max(fill - 14, 2) + '%';
  for (var i = 0; i < state.ice; i++) {
    var c = document.createElement('div');
    c.className = 'cube ice';
    iceLayer.appendChild(c);
  }
 
  $('cup-empty').style.display = hasTea ? 'none' : 'flex';
 
  document.querySelectorAll('.chip').forEach(function (chip) {
    var k = chip.dataset.kind, id = chip.dataset.id;
    var on = (k === 'tea' && state.tea === id) ||
             (k === 'milk' && state.milk === id && hasTea) ||
             (k === 'topping' && state.toppings.indexOf(id) !== -1);
    chip.classList.toggle('is-on', on);
  });
 
  // the order summary of what they added into a cup, i want to create a clear part of the page where users can see exactly what they ordered as this builds onto the bigger picture of this project
  $('drink-name').textContent = drinkName();
  $('price').textContent = money(price());
  $('r-tea').textContent = hasTea ? teaObj().name : '—';
  $('r-milk').textContent = hasTea ? milkObj().name : '—';
  $('r-sugar').textContent = (state.sugar / MAX_SUGAR * 100) + '%';
  $('sugar-meter').style.width = (state.sugar / MAX_SUGAR * 100) + '%';
  $('r-ice').textContent = ICE_WORDS[state.ice];
  $('r-topcount').textContent = state.toppings.length + ' / ' + MAX_TOPPINGS;
 
  var tops = $('r-tops');
  tops.innerHTML = '';
  state.toppings.forEach(function (id) {
    var el = document.createElement('span');
    el.className = 'top-chip';
    el.innerHTML = topObj(id).name +
      ' <button aria-label="Remove ' + topObj(id).name + '">&times;</button>';
    el.querySelector('button').addEventListener('click', function () { removeTopping(id); });
    tops.appendChild(el);
  });
 
  // the shake 
  var ready = state.shake >= 100;
  $('shaker').classList.toggle('live', hasTea && !state.sealed);
 
  // here i had a little help because i needed to get the measurements of the cups and everything  before continuing 
  var circumference = 157;
  $('ring-bar').style.strokeDashoffset = circumference - circumference * state.shake / 100;
  $('ring-pct').textContent = Math.round(state.shake);
  $('shake-sub').textContent = ready ? 'Blended — looks good' : 'Drag the cup side to side';
  cup.classList.toggle('shakeable', canShake());
 
  // the main button so it can be carried onto the next step 
  var btn = $('add-btn');
  btn.disabled = !ready || state.sealed;
  btn.textContent = state.sealed ? 'Added — ' + money(price())
    : ready ? 'Add to order · ' + money(price())
    : hasTea ? 'Shake it first'
    : 'Pick a tea base';
}
 
//to put a topping back out or basically an undo if the user second guesses themselves or want to tey something new
var pullOut = null;
 
cup.addEventListener('pointerdown', function (e) {
  var bit = e.target.closest('.bit');
  if (!bit || state.sealed) { return; }
  pullOut = { id: bit.dataset.topping, x0: e.clientX, y0: e.clientY };
});
 
document.addEventListener('pointerup', function (e) {
  if (!pullOut) { return; }
  var p = pullOut;
  pullOut = null;
  var outside = !overCup(e.clientX, e.clientY);
  var dragged = Math.hypot(e.clientX - p.x0, e.clientY - p.y0) > 20;
  if (outside && dragged) {
    removeTopping(p.id);
    toast(topObj(p.id).name + ' taken out');
  }
});

cup.addEventListener('keydown', function (e) {
  var bit = e.target.closest('.bit');
  if (bit && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    removeTopping(bit.dataset.topping);
  }
});
 
// finishing and restarting 
 
$('add-btn').addEventListener('click', function () {
  if (state.shake < 100) { return; }
  state.sealed = true;
  render();
  $('lid').classList.add('on');
  $('straw').classList.add('on');
  Sound.seal();
 
  setTimeout(function () {
    $('oc-name').textContent = drinkName();
    $('oc-sub').textContent = money(price()) + ' · ready for pickup in about 10 minutes';
    $('ordercard').classList.add('up');
    Sound.done();
  }, 420);
});
 
$('oc-btn').addEventListener('click', reset);
$('reset-btn').addEventListener('click', reset);
 
function reset() {
  state.tea = null;
  state.milk = 'none';
  state.sugar = 0;
  state.ice = 0;
  state.toppings = [];
  state.shake = 0;
  state.sealed = false;
  $('lid').classList.remove('on');
  $('straw').classList.remove('on');
  $('ordercard').classList.remove('up');
  render();
}
 
// draw the empty up once at the start 
render();
 
   