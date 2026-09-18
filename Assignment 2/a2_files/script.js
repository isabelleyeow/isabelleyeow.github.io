
// Add other functionalities here

function toggleFollow() {
  const btn = document.querySelector('.follow');
  const isFollowing = btn.classList.toggle('following');
  btn.textContent = isFollowing ? '✓ Following' : '+ Follow';
}

// adding all the lyrics according to the time it appears, was a very tiring and difficult process to do manually but im happy that i managed to finish it. plus trying to sync up the lyrics with the time of the music video
const lyrics = [
  { time: 0,    text: "♪ Intro ♪" },
  { time: 9.0,  text: "I just drank 3 monsters in a day," },
  { time: 14.9,  text: "I just drank 3 monsters to save my grade" },
  { time: 20.0, text: "cause I've been doing nothing, I'm not okay" },
  { time: 25.0, text: "Well I'll just drink 3 more just in case" },
  { time: 34.9, text: "Wake up, the grind starts" },
  { time: 38.0, text: "Get your ass out of bed" },
  { time: 41.0, text: "Gimme a break, it's a sunday" },
  { time: 43.0, text: "Man I don't fucking care" },
  { time: 46.0, text: "The clock is ticking, the guilt is building" },
  { time: 48.0, text: "God I don't wanna grind" },
  { time: 51.0, text: "Just let me rot in bed and fall behind." },
  { time: 56.0, text: "Wake up, its monday" },
  { time: 58.0, text: "9am class today" },
  { time: 61.0, text: "Oh shit I'm so late" },
  { time: 64.0, text: "I just can't deny" },
  { time: 66.0, text: "I'm out of time and I'm also broke" },
  { time: 68.0, text: "But I don't wanna grind" },
  { time: 71.0, text: "Just let me do my thing and kill some time." },
  { time: 76.0, text: "Cause I've been waiting" },
  { time: 81.0, text: "For the final hour of the mess I'm making" },
  { time: 86.9, text: "Yeah I've been waiting" },
  { time: 91.0, text: "For the caffeine to wear off my hands are shaking." },
  { time: 100.0, text: "I just downed 3 monsters in a day" },
  { time: 104.0, text: "I just downed 3 monsters to save my grades" },
  { time: 110.0, text: "I've been doing nothing, I'm not okay" },
  { time: 115.0, text: "So I'll just down 3 more just in case." },
  { time: 119.0, text: "1, 2, 3, Go!" },
  { time: 140.0, text: "Cause I've been waiting" },
  { time: 145.0, text: "For the final hour of the mess I'm making" },
  { time: 150.0, text: "Yeah I've been waiting" },
  { time: 155.0, text: "For the caffeine to wear off my hands are shaking." },
  { time: 161.0, text: "I just drank 3 monsters" },
  { time: 164.0, text: "Yeah I'll just drink 3 more" },
  { time: 166.0, text: "I just drank 3 monsters to save my grade" },
  { time: 171.0, text: "I just drank 3 monsters" },
  { time: 174.0, text: "Yeah I'll just drink 3 more" },
  { time: 178.0, text: "Maybe I should work.." },

];

const video = document.getElementById('custom-video-player');
const lyricsList = document.getElementById('lyrics-list');

lyrics.forEach((line, index) => {
  const div = document.createElement('div');
  div.className = 'lyric-line';
  div.id = `lyric-${index}`;
  div.textContent = line.text;
  div.onclick = () => { video.currentTime = line.time; };
  lyricsList.appendChild(div);
});

// i had a few troubles for the next few codes, there was a lot of trial and errors going on. i went back and forth trying to figure out what went wrong and what went right. i also used claude to help me refine my codes to double check that everything is right.
video.addEventListener('timeupdate', () => {
  const currentTime = video.currentTime;
  let activeIndex = 0;
  lyrics.forEach((line, index) => {
    if (currentTime >= line.time) activeIndex = index;
  });

  document.querySelectorAll('.lyric-line').forEach((el, index) => {
    el.classList.toggle('active', index === activeIndex);
  });

  const activeEl = document.getElementById(`lyric-${activeIndex}`);
  if (activeEl) activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});

// i want viewers to be able to interact with the like buttons 
let liked = false;
function toggleLike() {
  const icon = document.getElementById('like-icon');
  const count = document.getElementById('like-count');
  let current = parseInt(count.textContent);

  liked = !liked;
  icon.textContent = liked ? '❤️' : '🤍';
  count.textContent = liked ? current + 1 : current - 1;
}

// comments section
const comments = [
  { name: "Jiunn Hern", time: "3 days ago", text: "Fire music video Adam! This hits hard" },
  { name: "Aiesya", time: "5 days ago", text: "Literally might be my new favourite song!!" },
  { name: "Wanyue", time: "2 days ago", text: "Monster sponsor them pls" },
  { name: "Suern", time: "1 day ago", text: "Do you do weddings?" },
];

const commentsList = document.getElementById('comments-list');

function renderComments() {
  commentsList.innerHTML = '';
  comments.forEach(c => {
    const div = document.createElement('div');
    div.className = 'comment';
    div.innerHTML = `
      <span class="comment-name">${c.name}</span>
      <span class="comment-time">${c.time}</span>
      <p class="comment-text">${c.text}</p>
    `;
    commentsList.appendChild(div);
  });
}

function addComment() {
  const input = document.getElementById('comment-input');
  const text = input.value.trim();
  if (text === '') return;

  comments.push({ name: "You", time: "Just now", text: text });
  renderComments();
  input.value = '';

  commentsList.scrollTop = commentsList.scrollHeight;
}

renderComments();