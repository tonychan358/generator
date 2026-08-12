// -------------------------------------------------------------
// flashcard.js - Chinese Flashcard revisions with Hanzi Writer
// Features: Dynamic Cantonese/Putonghua speech, multiple-character tabbed stroke order.
// -------------------------------------------------------------

let studentName = '';
let activeQuestions = [];
let currentCardIndex = 0;
let masteryStatus = {}; // { shuffledIdx: 'mastered' | 'review' }
let startTime = null;
let voices = [];
let writerInstance = null;
let strokeModeActive = false;
let currentStrokeChar = '';

// Default primary color mapping for HanziWriter strokes
const themeHexColor = '/* {{THEME_PRIMARY}} */' || '#0284c7';

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

window.addEventListener('DOMContentLoaded', () => {
  initSpeechSynthesis();
});

function initSpeechSynthesis() {
  if (typeof speechSynthesis === 'undefined') return;
  const loadVoices = () => {
    voices = speechSynthesis.getVoices();
  };
  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }
}

// Speak Chinese text (Cantonese 'zh-HK' or Putonghua 'zh-CN')
function speak(text, btnElement, event) {
  if (event) event.stopPropagation(); // Prevent flipping
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  
  if (!text) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  const chineseVoices = voices.filter(v => v.lang.startsWith('zh') || v.lang.startsWith('cs') || v.lang.startsWith('zt'));
  
  let targetVoice = null;
  if (dictAccent === 'Cantonese') {
    // Cantonese search
    targetVoice = chineseVoices.find(v => 
      v.lang.toLowerCase().includes('hk') || 
      v.name.toLowerCase().includes('cantonese') ||
      v.name.toLowerCase().includes('hong kong')
    );
  } else {
    // Putonghua/Mandarin search
    targetVoice = chineseVoices.find(v => 
      v.lang.toLowerCase().includes('cn') || 
      v.lang.toLowerCase().includes('zh-tw') || 
      v.name.toLowerCase().includes('mandarin') || 
      v.name.toLowerCase().includes('putonghua') ||
      v.name.toLowerCase().includes('mainland')
    );
  }
  
  if (targetVoice) {
    utterance.voice = targetVoice;
  } else if (chineseVoices.length > 0) {
    utterance.voice = chineseVoices[0]; // fallback
  }
  
  utterance.rate = 0.85; // slightly slower for clear listening
  
  if (btnElement) {
    btnElement.classList.add('playing');
    utterance.onend = () => btnElement.classList.remove('playing');
    utterance.onerror = () => btnElement.classList.remove('playing');
  }
  
  speechSynthesis.speak(utterance);
}

// Input checks
function toggleStartButton() {
  const nameVal = document.getElementById('student-name').value.trim();
  const btn = document.getElementById('btn-start-revision');
  btn.disabled = nameVal.length === 0;
}

// Start Studying
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
  strokeModeActive = false;
  
  document.getElementById('lobby-section').style.display = 'none';
  document.getElementById('arena-section').style.display = 'block';
  document.getElementById('stats-bar').style.display = 'flex';
  document.getElementById('nav-grid-container').style.display = 'flex';
  
  renderCard();
  renderNavGrid();
  updateStatsBar();
  initSwipeEvents();
}

// Render Card Deck
function renderCard() {
  const container = document.getElementById('deck-wrapper');
  container.innerHTML = '';
  
  const q = activeQuestions[currentCardIndex];
  if (!q) return;
  
  // Reset stroke modes when loading new card
  strokeModeActive = false;
  writerInstance = null;
  
  const deckContainer = document.createElement('div');
  deckContainer.className = 'deck-container';
  
  deckContainer.innerHTML = `
    <div class="card-inner" id="card-inner-element" onclick="flipCard()">
      <!-- FRONT FACE -->
      <div class="card-face card-front">
        <span class="card-side-badge">中文漢字</span>
        
        <!-- Controls Overlay -->
        <div class="action-buttons-overlay">
          <button class="btn-overlay-action" id="card-audio-btn" title="播放發音" onclick="speak(activeQuestions[${currentCardIndex}].eng, this, event)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          </button>
          <button class="btn-overlay-action" id="card-stroke-btn" title="查看筆劃" onclick="toggleStrokeView(event)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
        </div>

        <!-- Normal Text vs Stroke Animation Content -->
        <div class="char-container" id="front-char-content">
          <div class="chinese-char" id="static-chinese-text">${q.eng}</div>
        </div>

        <div class="click-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
          點擊字卡翻面
        </div>
      </div>
      
      <!-- BACK FACE -->
      <div class="card-face card-back">
        <span class="card-side-badge">英文解釋 (Meaning)</span>
        <div class="char-container">
          <div class="english-meaning">${q.chi || '(No translation provided)'}</div>
        </div>
        <div class="click-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
          點擊字卡翻面
        </div>
      </div>
    </div>
  `;
  
  container.appendChild(deckContainer);
  
  // Render buttons
  const isFirst = (currentCardIndex === 0);
  const isLast = (currentCardIndex === activeQuestions.length - 1);
  
  const navContainer = document.getElementById('nav-controls-wrapper');
  navContainer.innerHTML = `
    <div class="navigation-controls">
      <button class="btn-nav" onclick="prevCard()" ${isFirst ? 'disabled' : ''}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        上一張
      </button>
      <span class="card-index-indicator">字卡：${currentCardIndex + 1} / ${activeQuestions.length}</span>
      <button class="btn-nav" onclick="nextCard()" ${isLast ? 'disabled' : ''}>
        下一張
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
      </button>
    </div>
  `;
  
  const masteryContainer = document.getElementById('mastery-buttons-wrapper');
  masteryContainer.innerHTML = `
    <div class="mastery-row">
      <button class="btn-mastery btn-need-review" onclick="markStatus('review')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
        溫習中
      </button>
      <button class="btn-mastery btn-mastered" onclick="markStatus('mastered')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        已學會
      </button>
    </div>
  `;

  // Autoplay character sound when loading card
  setTimeout(() => {
    const spk = document.getElementById('card-audio-btn');
    if (spk) speak(q.eng, spk);
  }, 200);
}

// Flip Card Deck
function flipCard() {
  // If clicking on stroke player control buttons, don't flip
  const cardInner = document.getElementById('card-inner-element');
  if (cardInner) {
    cardInner.classList.toggle('flipped');
    
    // When flipping back to front, reset from stroke mode back to static text for clear reading
    if (!cardInner.classList.contains('flipped') && strokeModeActive) {
      setTimeout(() => {
        resetToTextMode();
      }, 300);
    }
  }
}

// Toggle Stroke view
function toggleStrokeView(event) {
  if (event) event.stopPropagation(); // Stop card flip
  
  const contentArea = document.getElementById('front-char-content');
  const wordText = activeQuestions[currentCardIndex].eng;
  
  if (!strokeModeActive) {
    strokeModeActive = true;
    
    // Parse characters. Hanzi Writer animates one character.
    // If it's a multi-character word (e.g. 學習), render tabs to select character.
    let tabHtml = '';
    const chars = Array.from(wordText).filter(c => /[\u4e00-\u9fa5]/.test(c));
    
    if (chars.length === 0) {
      // Fallback if no Chinese characters detected
      chars.push(wordText.charAt(0));
    }
    
    currentStrokeChar = chars[0];
    
    if (chars.length > 1) {
      tabHtml = `<div class="stroke-ctrl-row" style="margin-bottom: 0.5rem; flex-wrap: wrap; justify-content: center;">`;
      chars.forEach((c, idx) => {
        tabHtml += `
          <button class="btn-stroke-ctrl" style="${idx === 0 ? 'background-color: var(--primary-light); color: var(--primary-color); border: 1px solid var(--primary-color);' : ''}" 
                  id="stroke-tab-${idx}" onclick="switchStrokeTab('${c}', ${idx}, ${chars.length}, event)">
            ${c}
          </button>
        `;
      });
      tabHtml += `</div>`;
    }
    
    contentArea.innerHTML = `
      <div class="stroke-wrapper" onclick="event.stopPropagation()">
        ${tabHtml}
        <div class="stroke-grid-bg" id="character-stroke-target"></div>
        <div class="stroke-ctrl-row">
          <button class="btn-stroke-ctrl" onclick="replayStroke(event)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
            重播
          </button>
          <button class="btn-stroke-ctrl" onclick="resetToTextMode(event)" style="background-color: #fee2e2; color: #ef4444;">
            返回漢字
          </button>
        </div>
      </div>
    `;
    
    loadStrokeAnimation(currentStrokeChar);
  } else {
    resetToTextMode();
  }
}

// Switch character tab
function switchStrokeTab(char, index, total, event) {
  if (event) event.stopPropagation();
  currentStrokeChar = char;
  
  // Highlight active tab
  for (let i = 0; i < total; i++) {
    const tab = document.getElementById(`stroke-tab-${i}`);
    if (tab) {
      if (i === index) {
        tab.style.backgroundColor = 'var(--primary-light)';
        tab.style.color = 'var(--primary-color)';
        tab.style.borderColor = 'var(--primary-color)';
      } else {
        tab.style.backgroundColor = '';
        tab.style.color = '';
        tab.style.borderColor = '';
      }
    }
  }
  
  loadStrokeAnimation(currentStrokeChar);
}

// Revert back to static text view
function resetToTextMode(event) {
  if (event) event.stopPropagation();
  strokeModeActive = false;
  writerInstance = null;
  
  const contentArea = document.getElementById('front-char-content');
  if (contentArea) {
    contentArea.innerHTML = `<div class="chinese-char" id="static-chinese-text">${activeQuestions[currentCardIndex].eng}</div>`;
  }
}

// Trigger stroke rendering
function loadStrokeAnimation(char) {
  const target = document.getElementById('character-stroke-target');
  if (!target) return;
  target.innerHTML = '';
  
  if (typeof HanziWriter !== 'undefined') {
    try {
      writerInstance = HanziWriter.create('character-stroke-target', char, {
        width: 130,
        height: 130,
        padding: 5,
        strokeColor: themeHexColor,
        outlineColor: '#e2e8f0',
        drawingColor: themeHexColor,
        showOutline: true,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 350
      });
      writerInstance.animateCharacter();
    } catch (e) {
      renderOfflineFallback(char, target);
    }
  } else {
    renderOfflineFallback(char, target);
  }
}

function renderOfflineFallback(char, target) {
  target.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0.5rem;">
      <div class="offline-char">${char}</div>
      <div style="font-size: 0.7rem; color: #ef4444; margin-top: 0.25rem; font-weight: 600;">離線狀態 - 無法載入筆劃</div>
    </div>
  `;
}

function replayStroke(event) {
  if (event) event.stopPropagation();
  if (writerInstance) {
    writerInstance.animateCharacter();
  }
}

// Navigation grids
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

// Mark cards
function markStatus(status) {
  masteryStatus[currentCardIndex] = status;
  renderNavGrid();
  updateStatsBar();
  
  if (currentCardIndex < activeQuestions.length - 1) {
    setTimeout(() => {
      nextCard();
    }, 250);
  } else {
    // Check if everything assessed
    const allAssessed = Object.keys(masteryStatus).length === activeQuestions.length;
    if (allAssessed) {
      setTimeout(() => {
        showSummary();
      }, 300);
    }
  }
}

function updateStatsBar() {
  const total = activeQuestions.length;
  const masteredCount = Object.values(masteryStatus).filter(v => v === 'mastered').length;
  const reviewCount = Object.values(masteryStatus).filter(v => v === 'review').length;
  
  document.getElementById('progress-text').innerText = `字卡進度：${currentCardIndex + 1} / ${total}`;
  document.getElementById('mastered-count-badge').innerHTML = `<span class="stat-dot mastered"></span>已學會：${masteredCount}`;
  document.getElementById('review-count-badge').innerHTML = `<span class="stat-dot need-review"></span>溫習中：${reviewCount}`;
}

// Final Summary
function showSummary() {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  
  const endTime = new Date();
  const timeDiff = Math.max(1, Math.round((endTime - startTime) / 1000));
  
  let formattedTime = '';
  if (timeDiff < 60) {
    formattedTime = `${timeDiff}秒`;
  } else {
    const mins = Math.floor(timeDiff / 60);
    const secs = timeDiff % 60;
    formattedTime = `${mins}分 ${secs}秒`;
  }
  
  const total = activeQuestions.length;
  const masteredCount = Object.values(masteryStatus).filter(v => v === 'mastered').length;
  const pct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;
  
  document.getElementById('arena-section').style.display = 'none';
  document.getElementById('stats-bar').style.display = 'none';
  document.getElementById('nav-grid-container').style.display = 'none';
  
  const summarySec = document.getElementById('summary-section');
  summarySec.style.display = 'block';
  
  document.getElementById('summary-student-display').innerText = `學生：${studentName}`;
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
  
  // Render review lists
  const reviewContainer = document.getElementById('review-list-container');
  reviewContainer.innerHTML = '';
  
  const reviewTitle = document.createElement('h3');
  reviewTitle.className = 'review-title-text';
  reviewTitle.innerText = "識字溫習清單明細";
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
        <span class="review-meaning">${q.chi || '(無解釋)'}</span>
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
  if (pct === 100) return `太棒了！你在 ${timeStr} 內記住了所有漢字！`;
  if (pct >= 80) return `非常出色！你在 ${timeStr} 內完成了溫習，已掌握大部分漢字。`;
  if (pct >= 50) return `做得好！你已掌握了約一半的漢字。溫習用時：${timeStr}。`;
  return `繼續加油！多花點時間溫習能加深漢字記憶。用時：${timeStr}。`;
}

// Reset
function resetRevision() {
  studentName = '';
  activeQuestions = [];
  currentCardIndex = 0;
  masteryStatus = {};
  strokeModeActive = false;
  writerInstance = null;
  
  document.getElementById('summary-section').style.display = 'none';
  document.getElementById('arena-section').style.display = 'none';
  document.getElementById('stats-bar').style.display = 'none';
  document.getElementById('nav-grid-container').style.display = 'none';
  
  document.getElementById('lobby-section').style.display = 'flex';
  document.getElementById('student-name').value = '';
  toggleStartButton();
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
