/* ==========================================================================
   Haven Chennai Game Jam — Interactive Logic & Arcade Game
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------------------------------
     1. Web Audio API — 8-Bit Chiptune Sound Synthesizer
     ------------------------------------------------------------------------ */
  let audioCtx = null;
  let sfxEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
  }

  function play8BitSound(type) {
    if (!sfxEnabled) return;
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'catch') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.18); // C6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'win') {
      osc.type = 'square';
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const noteOsc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        noteOsc.type = 'square';
        noteOsc.connect(noteGain);
        noteGain.connect(audioCtx.destination);
        noteOsc.frequency.setValueAtTime(freq, now + idx * 0.08);
        noteGain.gain.setValueAtTime(0.15, now + idx * 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.12);
        noteOsc.start(now + idx * 0.08);
        noteOsc.stop(now + idx * 0.08 + 0.12);
      });
    }
  }

  // Sound Toggle Button
  const sfxBtn = document.getElementById('sfx-toggle');
  if (sfxBtn) {
    sfxBtn.addEventListener('click', () => {
      sfxEnabled = !sfxEnabled;
      const label = sfxBtn.querySelector('.sfx-label');
      const icon = sfxBtn.querySelector('i');

      if (sfxEnabled) {
        label.textContent = 'SFX ON';
        icon.className = 'fa-solid fa-volume-high';
        play8BitSound('click');
      } else {
        label.textContent = 'SFX OFF';
        icon.className = 'fa-solid fa-volume-xmark';
      }
    });
  }

  // Play click sound on interactive elements
  document.querySelectorAll('.btn, .engine-tab, .arch-btn, .accordion-header').forEach(el => {
    el.addEventListener('click', () => play8BitSound('click'));
  });

  /* ------------------------------------------------------------------------
     2. Countdown Timer
     ------------------------------------------------------------------------ */
  const cdDays = document.getElementById('cd-days');
  const cdHours = document.getElementById('cd-hours');
  const cdMins = document.getElementById('cd-mins');
  const cdSecs = document.getElementById('cd-secs');

  // Set target date 14 days from now
  const targetDate = new Date().getTime() + (14 * 24 * 60 * 60 * 1000) + (8 * 60 * 60 * 1000);

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      if (cdDays) cdDays.textContent = '00';
      if (cdHours) cdHours.textContent = '00';
      if (cdMins) cdMins.textContent = '00';
      if (cdSecs) cdSecs.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (cdDays) cdDays.textContent = String(days).padStart(2, '0');
    if (cdHours) cdHours.textContent = String(hours).padStart(2, '0');
    if (cdMins) cdMins.textContent = String(minutes).padStart(2, '0');
    if (cdSecs) cdSecs.textContent = String(seconds).padStart(2, '0');
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  /* ------------------------------------------------------------------------
     3. Mini Arcade Canvas Game — Bug / Jam Idea Catcher
     ------------------------------------------------------------------------ */
  const canvas = document.getElementById('arcade-canvas');
  const overlay = document.getElementById('arcade-overlay');
  const startBtn = document.getElementById('start-game-btn');
  const scoreDisplay = document.getElementById('game-score');

  if (canvas) {
    const ctx = canvas.getContext('2d');
    let gameRunning = false;
    let score = 0;

    // Player Object
    const player = {
      x: canvas.width / 2 - 30,
      y: canvas.height - 35,
      width: 60,
      height: 20,
      speed: 7,
      dx: 0,
      color: '#ec3750'
    };

    // Falling Jam Items
    const items = [];
    const itemIcons = ['💡', '🎨', '🎵', '💻', '🍕', '🎮', '⚡'];

    function spawnItem() {
      if (!gameRunning) return;
      items.push({
        x: Math.random() * (canvas.width - 30) + 15,
        y: -20,
        size: 24,
        speed: 2 + Math.random() * 2,
        icon: itemIcons[Math.floor(Math.random() * itemIcons.length)]
      });
    }

    let spawnInterval = null;

    function resetGame() {
      score = 0;
      if (scoreDisplay) scoreDisplay.textContent = '0';
      items.length = 0;
      player.x = canvas.width / 2 - 30;
      player.dx = 0;
    }

    function startGame() {
      resetGame();
      gameRunning = true;
      overlay.style.display = 'none';
      if (spawnInterval) clearInterval(spawnInterval);
      spawnInterval = setInterval(spawnItem, 1000);
      play8BitSound('click');
      requestAnimationFrame(gameLoop);
    }

    if (startBtn) {
      startBtn.addEventListener('click', startGame);
    }

    // Keyboard Input
    window.addEventListener('keydown', (e) => {
      if (!gameRunning) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        player.dx = -player.speed;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        player.dx = player.speed;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ||
          e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        player.dx = 0;
      }
    });

    // Touch Buttons for Mobile
    const btnLeft = document.getElementById('btn-touch-left');
    const btnRight = document.getElementById('btn-touch-right');

    if (btnLeft && btnRight) {
      btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); player.dx = -player.speed; });
      btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); player.dx = 0; });
      btnLeft.addEventListener('mousedown', () => player.dx = -player.speed);
      btnLeft.addEventListener('mouseup', () => player.dx = 0);

      btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); player.dx = player.speed; });
      btnRight.addEventListener('touchend', (e) => { e.preventDefault(); player.dx = 0; });
      btnRight.addEventListener('mousedown', () => player.dx = player.speed);
      btnRight.addEventListener('mouseup', () => player.dx = 0);
    }

    function updateGame() {
      // Move Player
      player.x += player.dx;
      if (player.x < 0) player.x = 0;
      if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

      // Update Items
      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += item.speed;

        // Collision Check with Player
        if (
          item.y + item.size / 2 >= player.y &&
          item.y - item.size / 2 <= player.y + player.height &&
          item.x >= player.x &&
          item.x <= player.x + player.width
        ) {
          // Caught item!
          items.splice(i, 1);
          score++;
          if (scoreDisplay) scoreDisplay.textContent = score;
          play8BitSound('catch');

          if (score >= 10) {
            // Player won!
            gameRunning = false;
            clearInterval(spawnInterval);
            play8BitSound('win');
            overlay.style.display = 'flex';
            overlay.querySelector('h3').textContent = '🎉 YOU WON! JAM READY! 🎉';
            overlay.querySelector('p').textContent = 'You collected 10 Game Jam Ideas! See you at Haven Chennai Game Jam!';
            startBtn.textContent = 'PLAY AGAIN';
            return;
          }
        } else if (item.y > canvas.height + 30) {
          // Missed item
          items.splice(i, 1);
        }
      }
    }

    function renderGame() {
      // Background Grid
      ctx.fillStyle = '#0a0c12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid Lines
      ctx.strokeStyle = '#181f33';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Player Basket / Controller
      ctx.fillStyle = player.color;
      ctx.shadowColor = '#ec3750';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(player.x, player.y, player.width, player.height, 8);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Player Details (Gamepad Buttons)
      ctx.fillStyle = '#fff';
      ctx.fillRect(player.x + 12, player.y + 7, 12, 6);
      ctx.beginPath();
      ctx.arc(player.x + player.width - 15, player.y + 10, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw Falling Items
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      items.forEach(item => {
        ctx.fillText(item.icon, item.x, item.y);
      });
    }

    function gameLoop() {
      if (!gameRunning) return;
      updateGame();
      renderGame();
      requestAnimationFrame(gameLoop);
    }

    // Initial render
    renderGame();
  }

  /* ------------------------------------------------------------------------
     4. Learn & Build — Game Engine Tab Switcher
     ------------------------------------------------------------------------ */
  const engineData = {
    godot: {
      title: 'Godot Engine (2D & 3D)',
      desc: 'Lightweight, free, open-source, and lightning-fast to learn! Perfect for making 2D pixel platformers, puzzle games, or 3D titles in GDScript.',
      difficulty: 'Beginner to Intermediate',
      learningTime: '1 Hour Workshop',
      features: ['Free starter game template provided', 'Exports directly to WebGL / HTML5 web browsers']
    },
    kaboom: {
      title: 'Kaboom.js / Phaser',
      desc: 'Create games in pure JavaScript in just 10 lines of code! Super easy syntax designed specifically for beginners and fast game jam prototypes.',
      difficulty: 'Absolute Beginner',
      learningTime: '30 Minute Intro',
      features: ['Zero setup required, runs in browser', 'Built-in physics, sprites, and sound triggers']
    },
    unity: {
      title: 'Unity (2D & 3D)',
      desc: 'The industry-standard engine used by indie and AAA game studios worldwide. Great if you want to work with C# or visual scripting.',
      difficulty: 'Intermediate',
      learningTime: '1.5 Hour Workshop',
      features: ['Massive asset store ecosystem', 'High fidelity lighting and 3D graphics']
    },
    pygame: {
      title: 'Pygame (Python)',
      desc: 'Love Python? Pygame lets you code 2D games from scratch using clean Python code, ideal for computer science lovers.',
      difficulty: 'Beginner',
      learningTime: '45 Minute Workshop',
      features: ['Simple object-oriented structure', 'Great for retro arcade mechanics']
    },
    scratch: {
      title: 'Scratch / Construct 3',
      desc: 'Zero coding required! Drag and drop visual blocks to design mechanics, animations, and story choices in minutes.',
      difficulty: 'No Prior Experience Needed',
      learningTime: '15 Minute Quickstart',
      features: ['100% visual drag-and-drop block coding', 'Instant web play and sharing']
    }
  };

  const engineTabs = document.querySelectorAll('.engine-tab');
  const engineTitle = document.getElementById('engine-title');
  const engineDesc = document.getElementById('engine-desc');
  const engineDisplay = document.getElementById('engine-display');

  engineTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const selected = tab.getAttribute('data-engine');
      const data = engineData[selected];

      if (data && engineTitle && engineDesc && engineDisplay) {
        engineTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        engineTitle.textContent = data.title;
        engineDesc.textContent = data.desc;

        const metaTags = engineDisplay.querySelectorAll('.meta-tag');
        if (metaTags.length >= 2) {
          metaTags[0].innerHTML = `<i class="fa-solid fa-signal"></i> <strong>Difficulty:</strong> ${data.difficulty}`;
          metaTags[1].innerHTML = `<i class="fa-solid fa-clock"></i> <strong>Learning Time:</strong> ${data.learningTime}`;
        }

        const featuresBox = engineDisplay.querySelector('.engine-features');
        if (featuresBox) {
          featuresBox.innerHTML = data.features.map(f => `<span><i class="fa-solid fa-check"></i> ${f}</span>`).join('');
        }
      }
    });
  });

  /* ------------------------------------------------------------------------
     5. Make Friends — Archetype Role Picker
     ------------------------------------------------------------------------ */
  const archetypeData = {
    coder: '<strong>The Coding Wizard:</strong> You bring game mechanics to life! You connect player controls, write game physics, collision logic, and fix bugs.',
    artist: '<strong>The Pixel Artist:</strong> You create visual magic! You draw character sprites, tilemaps, animations, background landscapes, and UI elements.',
    musician: '<strong>The Chiptune Composer:</strong> You build the mood! You craft energetic 8-bit soundtrack loops and juicy sound effects for jumps, lasers & explosions.',
    designer: '<strong>The Story & Level Designer:</strong> You design the fun! You craft creative level layouts, write dialogue, puzzle mechanics, and balance difficulty.'
  };

  const archBtns = document.querySelectorAll('.arch-btn');
  const archDesc = document.getElementById('archetype-desc');

  archBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role');
      if (archetypeData[role] && archDesc) {
        archBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        archDesc.innerHTML = archetypeData[role];
      }
    });
  });

  /* ------------------------------------------------------------------------
     6. FAQ Accordion
     ------------------------------------------------------------------------ */
  const accordionItems = document.querySelectorAll('.accordion-item');

  accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');
    if (header) {
      header.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');

        // Close all accordion items
        accordionItems.forEach(i => i.classList.remove('active'));

        // Toggle clicked item
        if (!isOpen) {
          item.classList.add('active');
        }
      });
    }
  });

  /* ------------------------------------------------------------------------
     7. Add to Calendar Modal
     ------------------------------------------------------------------------ */
  const calendarModal = document.getElementById('calendar-modal');
  const openCalBtn1 = document.getElementById('open-calendar-modal');
  const openCalBtn2 = document.getElementById('open-calendar-modal-2');
  const closeCalBtn = document.getElementById('close-modal-btn');
  const calGoogle = document.getElementById('cal-google');
  const calIcs = document.getElementById('cal-ics');

  function openModal() {
    if (calendarModal) calendarModal.classList.add('active');
    play8BitSound('click');
  }

  function closeModal() {
    if (calendarModal) calendarModal.classList.remove('active');
  }

  if (openCalBtn1) openCalBtn1.addEventListener('click', openModal);
  if (openCalBtn2) openCalBtn2.addEventListener('click', openModal);
  if (closeCalBtn) closeCalBtn.addEventListener('click', closeModal);

  if (calendarModal) {
    calendarModal.addEventListener('click', (e) => {
      if (e.target === calendarModal) closeModal();
    });
  }

  // Calendar Links
  if (calGoogle) {
    calGoogle.addEventListener('click', () => {
      const title = encodeURIComponent('Haven Chennai Game Jam — Registration Opening');
      const details = encodeURIComponent('Haven Chennai Game Jam organized by Team Spretech, Bridgethegap Organization & Hack Club Haven. 100% Free for teens in Chennai! Join Slack channel: https://hackclub.enterprise.slack.com/archives/C0C07T5LB60');
      const location = encodeURIComponent('Chennai, Tamil Nadu, India');
      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
      window.open(gcalUrl, '_blank');
    });
  }

  if (calIcs) {
    calIcs.addEventListener('click', () => {
      const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Haven Chennai Game Jam//Team Spretech x Bridgethegap x Hack Club//EN
BEGIN:VEVENT
SUMMARY:Haven Chennai Game Jam (Registration Reminder)
DESCRIPTION:The ultimate 48-hour game jam for teens in Chennai organized by Team Spretech, Bridgethegap Organization, and Hack Club Haven. Free food, prizes & game dev fun!
LOCATION:Chennai, India
END:VEVENT
END:VCALENDAR`;
      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', 'haven_chennai_gamejam_reminder.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  /* ------------------------------------------------------------------------
     8. Sponsor Inquiry Handler — Direct Mailto & Gmail Compose
     ------------------------------------------------------------------------ */
  const sponsorBtn = document.getElementById('btn-sponsor-inquiry');
  if (sponsorBtn) {
    sponsorBtn.addEventListener('click', (e) => {
      play8BitSound('click');
      const email = 'mohamedrayyanali21@gmail.com';
      const subject = encodeURIComponent('Haven Chennai Game Jam Sponsorship Inquiry');
      const body = encodeURIComponent('Hello Haven Chennai Team,\n\nWe are interested in sponsoring the Haven Chennai Game Jam organized by Team Spretech, Bridgethegap Organization, and Hack Club Haven.\n\nPlease share your sponsorship deck and details!\n\nBest regards,');
      
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
      window.open(gmailUrl, '_blank');
    });
  }

  /* ------------------------------------------------------------------------
     8. Mobile Navigation Toggle
     ------------------------------------------------------------------------ */
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    // Close menu when link clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }

});
