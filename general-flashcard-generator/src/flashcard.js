// -------------------------------------------------------------
// flashcard.js - 通用字卡溫習邏輯與語音控制 (中英切換版)
// 支持單語/雙語模式、第一次加載自動朗讀、靜態靜音按鈕與純前端 Canvas 證書生圖下載
// -------------------------------------------------------------

let studentName = '';
let activeQuestions = [];
let currentCardIndex = 0;
let masteryStatus = {}; // { shuffledIdx: 'mastered' | 'review' }
let startTime = null;
let voices = [];
let isSpeechInited = false;
let cardStates = []; // 記錄每張卡片當前朝向：'front' | 'back'

// 語音播放狀態與第一次播放標記
let isMuted = false;
let hasAutoSpokenThisCard = false;

// 學生端當前語系 ('zh' 或 'en')
let currentStudentLang = 'zh';

let touchStartX = 0;
let touchEndX = 0;

// 學生端多語系字串對照
const studentTranslations = {
  'zh': {
    lobbyBadge: '自主學習字卡',
    nameLabel: '學生姓名',
    namePlaceholder: '請輸入姓名',
    btnStart: '開始溫習',
    cardFrontBadge: '正面',
    cardBackBadge: '背面',
    clickFlipHint: '點擊字卡翻面',
    btnPrev: '上一張',
    btnNext: '下一張',
    cardIndicator: '字卡',
    btnNeedReview: '仍需溫習',
    btnMastered: '已學會',
    progressText: '溫習進度',
    masteredBadgeText: '已學會',
    reviewBadgeText: '需溫習',
    summaryHeader: '溫習挑戰完成！',
    summaryScoreLabel: '掌握度',
    summaryMasteredLabel: '已學會',
    summaryReviewLabel: '需溫習',
    btnRestart: '重新溫習',
    btnPrint: '儲存證書圖片',
    reviewTitleText: '複習卡牌清單詳情',
    noContent: '(無內容)',
    studentDisplayLabel: '學生姓名',
    certBadge: '榮譽學習證書',
    certBodyText: '茲證明學生 <span class="cert-name">{name}</span> 於本系統完成了以下學科溫習：',
    certFooterText: '以高達 <strong style="color: #10b981; font-size: 1.6rem;">{pct}%</strong> 的熟練度成功通過溫習挑戰，用時 {time}。特發此證，以資鼓勵！',
    certMeta: 'This certifies that the student has completed the flashcard revision deck successfully.',
    certSignDate: '溫習日期 Date',
    certSignSig: '系統簽署 Signature',
    comment100: '太棒了！你用 {time} 記住了所有字卡！',
    comment80: '非常出色！在 {time} 內完成了溫習，只差一點點就完美了！',
    comment50: '做得好！在 {time} 內掌握了超過一半的字卡，繼續加油！',
    comment0: '加油！溫習需要時間積累，再次挑戰以加深記憶吧！用時: {time}。',
    langToggleBtnText: 'English',
    soundOn: '有聲',
    soundOff: '已靜音'
  },
  'en': {
    lobbyBadge: 'Self-Study Flashcards',
    nameLabel: 'Student Name',
    namePlaceholder: 'Enter your name',
    btnStart: 'Start Revision',
    cardFrontBadge: 'Front',
    cardBackBadge: 'Back',
    clickFlipHint: 'Click Card to Flip',
    btnPrev: 'Prev',
    btnNext: 'Next',
    cardIndicator: 'Card',
    btnNeedReview: 'Still Learning',
    btnMastered: 'Mastered',
    progressText: 'Progress',
    masteredBadgeText: 'Mastered',
    reviewBadgeText: 'Learning',
    summaryHeader: 'Revision Completed!',
    summaryScoreLabel: 'Mastery',
    summaryMasteredLabel: 'Mastered',
    summaryReviewLabel: 'Learning',
    btnRestart: 'Restart Revision',
    btnPrint: 'Save Certificate',
    reviewTitleText: 'Revision List Details',
    noContent: '(No content)',
    studentDisplayLabel: 'Student Name',
    certBadge: 'Certificate of Achievement',
    certBodyText: 'This is to certify that the student <span class="cert-name">{name}</span> has completed the revision deck:',
    certFooterText: 'And has successfully passed with <strong style="color: #10b981; font-size: 1.6rem;">{pct}%</strong> mastery, in a duration of {time}. Keep up the great work!',
    certMeta: 'This certifies that the student has completed the flashcard revision deck successfully.',
    certSignDate: 'Date',
    certSignSig: 'Signature',
    comment100: 'Brilliant! You mastered all cards in {time}!',
    comment80: 'Well done! Almost perfect in {time}! Keep up the good work.',
    comment50: 'Good effort! You\'ve mastered half the deck in {time}. Keep revising!',
    comment0: 'Revising takes time. Try again to boost your memory! Time: {time}.',
    langToggleBtnText: '繁體中文',
    soundOn: 'Sound On',
    soundOff: 'Muted'
  }
};

function initSwipeEvents() {
  const deckWrapper = document.getElementById('deck-wrapper');
  if (!deckWrapper) return;
  
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

// 初始化本地語音引擎
window.addEventListener('DOMContentLoaded', () => {
  initSpeechSynthesis();
  initApp();
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

// 智慧發音功能
function speak(text, btnElement, event) {
  if (event) {
    event.stopPropagation();
  }
  
  if (isMuted) return;
  
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  
  if (!text || ttsSetting === 'none') return;
  
  let activeLang = 'en-US';
  if (studyMode === 'chinese') {
    activeLang = 'zh-HK';
  } else if (studyMode === 'english') {
    activeLang = 'en-US';
  } else if (studyMode === 'bilingual') {
    const containsChinese = /[\u4e00-\u9fa5]/.test(text);
    activeLang = containsChinese ? 'zh-HK' : 'en-US';
  }
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  let targetVoice = null;
  if (activeLang === 'zh-HK') {
    const chineseVoices = voices.filter(v => v.lang.startsWith('zh') || v.lang.startsWith('cs') || v.lang.startsWith('zt'));
    targetVoice = chineseVoices.find(v => 
      v.lang.toLowerCase().includes('hk') || 
      v.name.toLowerCase().includes('cantonese') ||
      v.name.toLowerCase().includes('hong kong')
    ) || chineseVoices[0];
  } else {
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    targetVoice = englishVoices.find(v => 
      v.lang.toLowerCase().includes('us') || 
      v.name.toLowerCase().includes('united states')
    );
    if (!targetVoice && englishVoices.length > 0) {
      targetVoice = englishVoices[0];
    }
  }
  
  if (targetVoice) {
    utterance.voice = targetVoice;
  }
  utterance.lang = activeLang;
  utterance.rate = 0.9;
  
  if (btnElement) {
    btnElement.classList.add('playing');
    utterance.onend = () => btnElement.classList.remove('playing');
    utterance.onerror = () => btnElement.classList.remove('playing');
  }
  
  speechSynthesis.speak(utterance);
}

// 監聽 Lobby 姓名輸入
function toggleStartButton() {
  const nameInput = document.getElementById('student-name');
  if (!nameInput) return;
  const nameVal = nameInput.value.trim();
  const btn = document.getElementById('btn-start-revision');
  if (btn) btn.disabled = nameVal.length === 0;
}

// 切換學生端語言
function toggleStudentLanguage() {
  currentStudentLang = currentStudentLang === 'zh' ? 'en' : 'zh';
  applyStudentLanguage();
  updateMuteButton();
  
  if (document.getElementById('arena-section').style.display === 'block') {
    renderCard();
    renderNavGrid();
    updateStatsBar();
  } else if (document.getElementById('summary-section').style.display === 'block') {
    showSummary();
  }
}

// 靜音切換
function toggleMute() {
  isMuted = !isMuted;
  if (isMuted && typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel();
  }
  updateMuteButton();
}

function updateMuteButton() {
  const btn = document.getElementById('btn-mute-toggle');
  if (!btn) return;
  
  const trans = studentTranslations[currentStudentLang];
  
  const svgIcon = isMuted 
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
         <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
         <line x1="23" y1="9" x2="17" y2="15"></line>
         <line x1="17" y1="9" x2="23" y2="15"></line>
       </svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
         <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
         <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
       </svg>`;
       
  const btnText = isMuted ? trans.soundOff : trans.soundOn;
  btn.innerHTML = `${svgIcon}<span>${btnText}</span>`;
}

// 套用語系文字至 UI
function applyStudentLanguage() {
  const trans = studentTranslations[currentStudentLang];
  
  const switcher = document.getElementById('btn-student-lang-toggle');
  if (switcher) {
    switcher.style.display = studyMode === 'bilingual' ? 'flex' : 'none';
  }
  
  const switcherText = document.getElementById('student-lang-btn-text');
  if (switcherText) switcherText.innerText = trans.langToggleBtnText;
  
  // Lobby
  document.getElementById('lobby-badge-el').innerText = trans.lobbyBadge;
  document.getElementById('student-name-label').innerText = trans.nameLabel;
  document.getElementById('student-name').placeholder = trans.namePlaceholder;
  document.getElementById('btn-start-revision').innerText = trans.btnStart;
  
  if (studyMode === 'bilingual') {
    document.getElementById('lobby-title-el').innerText = currentStudentLang === 'zh' ? titleZh : titleEn;
    document.getElementById('lobby-subject-el').innerText = currentStudentLang === 'zh' ? subjectZh : subjectEn;
    document.title = (currentStudentLang === 'zh' ? titleZh : titleEn) + ' - ' + (currentStudentLang === 'zh' ? subjectZh : subjectEn);
  } else if (studyMode === 'english') {
    document.getElementById('lobby-title-el').innerText = titleEn;
    document.getElementById('lobby-subject-el').innerText = subjectEn;
  } else {
    document.getElementById('lobby-title-el').innerText = titleZh;
    document.getElementById('lobby-subject-el').innerText = subjectZh;
  }
  
  // Summary
  document.getElementById('summary-header-el').innerText = trans.summaryHeader;
  document.getElementById('summary-circle-label-el').innerText = trans.summaryScoreLabel;
  document.getElementById('summary-mastered-label-el').innerText = trans.summaryMasteredLabel;
  document.getElementById('summary-review-label-el').innerText = trans.summaryReviewLabel;
  document.getElementById('btn-restart-label-el').innerText = trans.btnRestart;
  document.getElementById('btn-print-label-el').innerText = trans.btnPrint;
}

// 初始化應用程式
function initApp() {
  if (studyMode === 'english') {
    currentStudentLang = 'en';
  } else {
    currentStudentLang = 'zh'; 
  }
  
  applyStudentLanguage();
  updateMuteButton();
  
  document.getElementById('lobby-section').style.display = 'flex';
  document.getElementById('arena-section').style.display = 'none';
  document.getElementById('stats-bar').style.display = 'none';
  document.getElementById('nav-grid-container').style.display = 'none';
  document.getElementById('summary-section').style.display = 'none';
}

// 學生點擊開始
function startRevision() {
  const nameInput = document.getElementById('student-name');
  const nameVal = nameInput ? nameInput.value.trim() : '';
  if (!nameVal) return;
  
  studentName = nameVal;
  startTime = new Date();
  prepareDeck();
  
  document.getElementById('lobby-section').style.display = 'none';
  document.getElementById('arena-section').style.display = 'block';
  document.getElementById('stats-bar').style.display = 'flex';
  document.getElementById('nav-grid-container').style.display = 'flex';
  
  renderCard();
  renderNavGrid();
  updateStatsBar();
  initSwipeEvents();
}

// 洗牌與準備題目
function prepareDeck() {
  activeQuestions = [...rawQuestions]
    .map((q, idx) => ({ ...q, originalIndex: idx }))
    .sort(() => 0.5 - Math.random());
    
  currentCardIndex = 0;
  masteryStatus = {};
  
  cardStates = activeQuestions.map(() => 'front');
  hasAutoSpokenThisCard = false;
}

// 渲染單個字卡與導航
function renderCard() {
  const container = document.getElementById('deck-wrapper');
  container.innerHTML = '';
  
  const q = activeQuestions[currentCardIndex];
  if (!q) return;
  
  const deckContainer = document.createElement('div');
  deckContainer.className = 'deck-container';
  
  const currentFace = cardStates[currentCardIndex];
  const isFlipped = (currentFace === 'back');
  
  let frontText = '';
  let backText = '';
  
  if (studyMode === 'bilingual') {
    frontText = currentStudentLang === 'zh' ? q.frontZh : q.frontEn;
    backText = currentStudentLang === 'zh' ? q.backZh : q.backEn;
  } else {
    frontText = q.front;
    backText = q.back;
  }
  
  const showFrontAudio = ttsSetting !== 'none' && (ttsFace === 'front' || ttsFace === 'both');
  const showBackAudio = ttsSetting !== 'none' && (ttsFace === 'back' || ttsFace === 'both');
  
  const trans = studentTranslations[currentStudentLang];
  
  deckContainer.innerHTML = `
    <div class="card-inner ${isFlipped ? 'flipped' : ''}" id="card-inner-element" onclick="flipCard()">
      <!-- 正面卡牌 -->
      <div class="card-face card-front">
        <span class="card-side-badge">${trans.cardFrontBadge}</span>
        
        ${showFrontAudio ? `
        <div class="action-buttons-overlay">
          <button class="btn-overlay-action" id="card-front-audio" title="Speak" onclick="speak('${frontText.replace(/'/g, "\\'")}', this, event)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          </button>
        </div>` : ''}

        <div class="char-container">
          <div class="card-text">${frontText}</div>
        </div>

        <div class="click-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
          ${trans.clickFlipHint}
        </div>
      </div>
      
      <!-- 背面卡牌 -->
      <div class="card-face card-back">
        <span class="card-side-badge">${trans.cardBackBadge}</span>
        
        ${showBackAudio ? `
        <div class="action-buttons-overlay">
          <button class="btn-overlay-action" id="card-back-audio" title="Speak" onclick="speak('${backText.replace(/'/g, "\\'")}', this, event)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          </button>
        </div>` : ''}

        <div class="char-container">
          <div class="card-text">${backText || trans.noContent}</div>
        </div>

        <div class="click-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
          ${trans.clickFlipHint}
        </div>
      </div>
    </div>
  `;
  
  container.appendChild(deckContainer);
  
  const isFirst = (currentCardIndex === 0);
  const isLast = (currentCardIndex === activeQuestions.length - 1);
  
  const navContainer = document.getElementById('nav-controls-wrapper');
  navContainer.innerHTML = `
    <div class="navigation-controls">
      <button class="btn-nav" onclick="prevCard()" ${isFirst ? 'disabled' : ''}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        ${trans.btnPrev}
      </button>
      <span class="card-index-indicator">${trans.cardIndicator} ${currentCardIndex + 1} / ${activeQuestions.length}</span>
      <button class="btn-nav" onclick="nextCard()" ${isLast ? 'disabled' : ''}>
        ${trans.btnNext}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
      </button>
    </div>
  `;
  
  const masteryContainer = document.getElementById('mastery-buttons-wrapper');
  masteryContainer.innerHTML = `
    <div class="mastery-row">
      <button class="btn-mastery btn-need-review" onclick="markStatus('review')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
        ${trans.btnNeedReview}
      </button>
      <button class="btn-mastery btn-mastered" onclick="markStatus('mastered')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        ${trans.btnMastered}
      </button>
    </div>
  `;

  triggerAutoSpeak(q);
}

// 翻轉卡面 (不重新朗讀)
function flipCard() {
  const cardInner = document.getElementById('card-inner-element');
  if (cardInner) {
    cardInner.classList.toggle('flipped');
    const isFlippedNow = cardInner.classList.contains('flipped');
    cardStates[currentCardIndex] = isFlippedNow ? 'back' : 'front';
  }
}

// 自動語音朗讀邏輯 (僅朗讀一次)
function triggerAutoSpeak(q) {
  if (hasAutoSpokenThisCard) return;
  
  const currentFace = cardStates[currentCardIndex];
  let text = '';
  
  if (studyMode === 'bilingual') {
    text = currentFace === 'front' 
      ? (currentStudentLang === 'zh' ? q.frontZh : q.frontEn)
      : (currentStudentLang === 'zh' ? q.backZh : q.backEn);
  } else {
    text = currentFace === 'front' ? q.front : q.back;
  }
  
  setTimeout(() => {
    if (hasAutoSpokenThisCard) return;
    
    if (currentFace === 'front' && ttsSetting !== 'none' && (ttsFace === 'front' || ttsFace === 'both')) {
      const spk = document.getElementById('card-front-audio');
      if (spk) {
        speak(text, spk);
        hasAutoSpokenThisCard = true;
      }
    } else if (currentFace === 'back' && ttsSetting !== 'none' && (ttsFace === 'back' || ttsFace === 'both')) {
      const spk = document.getElementById('card-back-audio');
      if (spk) {
        speak(text, spk);
        hasAutoSpokenThisCard = true;
      }
    }
  }, 180);
}

// 導航網格
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
  
  const activeItem = document.getElementById(`nav-item-${currentCardIndex}`);
  if (activeItem) {
    activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

function jumpToCard(idx) {
  currentCardIndex = idx;
  hasAutoSpokenThisCard = false;
  renderCard();
  renderNavGrid();
  updateStatsBar();
}

function prevCard() {
  if (currentCardIndex > 0) {
    currentCardIndex--;
    hasAutoSpokenThisCard = false;
    renderCard();
    renderNavGrid();
    updateStatsBar();
  }
}

function nextCard() {
  if (currentCardIndex < activeQuestions.length - 1) {
    currentCardIndex++;
    hasAutoSpokenThisCard = false;
    renderCard();
    renderNavGrid();
    updateStatsBar();
  }
}

// 標記狀態並自動前進 (修正結算進入邏輯：不論 index 只要全標記就直接結算)
function markStatus(status) {
  masteryStatus[currentCardIndex] = status;
  renderNavGrid();
  updateStatsBar();
  
  // 不論當前 index 是多少，只要全部標記過就直接進入結果頁面
  const allAssessed = Object.keys(masteryStatus).length === activeQuestions.length;
  if (allAssessed) {
    setTimeout(() => {
      showSummary();
    }, 300);
    return;
  }
  
  // 未全標記完，若後面還有卡片則自動後移一張
  if (currentCardIndex < activeQuestions.length - 1) {
    setTimeout(() => {
      nextCard();
    }, 250);
  }
}

// 更新浮動狀態欄
function updateStatsBar() {
  const total = activeQuestions.length;
  const masteredCount = Object.values(masteryStatus).filter(v => v === 'mastered').length;
  const reviewCount = Object.values(masteryStatus).filter(v => v === 'review').length;
  
  const trans = studentTranslations[currentStudentLang];
  document.getElementById('progress-text').innerText = `${trans.progressText}: ${currentCardIndex + 1} / ${total}`;
  document.getElementById('mastered-count-badge').innerHTML = `<span class="stat-dot mastered"></span>${trans.masteredBadgeText}: ${masteredCount}`;
  document.getElementById('review-count-badge').innerHTML = `<span class="stat-dot need-review"></span>${trans.reviewBadgeText}: ${reviewCount}`;
}

// 結算畫面展示與證書渲染
function showSummary() {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  
  const endTime = new Date();
  const timeDiff = Math.max(1, Math.round((endTime - startTime) / 1000));
  
  let formattedTime = '';
  if (currentStudentLang === 'zh') {
    if (timeDiff < 60) {
      formattedTime = `${timeDiff} 秒`;
    } else {
      const mins = Math.floor(timeDiff / 60);
      const secs = timeDiff % 60;
      formattedTime = `${mins} 分 ${secs} 秒`;
    }
  } else {
    if (timeDiff < 60) {
      formattedTime = `${timeDiff}s`;
    } else {
      const mins = Math.floor(timeDiff / 60);
      const secs = timeDiff % 60;
      formattedTime = `${mins}m ${secs}s`;
    }
  }
  
  const total = activeQuestions.length;
  const masteredCount = Object.values(masteryStatus).filter(v => v === 'mastered').length;
  const pct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;
  
  document.getElementById('arena-section').style.display = 'none';
  document.getElementById('stats-bar').style.display = 'none';
  document.getElementById('nav-grid-container').style.display = 'none';
  
  const summarySec = document.getElementById('summary-section');
  summarySec.style.display = 'block';
  
  const trans = studentTranslations[currentStudentLang];
  document.getElementById('summary-student-display').innerText = `${trans.studentDisplayLabel}: ${studentName}`;
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
  
  setupPrintCertificate(pct, formattedTime);
  
  // 渲染結算詳情清單
  const reviewContainer = document.getElementById('review-list-container');
  reviewContainer.innerHTML = '';
  
  const reviewTitle = document.createElement('h3');
  reviewTitle.className = 'review-title-text';
  reviewTitle.innerText = trans.reviewTitleText;
  reviewContainer.appendChild(reviewTitle);
  
  const cardList = document.createElement('div');
  cardList.className = 'review-card-list';
  
  activeQuestions.forEach((q, idx) => {
    const status = masteryStatus[idx] || 'review';
    const isMastered = (status === 'mastered');
    
    const item = document.createElement('div');
    item.className = `review-item ${isMastered ? 'mastered' : 'need-review'}`;
    
    let frontText = '';
    let backText = '';
    
    if (studyMode === 'bilingual') {
      frontText = currentStudentLang === 'zh' ? q.frontZh : q.frontEn;
      backText = currentStudentLang === 'zh' ? q.backZh : q.backEn;
    } else {
      frontText = q.front;
      backText = q.back;
    }
    
    const speakButtonHtml = ttsSetting !== 'none' ? `
      <button class="review-play-btn" onclick="speak('${frontText.replace(/'/g, "\\'")}', this, event)" title="Speak">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      </button>
    ` : '';
    
    item.innerHTML = `
      <div class="review-icon-status ${isMastered ? 'mastered' : 'need-review'}">
        ${isMastered 
          ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>`
        }
      </div>
      <div class="review-vocab-details">
        <span class="review-word-title">${frontText}</span>
        <span class="review-word-desc">${backText || trans.noContent}</span>
      </div>
      ${speakButtonHtml}
    `;
    cardList.appendChild(item);
  });
  
  reviewContainer.appendChild(cardList);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getRevisionComment(pct, timeStr) {
  const trans = studentTranslations[currentStudentLang];
  let key = 'comment0';
  if (pct === 100) key = 'comment100';
  else if (pct >= 80) key = 'comment80';
  else if (pct >= 50) key = 'comment50';
  
  return trans[key].replace('{time}', timeStr);
}

// 設定 A4 證書資料 (支持中英文證書切換)
function setupPrintCertificate(pct, timeStr) {
  const certContainer = document.getElementById('print-certificate-container');
  if (!certContainer) return;
  
  const trans = studentTranslations[currentStudentLang];
  let dateStr = '';
  if (currentStudentLang === 'zh') {
    dateStr = new Date().toLocaleDateString('zh-HK', { year: 'numeric', month: 'long', day: 'numeric' });
  } else {
    dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  
  let currentSubject = '';
  let currentTitle = '';
  
  if (studyMode === 'bilingual') {
    currentSubject = currentStudentLang === 'zh' ? subjectZh : subjectEn;
    currentTitle = currentStudentLang === 'zh' ? titleZh : titleEn;
  } else if (studyMode === 'english') {
    currentSubject = subjectEn;
    currentTitle = titleEn;
  } else {
    currentSubject = subjectZh;
    currentTitle = titleZh;
  }
  
  const total = activeQuestions.length;
  const masteredCount = Object.values(masteryStatus).filter(v => v === 'mastered').length;
  
  const bodyHtml = currentStudentLang === 'zh' 
    ? `茲證明學生 <span class="cert-name">${studentName}</span> 於本系統完成了以下學科溫習與評估：`
    : `This is to certify that the student <span class="cert-name">${studentName}</span> has completed the revision and assessment of:`;
    
  const footerHtml = currentStudentLang === 'zh'
    ? `熟練度：<strong style="color: var(--primary-color); font-size: 1.5rem;">${pct}%</strong>（已學會 ${masteredCount} / 總字卡 ${total}）<br>溫習用時：<strong>${timeStr}</strong>`
    : `Mastery: <strong style="color: var(--primary-color); font-size: 1.5rem;">${pct}%</strong> (Mastered ${masteredCount} / Total ${total})<br>Time Spent: <strong>${timeStr}</strong>`;
  
  certContainer.innerHTML = `
    <div class="cert-header">
      <div class="cert-badge">${currentStudentLang === 'zh' ? '修畢證書' : 'Certificate of Completion'}</div>
      <div class="cert-title">${currentStudentLang === 'zh' ? '香港道教聯合會圓玄學院第三中學' : 'HKTA The Yuen Yuen Institute No.3 Secondary School'}</div>
    </div>
    
    <div class="cert-body">
      ${bodyHtml}
      <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color); margin: 0.75rem 0;">
        ${currentSubject} — ${currentTitle}
      </div>
      ${footerHtml}
      <div class="cert-meta">
        ${currentStudentLang === 'zh' ? '本電子證明由系統自動核實頒發。' : 'This e-certificate is automatically verified and issued by the system.'}
      </div>
    </div>
    
    <div class="cert-footer">
      <div class="cert-sign">
        <div class="cert-sign-line"></div>
        <div class="cert-sign-title">${currentStudentLang === 'zh' ? '溫習日期 Date' : 'Date'}: ${dateStr}</div>
      </div>
      <div class="cert-sign">
        <div class="cert-sign-line"></div>
        <div class="cert-sign-title">${currentStudentLang === 'zh' ? '系統核實簽署 Verified Signature' : 'Verified Signature'}</div>
      </div>
    </div>
  `;
}

// 100% 離線純前端 Canvas 證書生圖與手機下載
function downloadCertificateImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 840;
  const ctx = canvas.getContext('2d');
  
  // 獲取當前主題色
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#0284c7';
  
  // 1. 象牙白優雅背景
  ctx.fillStyle = '#FCFBF9';
  ctx.fillRect(0, 0, 1200, 840);
  
  // 2. 主題色外邊框
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 10;
  ctx.strokeRect(35, 35, 1130, 770);
  
  // 金色內細邊框
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.strokeRect(52, 52, 1096, 736);
  
  // 3. 繪製角落裝飾花紋
  drawCorners(ctx);
  
  // 4. 頂部校名
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 28px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText('香港道教聯合會圓玄學院第三中學', 600, 120);
  
  ctx.fillStyle = '#64748B';
  ctx.font = '600 16px "Outfit", "Arial", sans-serif';
  ctx.fillText('HKTA The Yuen Yuen Institute No.3 Secondary School', 600, 150);
  
  // 分割線
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(350, 175);
  ctx.lineTo(850, 175);
  ctx.stroke();
  
  // 5. 證書標題
  const certTitleCN = '修畢證書';
  const certTitleEN = 'Certificate of Completion';
  
  ctx.fillStyle = primaryColor;
  ctx.font = 'bold 44px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText(certTitleCN, 600, 240);
  
  ctx.fillStyle = '#C5A059';
  ctx.font = 'bold italic 22px "Outfit", "Arial", sans-serif';
  ctx.fillText(certTitleEN, 600, 280);
  
  // 6. 茲證明
  ctx.fillStyle = '#64748B';
  ctx.font = 'italic 16px "Outfit", sans-serif';
  ctx.fillText('This is to certify that', 600, 340);
  
  // 學生姓名
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 36px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText(studentName, 600, 395);
  
  // 學生底線
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(350, 410);
  ctx.lineTo(850, 410);
  ctx.stroke();
  
  // 茲證明完成學習與評估
  ctx.fillStyle = '#475569';
  ctx.font = '500 20px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText('已成功完成本校之電子學習溫習與評估任務', 600, 460);
  
  ctx.fillStyle = '#64748B';
  ctx.font = 'italic 14px "Outfit", sans-serif';
  ctx.fillText('has successfully completed the e-learning revision and assessment task:', 600, 485);
  
  // 從變數中取得學科和標題
  let currentSubject = '';
  let currentTitle = '';
  if (studyMode === 'bilingual') {
    currentSubject = currentStudentLang === 'zh' ? subjectZh : subjectEn;
    currentTitle = currentStudentLang === 'zh' ? titleZh : titleEn;
  } else if (studyMode === 'english') {
    currentSubject = subjectEn;
    currentTitle = titleEn;
  } else {
    currentSubject = subjectZh;
    currentTitle = titleZh;
  }
  
  // 課卷資訊
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 24px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText(`《${currentSubject} - ${currentTitle}》`, 600, 535);
  
  // 掌握度數據
  const total = activeQuestions.length;
  const masteredCount = Object.values(masteryStatus).filter(v => v === 'mastered').length;
  const scorePercent = total > 0 ? Math.round((masteredCount / total) * 100) : 0;
  
  // 計算溫習總時間
  const endTime = new Date();
  const timeDiff = Math.max(1, Math.round((endTime - startTime) / 1000));
  let formattedTime = '';
  if (currentStudentLang === 'zh') {
    if (timeDiff < 60) formattedTime = `${timeDiff} 秒`;
    else formattedTime = `${Math.floor(timeDiff / 60)} 分 ${timeDiff % 60} 秒`;
  } else {
    if (timeDiff < 60) formattedTime = `${timeDiff}s`;
    else formattedTime = `${Math.floor(timeDiff / 60)}m ${timeDiff % 60}s`;
  }
  
  ctx.fillStyle = primaryColor;
  ctx.font = 'bold 24px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText(`熟練度 (Mastery)：${masteredCount} / ${total} (${scorePercent}%)`, 600, 580);
  
  ctx.fillStyle = '#475569';
  ctx.font = '600 16px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText(`溫習用時 (Time Spent)：${formattedTime}`, 600, 620);
  
  // 頒發日期
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  
  ctx.fillStyle = '#64748B';
  ctx.font = '500 14px "Outfit", sans-serif';
  ctx.fillText(`頒發日期 (Date)：${formattedDate}`, 600, 665);
  
  // 7. 繪製勳章 (Seal)
  drawSeal(ctx, 220, 690, 55, 30, 55, 45, scorePercent);
  
  // 8. 繪製學校印章
  drawSchoolSeal(ctx, 980, 690);
  
  // 9. 轉為圖片並顯示在 Modal 供長按儲存
  try {
    const dataURL = canvas.toDataURL('image/png');
    const modalOverlay = document.getElementById('cert-modal-overlay');
    const modalImg = document.getElementById('cert-modal-img');
    const modalHint = document.getElementById('cert-modal-hint-el');
    
    if (modalOverlay && modalImg) {
      modalImg.src = dataURL;
      if (modalHint) {
        modalHint.innerText = currentStudentLang === 'zh' 
          ? '💡 長按上方證書圖片即可儲存至相簿' 
          : '💡 Long press the certificate image above to save to your photo library.';
      }
      modalOverlay.style.display = 'flex';
    }
  } catch (e) {
    console.error('Failed to generate certificate image:', e);
  }
}

// 關閉證書彈窗
function closeCertModal() {
  const modalOverlay = document.getElementById('cert-modal-overlay');
  if (modalOverlay) {
    modalOverlay.style.display = 'none';
  }
}

// 繪製角落裝飾
function drawCorners(ctx) {
  const size = 30;
  const offsets = [
    {x: 52, y: 52, dx: 1, dy: 1}, // 左上
    {x: 1148, y: 52, dx: -1, dy: 1}, // 右上
    {x: 52, y: 788, dx: 1, dy: -1}, // 左下
    {x: 1148, y: 788, dx: -1, dy: -1} // 右下
  ];
  
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 3;
  offsets.forEach(corner => {
    ctx.beginPath();
    // 繪製折角
    ctx.moveTo(corner.x + corner.dx * size, corner.y);
    ctx.lineTo(corner.x, corner.y);
    ctx.lineTo(corner.x, corner.y + corner.dy * size);
    ctx.stroke();
    
    // 角落的圓點裝飾
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(corner.x + corner.dx * 12, corner.y + corner.dy * 12, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

// 繪製金色成就印章
function drawSeal(ctx, cx, cy, r, numPoints, r1, r2, pct) {
  ctx.beginPath();
  let angle = Math.PI / 2;
  const step = Math.PI / numPoints;
  ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
  for (let i = 0; i < numPoints * 2; i++) {
    angle += step;
    const currR = (i % 2 === 0) ? r2 : r1;
    ctx.lineTo(cx + Math.cos(angle) * currR, cy + Math.sin(angle) * currR);
  }
  ctx.closePath();
  
  // 填充金黃色放射性漸層
  const grad = ctx.createRadialGradient(cx, cy, r2 * 0.2, cx, cy, r1);
  grad.addColorStop(0, '#FFE066');  // 亮金
  grad.addColorStop(0.5, '#F5A623'); // 橙金
  grad.addColorStop(1, '#D4AF37');   // 暗金
  ctx.fillStyle = grad;
  ctx.fill();
  
  // 描邊
  ctx.strokeStyle = '#C5A059';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // 內圈白細線
  ctx.beginPath();
  ctx.arc(cx, cy, r2 - 6, 0, Math.PI * 2);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 陰影
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // 頂部小字
  ctx.font = 'bold 11px "Outfit", sans-serif';
  ctx.fillText('E-LEARNING', cx, cy - 18);
  
  // 中間主文字
  const statusText = 'COMPLETED';
  
  ctx.font = 'bold 13px "Outfit", sans-serif';
  ctx.fillText(statusText, cx, cy + 2);
  
  // 底部星星
  ctx.font = '12px "Outfit", sans-serif';
  ctx.fillText('★★★', cx, cy + 20);
  
  // 清除陰影
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

// 繪製紅色學校印章
function drawSchoolSeal(ctx, cx, cy) {
  // 雙框方形紅色印章
  ctx.strokeStyle = 'rgba(220, 38, 38, 0.8)';
  ctx.lineWidth = 3;
  ctx.strokeRect(cx - 48, cy - 48, 96, 96);
  
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 42, cy - 42, 84, 84);
  
  ctx.fillStyle = 'rgba(220, 38, 38, 0.8)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 16px "Noto Sans TC", "KaiTi", "Microsoft JhengHei", serif';
  
  // 印章字樣「圓玄三中學習之印」
  ctx.fillText('圓玄', cx - 20, cy - 20);
  ctx.fillText('三中', cx + 20, cy - 20);
  ctx.fillText('學習', cx - 20, cy + 20);
  ctx.fillText('之印', cx + 20, cy + 20);
}

// 畫五角星之輔助算法
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();

// 重新溫習
function resetRevision() {
  studentName = '';
  activeQuestions = [];
  currentCardIndex = 0;
  masteryStatus = {};
  cardStates = [];
  
  document.getElementById('summary-section').style.display = 'none';
  document.getElementById('arena-section').style.display = 'none';
  document.getElementById('stats-bar').style.display = 'none';
  document.getElementById('nav-grid-container').style.display = 'none';
  
  const nameInput = document.getElementById('student-name');
  if (nameInput) nameInput.value = '';
  toggleStartButton();
  
  initApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
                                                                                                                                                                                                                                                            51.0255476+08:00   k C M OO(:7.2.4+20251128.8f05bb68.9272026-06-13 20:00:29.540282+08:002026-06-12 02:31:34.7728274+08:0ih�	 C M Oo�7.2.2+20250925.3d408807.923