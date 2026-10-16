
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