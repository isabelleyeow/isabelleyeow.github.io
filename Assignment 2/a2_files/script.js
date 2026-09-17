
// Add other functionalities here

function toggleFollow() {
  const btn = document.querySelector('.follow');
  const isFollowing = btn.classList.toggle('following');
  btn.textContent = isFollowing ? '✓ Following' : '+ Follow';
}

// trying to sync up the lyrics with the time of the music video
const lyrics = [
  { time: 0,    text: "♪ instrumental intro ♪" },
  { time: 4.5,  text: "First lyric line here" },
  { time: 9.2,  text: "Second lyric line here" },
  { time: 14.0, text: "Third lyric line here" },
  { time: 19.8, text: "Fourth lyric line here" },
];

const video = document.getElementById('custom-video-player');
const lyricsList = document.getElementById('lyrics-list');

lyrics.forEach((line, index) => {
  const div = document.createElement('div');
  div.className = 'lyric-line';
  div.id = `lyric-${index}`;
  div.textContent = line.text;
  // click-to-seek: clicking a line jumps the video to that timestamp
  div.onclick = () => { video.currentTime = line.time; };
  lyricsList.appendChild(div);
});

// timestamp has passed, and mark only that one as active
video.addEventListener('timeupdate', () => {
  const currentTime = video.currentTime;
  let activeIndex = 0;
  lyrics.forEach((line, index) => {
    if (currentTime >= line.time) activeIndex = index;
  });

  document.querySelectorAll('.lyric-line').forEach((el, index) => {
    el.classList.toggle('active', index === activeIndex);
  });

  // keep the active line scrolled into view within the panel
  const activeEl = document.getElementById(`lyric-${activeIndex}`);
  if (activeEl) activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});

// Toggle panel visibility — simple show/hide with button label feedback
function toggleLyricsVisibility() {
  const panel = document.getElementById('lyrics-list');
  const btn = document.getElementById('lyrics-toggle');
  const hidden = panel.style.display === 'none';
  panel.style.display = hidden ? 'flex' : 'none';
  btn.textContent = hidden ? 'Hide' : 'Show';
}
