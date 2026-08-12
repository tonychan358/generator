// -------------------------------------------------------------
// flashcard.js - Core logic for student flashcard revision
// Features: Shuffling, 3D flip triggers, mastery scoring, and TTS.
// -------------------------------------------------------------

let studentName = '';
let activeQuestions = [];
let currentCardIndex = 0;
let masteryStatus = {}; // { shuffledIdx: 'mastered' | 'review' }
let startTime = null;
let voices = [];
let isSpeechInited = false;

let touchStartX = 0;
let touchEndX = 0;

function initSwipeEvents() {
  const deckWrapper = document.getElementById('deck-wrapper');
  if (!deckWrapper) return;
  
  // Clean up listeners if they exist by replacing the node (avoids double listeners)
  const newWrapper = deckWrapper.cloneNode(true);
  deckWrapper.parentNode.replaceChild(newWrapper, deckWrapper);
  
  newWrapper.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  newWrapper.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleGesture();
  }, { passive: true });
}

function handleGesture() {
  const swipeThreshold = 50;
  if (touchEndX < touchStartX - swipeThreshold) {
    nextCard();
  }
  if (touchEndX > touchStartX + swipeThreshold) {
    prevCard();
  }
}

// Initialize speech synthesis
window.addEventListener('DOMContentLoaded', () => {
  initSpeechSynthesis();
});

function initSpeechSynthesis() {
  if (typeof speechSynthesis === 'undefined') return;
  const loadVoices = () => {
    voices = speechSynthesis.getVoices();
    isSpeechInited = true;
  };
  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }
}

// Pronounce vocab/phrase (uses locked dictAccent: 'US' or 'GB')
function speak(text, btnElement, event) {
  if (event) {
    event.stopPropagation(); // Stop card from flipping when clicking audio btn
  }
  
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel(); // Stop current speech
  
  if (!text) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  const englishVoices = voices.filter(v => v.lang.startsWith('en'));
  
  let targetVoice = null;
  if (dictAccent === 'GB') {
    targetVoice = englishVoices.find(v => 
      v.lang.toLowerCase().includes('gb') || 
      v.lang.toLowerCase().includes('uk') || 
      v.name.toLowerCase().includes('great britain') ||
      v.name.toLowerCase().includes('united kingdom')
    );
  } else {
    // Default US Accent
    targetVoice = englishVoices.find(v => 
      v.lang.toLowerCase().includes('us') || 
      v.name.toLowerCase().includes('united states')
    );
  }
  
  if (targetVoice) {
    utterance.voice = targetVoice;
  } else if (englishVoices.length > 0) {
    utterance.voice = englishVoices[0]; // fallback
  }
  
  utterance.rate = 0.9; // Clear natural rate
  
  if (btnElement) {
    btnElement.classList.add('playing');
    utterance.onend = () => btnElement.classList.remove('playing');
    utterance.onerror = () => btnElement.classList.remove('playing');
  }
  
  speechSynthesis.speak(utterance);
}

// Welcome Lobby input check
function toggleStartButton() {
  const nameVal = document.getElementById('student-name').value.trim();
  const btn = document.getElementById('btn-start-revision');
  btn.disabled = nameVal.length === 0;
}

// Start Revision Mode
function startRevision() {
  const nameVal = document.getElementById('student-name').value.trim();
  if (!nameVal) return;
  
  studentName = nameVal;
  startTime = new Date();
  
  // Shuffle cards
  activeQuestions = [...rawQuestions]
    .map((q, idx) => ({ ...q, originalIndex: idx }))
    .sort(() => 0.5 - Math.random());
    
  currentCardIndex = 0;
  masteryStatus = {};
  
  // Switch Views
  document.getElementById('lobby-section').style.display = 'none';
  document.getElementById('arena-section').style.display = 'block';
  document.getElementById('stats-bar').style.display = 'flex';
  document.getElementById('nav-grid-container').style.display = 'flex';
  
  renderCard();
  renderNavGrid();
  updateStatsBar();
  initSwipeEvents();
}

// Generate the Flashcard Deck HTML & Handlers
function renderCard() {
  const container = document.getElementById('deck-wrapper');
  container.innerHTML = '';
  
  const q = activeQuestions[currentCardIndex];
  if (!q) return;
  
  const deckContainer = document.createElement('div');
  deckContainer.className = 'deck-container';
  
  // Card HTML structure. Card flips on click.
  // Uses configured default face: 'word' (Word First) or 'meaning' (Explanation First).
  const startFlipped = (initialCardFace === 'meaning');
  
  deckContainer.innerHTML = `
    <div class="card-inner ${startFlipped ? 'flipped' : ''}" id="card-inner-element" onclick="flipCard()">
      <!-- FRONT SIDE (English Word/Phrase) -->
      <div class="card-face card-front">
        <span class="card-side-badge">English Word</span>
        <div class="vocab-word">${q.eng}</div>
        <button class="audio-btn" id="card-audio-btn" onclick="speak(activeQuestions[${currentCardIndex}].eng, this, event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </button>
        <div class="click-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
          Click card to Flip
        </div>
      </div>
      <!-- BACK SIDE (Chinese Meaning/Explanation) -->
      <div class="card-face card-back">
        <span class="card-side-badge">Explanation / Meaning</span>
        <div class="vocab-meaning">${q.chi || '(No explanation provided)'}</div>
        <div class="click-hint" style="margin-top: 1rem;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
          Click card to Flip
        </div>
      </div>
    </div>
  `;
  
  container.appendChild(deckContainer);
  
  // Render navigation below cards
  const isFirst = (currentCardIndex === 0);
  const isLast = (currentCardIndex === activeQuestions.length - 1);
  
  const navContainer = document.getElementById('nav-controls-wrapper');
  navContainer.innerHTML = `
    <div class="navigation-controls">
      <button class="btn-nav" onclick="prevCard()" ${isFirst ? 'disabled' : ''}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Prev
      </button>
      <span class="card-index-indicator">Card ${currentCardIndex + 1} of ${activeQuestions.length}</span>
      <button class="btn-nav" onclick="nextCard()" ${isLast ? 'disabled' : ''}>
        Next
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
      </button>
    </div>
  `;
  
  // Render mastery buttons
  const masteryContainer = document.getElementById('mastery-buttons-wrapper');
  masteryContainer.innerHTML = `
    <div class="mastery-row">
      <button class="btn-mastery btn-need-review" onclick="markStatus('review')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
        Still Learning
      </button>
      <button class="btn-mastery btn-mastered" onclick="markStatus('mastered')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Mastered
      </button>
    </div>
  `;

  // Dynamic sound trigger
  // If the initial side facing the student is 'word', pronounce it automatically after page finishes layout.
  if (initialCardFace === 'word') {
    setTimeout(() => {
      const spk = document.getElementById('card-audio-btn');
      if (spk) speak(q.eng, spk);
    }, 150);
  }
}

// Flip Card Action
function flipCard() {
  const cardInner = document.getElementById('card-inner-element');
  if (cardInner) {
    cardInner.classList.toggle('flipped');
    
    // Pronounce the word when flipping to the front side if it hasn't been played
    const isFlipped = cardInner.classList.contains('flipped');
    if ((initialCardFace === 'word' && !isFlipped) || (initialCardFace === 'meaning' && isFlipped)) {
      // Meaning side or front side sound triggers
      // We only pronounce English word
    } else {
      setTimeout(() => {
        const spk = document.getElementById('card-audio-btn');
        if (spk) speak(activeQuestions[currentCardIndex].eng, spk);
      }, 100);
    }
  }
}

// Jump navigation grids
function renderNavGrid() {
  const grid = document.getElementById('nav-grid-container');
  grid.innerHTML = '';
  
  activeQuestions.forEach((_, idx) => {
    const btn = document.createElement('button');
    btn.className = 'nav-item';
    btn.innerText = idx + 1;
    btn.id = `nav-item-${idx}`;
    
    if (idx === currentCardIndex) {
      btn.classList.add('active');
    }
    
    if (masteryStatus[idx] === 'mastered') {
      btn.classList.add('mastered');
    } else if (masteryStatus[idx] === 'review') {
      btn.classList.add('need-review');
    }
    
    btn.onclick = () => {
      jumpToCard(idx);
    };
    
    grid.appendChild(btn);
  });
  
  // Auto-scroll active item into view inside the horizontally scrolling bar
  const activeItem = document.getElementById(`nav-item-${currentCardIndex}`);
  if (activeItem) {
    activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

function jumpToCard(idx) {
  currentCardIndex = idx;
  renderCard();
  renderNavGrid();
  updateStatsBar();
}

function prevCard() {
  if (currentCardIndex > 0) {
    currentCardIndex--;
    renderCard();
    renderNavGrid();
    updateStatsBar();
  }
}

function nextCard() {
  if (currentCardIndex < activeQuestions.length - 1) {
    currentCardIndex++;
    renderCard();
    renderNavGrid();
    updateStatsBar();
  }
}

// Mark status ('mastered' or 'review') and auto-advance
function markStatus(status) {
  masteryStatus[currentCardIndex] = status;
  renderNavGrid();
  updateStatsBar();
  
  // Auto-advance to next card with slight delay for UX
  if (currentCardIndex < activeQuestions.length - 1) {
    setTimeout(() => {
      nextCard();
    }, 250);
  } else {
    // Last card completed - ask student to review or finalize
    const allAssessed = Object.keys(masteryStatus).length === activeQuestions.length;
    if (allAssessed) {
      setTimeout(() => {
        showSummary();
      }, 300);
    }
  }
}

// Progress and stats bar update
function updateStatsBar() {
  const total = activeQuestions.length;
  const masteredCount = Object.values(masteryStatus).filter(v => v === 'mastered').length;
  const reviewCount = Object.values(masteryStatus).filter(v => v === 'review').length;
  
  document.getElementById('progress-text').innerText = `Card Progress: ${currentCardIndex + 1} / ${total}`;
  document.getElementById('mastered-count-badge').innerHTML = `<span class="stat-dot mastered"></span>Mastered: ${masteredCount}`;
  document.getElementById('review-count-badge').innerHTML = `<span class="stat-dot need-review"></span>Learning: ${reviewCount}`;
}

// Show final review screen
function showSummary() {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  
  const endTime = new Date();
  const timeDiff = Math.max(1, Math.round((endTime - startTime) / 1000)); // in seconds
  
  let formattedTime = '';
  if (timeDiff < 60) {
    formattedTime = `${timeDiff}s`;
  } else {
    const mins = Math.floor(timeDiff / 60);
    const secs = timeDiff % 60;
    formattedTime = `${mins}m ${secs}s`;
  }
  
  const total = activeQuestions.length;
  const masteredCount = Object.values(masteryStatus).filter(v => v === 'mastered').length;
  const pct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;
  
  // View switches
  document.getElementById('arena-section').style.display = 'none';
  document.getElementById('stats-bar').style.display = 'none';
  document.getElementById('nav-grid-container').style.display = 'none';
  
  const summarySec = document.getElementById('summary-section');
  summarySec.style.display = 'block';
  
  // Text details
  document.getElementById('summary-student-display').innerText = `Student: ${studentName}`;
  document.getElementById('summary-score-value').innerText = `${pct}%`;
  document.getElementById('summary-comment-text').innerText = getRevisionComment(pct, formattedTime);
  
  document.getElementById('summary-mastered-val').innerText = masteredCount;
  document.getElementById('summary-review-val').innerText = total - masteredCount;
  
  const circle = document.getElementById('summary-circle-el');
  if (pct === 100) {
    circle.classList.add('perfect');
  } else {
    circle.classList.remove('perfect');
  }
  
  // Render detailed list of Mastered and Needs-Review cards
  const reviewContainer = document.getElementById('review-list-container');
  reviewContainer.innerHTML = '';
  
  const reviewTitle = document.createElement('h3');
  reviewTitle.className = 'review-title-text';
  reviewTitle.innerText = "Revision List Details";
  reviewContainer.appendChild(reviewTitle);
  
  const cardList = document.createElement('div');
  cardList.className = 'review-card-list';
  
  activeQuestions.forEach((q, idx) => {
    const status = masteryStatus[idx] || 'review';
    const isMastered = (status === 'mastered');
    
    const item = document.createElement('div');
    item.className = `review-item ${isMastered ? 'mastered' : 'need-review'}`;
    
    item.innerHTML = `
      <div class="review-icon-status ${isMastered ? 'mastered' : 'need-review'}">
        ${isMastered 
          ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>`
        }
      </div>
      <div class="review-vocab-details">
        <span class="review-word">${q.eng}</span>
        <span class="review-meaning">${q.chi || '(No translation)'}</span>
      </div>
      <button class="review-play-btn" onclick="speak(activeQuestions[${idx}].eng, this, event)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      </button>
    `;
    cardList.appendChild(item);
  });
  
  reviewContainer.appendChild(cardList);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getRevisionComment(pct, timeStr) {
  if (pct === 100) return `Brilliant! You mastered all cards in ${timeStr}!`;
  if (pct >= 80) return `Well done! Almost perfect in ${timeStr}! Keep up the good work.`;
  if (pct >= 50) return `Good effort! You've mastered half the deck in ${timeStr}. Keep revising!`;
  return `Revising takes time. Try again to boost your memory! Time: ${timeStr}.`;
}

// Restart revision
function resetRevision() {
  studentName = '';
  activeQuestions = [];
  currentCardIndex = 0;
  masteryStatus = {};
  
  document.getElementById('summary-section').style.display = 'none';
  document.getElementById('arena-section').style.display = 'none';
  document.getElementById('stats-bar').style.display = 'none';
  document.getElementById('nav-grid-container').style.display = 'none';
  
  document.getElementById('lobby-section').style.display = 'flex';
  document.getElementById('student-name').value = '';
  toggleStartButton();
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
