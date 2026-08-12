let studentName = '';
let activeQuestions = [];
let currentQuestionIndex = 0; // 一題一頁

let userAnswers = {}; // { qIndex: studentInput }
let submittedAnswers = {}; // { qIndex: { chosen: string, isCorrect: bool } }
let isQuizSubmitted = false;
let startTime = null;

// 語音發音配置
let voices = [];

// 初始化
window.addEventListener('DOMContentLoaded', () => {
  initSpeechSynthesis();
});

// 初始化瀏覽器 TTS 語音
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

// 朗讀字詞/句子 (事前由老師選定口音 dictAccent: 'US' 或 'GB')
function speak(text, btnElement) {
  if (typeof speechSynthesis === 'undefined') return;
  
  // 停止當前所有發音
  speechSynthesis.cancel();
  
  if (!text) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // 獲取所有系統語音
  const allVoices = speechSynthesis.getVoices();
  const englishVoices = allVoices.filter(v => v.lang.startsWith('en'));
  
  let targetVoice = null;
  if (dictAccent === 'GB') {
    // 尋找英音 (GB/UK)
    targetVoice = englishVoices.find(v => 
      v.lang.toLowerCase().includes('gb') || 
      v.lang.toLowerCase().includes('uk') || 
      v.name.toLowerCase().includes('great britain') ||
      v.name.toLowerCase().includes('united kingdom')
    );
  } else {
    // 預設尋找美音 (US)
    targetVoice = englishVoices.find(v => 
      v.lang.toLowerCase().includes('us') || 
      v.name.toLowerCase().includes('united states')
    );
  }
  
  // 套用語音
  if (targetVoice) {
    utterance.voice = targetVoice;
  } else if (englishVoices.length > 0) {
    utterance.voice = englishVoices[0]; // fallback 用任一英文
  }
  
  // 根據 Vocab / Sentence 調整語速
  if (dictMode === 'vocab') {
    utterance.rate = 0.85; // 稍慢單字
  } else {
    utterance.rate = 0.75; // 更慢句子以利聽寫
  }
  
  // 動畫效果
  if (btnElement) {
    btnElement.classList.add('playing');
    utterance.onend = () => {
      btnElement.classList.remove('playing');
    };
    utterance.onerror = () => {
      btnElement.classList.remove('playing');
    };
  }
  
  speechSynthesis.speak(utterance);
}

// 大廳姓名檢查
function toggleStartButton() {
  const nameVal = document.getElementById('student-name').value.trim();
  const btn = document.getElementById('btn-start-quiz');
  btn.disabled = nameVal.length === 0;
}

// 開始默書
function startQuiz() {
  const nameVal = document.getElementById('student-name').value.trim();
  if (!nameVal) return;
  
  studentName = nameVal;
  isQuizSubmitted = false;
  startTime = new Date();
  
  // 隨機排序 (洗牌演算法)
  activeQuestions = [...rawQuestions].sort(() => 0.5 - Math.random());
  
  currentQuestionIndex = 0;
  userAnswers = {};
  submittedAnswers = {};
  
  // 切換畫面
  document.getElementById('lobby-section').style.display = 'none';
  document.getElementById('questions-container').style.display = 'block';
  document.getElementById('score-bar').style.display = 'flex';
  document.getElementById('nav-grid-container').style.display = 'grid';
  
  renderQuiz();
  renderNavGrid();
  updateScoreBar();
  
  // 自動發音第一題
  setTimeout(() => {
    const playBtn = document.getElementById(`play-btn-${currentQuestionIndex}`);
    if (playBtn) playBtn.click();
  }, 300);
}

// 建立導覽網格
function renderNavGrid() {
  const grid = document.getElementById('nav-grid-container');
  grid.innerHTML = '';
  
  activeQuestions.forEach((_, idx) => {
    const btn = document.createElement('button');
    btn.className = 'nav-item';
    btn.innerText = idx + 1;
    btn.id = `nav-item-${idx}`;
    
    if (idx === currentQuestionIndex) {
      btn.classList.add('active');
    }
    
    // 若學生輸入了內容，標記為已答
    if (userAnswers[idx] && userAnswers[idx].trim().length > 0) {
      btn.classList.add('answered');
    }
    
    btn.onclick = () => {
      saveCurrentInput();
      jumpToQuestion(idx);
    };
    
    grid.appendChild(btn);
  });
}

// 跳轉題目
function jumpToQuestion(idx) {
  if (isQuizSubmitted) return;
  currentQuestionIndex = idx;
  renderQuiz();
  renderNavGrid();
  
  // 自動朗讀切換後的題目
  setTimeout(() => {
    const playBtn = document.getElementById(`play-btn-${idx}`);
    if (playBtn) playBtn.click();
    
    // 輸入框聚焦
    const input = document.getElementById(`answer-input-${idx}`);
    if (input) input.focus();
  }, 100);
}

// 保存當前題目輸入框的值
function saveCurrentInput() {
  const input = document.getElementById(`answer-input-${currentQuestionIndex}`);
  if (input) {
    userAnswers[currentQuestionIndex] = input.value;
  }
}

// 渲染當前題卡
function renderQuiz() {
  const container = document.getElementById('questions-container');
  container.innerHTML = '';
  const q = activeQuestions[currentQuestionIndex];
  if (q) {
    container.appendChild(createQuestionCard(q, currentQuestionIndex));
  }
}

// 建立單題卡 DOM
function createQuestionCard(q, idx) {
  const card = document.createElement('div');
  card.className = 'dict-card';
  card.id = `q-card-${idx}`;
  
  const currentVal = userAnswers[idx] || '';
  
  // 建立 HTML 骨架 (純英文)
  let html = `
    <div class="question-num">Question ${idx + 1}</div>
    
    <div class="tts-container">
      <button class="play-btn" id="play-btn-${idx}" onclick="speak(rawQuestions.find(x => x.eng === activeQuestions[${idx}].eng).eng, this)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      </button>
      <div class="play-hint-label">Click to Hear</div>
    </div>
    
    <div class="input-answer-wrapper">
      <input type="text" 
             id="answer-input-${idx}" 
             class="answer-input" 
             placeholder="Enter dictation answer here" 
             value="${currentVal}"
             oninput="recordAnswer(${idx})"
             onkeydown="handleInputKeydown(event, ${idx})"
             autocomplete="off"
             autocorrect="off"
             autocapitalize="off"
             spellcheck="false">
    </div>
  `;
  
  // 中文提示（若有提供且老師輸入的資料存在）
  if (q.chi) {
    html += `
      <div class="hint-wrapper">
        <button class="hint-toggle-btn" onclick="toggleHint(${idx})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <span id="hint-toggle-text-${idx}">Show Hint</span>
        </button>
        <div class="hint-content" id="hint-content-${idx}">${q.chi}</div>
      </div>
    `;
  }
  
  // 底部按鈕
  const isLast = (idx === activeQuestions.length - 1);
  html += `
    <div class="action-btn-row">
      ${idx > 0 ? `<button class="prev-btn" onclick="saveCurrentInput(); prevQuestion()">Prev</button>` : '<div></div>'}
      <div class="action-btn-row-right">
        ${isLast 
          ? `<button class="submit-btn" id="btn-submit-${idx}" onclick="saveCurrentInput(); confirmAndSubmitAll()">Submit Dictation</button>`
          : `<button class="next-btn" id="btn-next-${idx}" onclick="saveCurrentInput(); nextQuestion()">Next</button>`
        }
      </div>
    </div>
  `;
  
  card.innerHTML = html;
  return card;
}

// 即時記錄輸入
function recordAnswer(idx) {
  const input = document.getElementById(`answer-input-${idx}`);
  if (input) {
    userAnswers[idx] = input.value;
  }
  updateScoreBar();
}

// 處理輸入框 Enter 鍵
function handleInputKeydown(event, idx) {
  if (event.key === 'Enter') {
    event.preventDefault();
    saveCurrentInput();
    const isLast = (idx === activeQuestions.length - 1);
    if (isLast) {
      confirmAndSubmitAll();
    } else {
      nextQuestion();
    }
  }
}

// 顯示/隱藏中文提示
function toggleHint(idx) {
  const content = document.getElementById(`hint-content-${idx}`);
  const textSpan = document.getElementById(`hint-toggle-text-${idx}`);
  
  if (content.style.display === 'block') {
    content.style.display = 'none';
    textSpan.innerText = "Show Hint";
  } else {
    content.style.display = 'block';
    textSpan.innerText = "Hide Hint";
  }
}

// 下一題
function nextQuestion() {
  if (currentQuestionIndex < activeQuestions.length - 1) {
    currentQuestionIndex++;
    renderQuiz();
    renderNavGrid();
    
    // 自動播放與聚焦
    setTimeout(() => {
      const playBtn = document.getElementById(`play-btn-${currentQuestionIndex}`);
      if (playBtn) playBtn.click();
      const input = document.getElementById(`answer-input-${currentQuestionIndex}`);
      if (input) input.focus();
    }, 100);
  }
}

// 上一題
function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuiz();
    renderNavGrid();
    
    // 自動播放與聚焦
    setTimeout(() => {
      const playBtn = document.getElementById(`play-btn-${currentQuestionIndex}`);
      if (playBtn) playBtn.click();
      const input = document.getElementById(`answer-input-${currentQuestionIndex}`);
      if (input) input.focus();
    }, 100);
  }
}

// 更新統計條
function updateScoreBar() {
  const total = activeQuestions.length;
  const answeredCount = Object.keys(userAnswers).filter(k => userAnswers[k] && userAnswers[k].trim().length > 0).length;
  
  document.getElementById('progress-val').innerText = `${answeredCount} / ${total}`;
}

// 提交確認
function confirmAndSubmitAll() {
  const total = activeQuestions.length;
  const answeredCount = Object.keys(userAnswers).filter(k => userAnswers[k] && userAnswers[k].trim().length > 0).length;
  
  if (answeredCount < total) {
    const unanswered = total - answeredCount;
    const warningMsg = `You still have ${unanswered} unanswered question(s)! Are you sure you want to submit and grade?\nYou cannot modify answers after submission.`;
    showCustomModal(warningMsg, () => {
      submitAllQuestions();
    });
  } else {
    const confirmMsg = "Are you sure you want to submit? You cannot modify answers after submission.";
    showCustomModal(confirmMsg, () => {
      submitAllQuestions();
    });
  }
}

// 核心比對校對算法
function checkSpelling(studentAns, correctAns) {
  let s = (studentAns || '').trim();
  let c = (correctAns || '').trim();
  
  // 1. 忽略大小寫
  if (!isCaseSensitive) {
    s = s.toLowerCase();
    c = c.toLowerCase();
  }
  
  // 2. 忽略標點符號
  if (isIgnorePunctuation) {
    const cleanStr = (str) => {
      return str
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
        .replace(/\s+/g, " ")
        .trim();
    };
    s = cleanStr(s);
    c = cleanStr(c);
  }
  
  return s === c;
}

// 提交所有答案並校對
function submitAllQuestions() {
  isQuizSubmitted = true;
  
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  
  // 比對
  activeQuestions.forEach((q, idx) => {
    const chosen = userAnswers[idx] || '';
    const isCorrect = checkSpelling(chosen, q.eng);
    submittedAnswers[idx] = { chosen, isCorrect };
  });
  
  // 隱藏統計與網格
  document.getElementById('score-bar').style.display = 'none';
  document.getElementById('nav-grid-container').style.display = 'none';
  
  // 結算數據
  const total = activeQuestions.length;
  const correctCount = Object.values(submittedAnswers).filter(x => x.isCorrect).length;
  const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  
  const summarySec = document.getElementById('summary-section');
  summarySec.style.display = 'block';
  
  document.getElementById('summary-student-display').innerText = `Student: ${studentName}`;
  document.getElementById('summary-score-value').innerText = `${pct}% (${correctCount} / ${total})`;
  updateComment(pct);
  
  // 渲染校對回顧列表
  const container = document.getElementById('questions-container');
  container.innerHTML = '';
  
  // 插入標題
  const reviewTitle = document.createElement('h3');
  reviewTitle.className = 'review-title-text';
  reviewTitle.innerText = "Review & Explanations";
  container.appendChild(reviewTitle);
  
  activeQuestions.forEach((q, idx) => {
    container.appendChild(createReviewCard(q, idx));
  });
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 建立校對題卡
function createReviewCard(q, idx) {
  const result = submittedAnswers[idx];
  const card = document.createElement('div');
  card.className = `dict-card review-card ${result.isCorrect ? 'correct' : 'incorrect'}`;
  
  let html = `
    <div class="review-card-header">
      <div class="review-num">Question ${idx + 1}</div>
      <div class="review-status ${result.isCorrect ? 'correct' : 'incorrect'}">
        ${result.isCorrect 
          ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Correct!`
          : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Incorrect!`
        }
      </div>
    </div>
    
    <div class="review-body">
      <div class="review-row">
        <strong>Your Answer:</strong>
        <span class="student-ans-val">${result.chosen || '(Empty)'}</span>
      </div>
      
      <div class="review-row">
        <strong>Correct Answer:</strong>
        <span class="correct-ans-val">${q.eng}</span>
        <button class="review-play-btn" onclick="speak(rawQuestions.find(x => x.eng === activeQuestions[${idx}].eng).eng, this)" style="margin-left: 0.5rem; vertical-align: middle;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </button>
      </div>
  `;
  
  if (q.chi) {
    html += `
      <div class="review-row">
        <strong>Meaning:</strong>
        <span class="hint-val">${q.chi}</span>
      </div>
    `;
  }
  
  html += `</div>`;
  card.innerHTML = html;
  
  // 綁定發音事件
  const playBtn = card.querySelector('.review-play-btn');
  if (playBtn) {
    playBtn.onclick = (e) => {
      e.stopPropagation();
      speak(q.eng, playBtn);
    };
  }
  
  return card;
}

function updateComment(pct) {
  let comment = '';
  if (pct === 100) comment = "Outstanding! Perfect score!";
  else if (pct >= 80) comment = "Great job! Very close to perfect!";
  else if (pct >= 60) comment = "Passed! Keep practicing!";
  else comment = "Needs improvement. Try again!";
  
  document.getElementById('summary-comment-text').innerText = comment;
}

// 重新挑戰
function resetQuiz() {
  userAnswers = {};
  submittedAnswers = {};
  currentQuestionIndex = 0;
  isQuizSubmitted = false;
  startTime = null;
  
  document.getElementById('summary-section').style.display = 'none';
  document.getElementById('questions-container').style.display = 'none';
  document.getElementById('lobby-section').style.display = 'flex';
  
  const nameInput = document.getElementById('student-name');
  if (nameInput) nameInput.value = '';
  toggleStartButton();
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 🏆 證書動態生成系統 (Canvas Rendering System)
// ==========================================

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
  ctx.fillText('已成功完成本校之電子學習默書與評估任務', 600, 460);
  
  ctx.fillStyle = '#64748B';
  ctx.font = 'italic 14px "Outfit", sans-serif';
  ctx.fillText('has successfully completed the e-learning dictation and assessment task:', 600, 485);
  
  // 從 DOM 中取得學科和標題
  const subjectEl = document.getElementById('lobby-sub-subject');
  const titleEl = document.getElementById('lobby-main-title');
  const subjectStr = subjectEl ? subjectEl.innerText.trim() : '';
  const titleStr = titleEl ? titleEl.innerText.trim() : '';
  
  // 課卷資訊
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 24px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText(`《${subjectStr} - ${titleStr}》`, 600, 535);
  
  // 默書統計數據
  const total = activeQuestions.length;
  const correctCount = Object.values(submittedAnswers).filter(x => x.isCorrect).length;
  const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  
  // 計算總用時
  let formattedTime = '';
  if (startTime) {
    const endTime = new Date();
    const timeDiff = Math.max(1, Math.round((endTime - startTime) / 1000));
    if (timeDiff < 60) {
      formattedTime = `${timeDiff}s`;
    } else {
      formattedTime = `${Math.floor(timeDiff / 60)}m ${timeDiff % 60}s`;
    }
  } else {
    formattedTime = 'N/A';
  }
  
  ctx.fillStyle = primaryColor;
  ctx.font = 'bold 24px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText(`正確率 (Accuracy)：${correctCount} / ${total} (${scorePercent}%)`, 600, 580);
  
  ctx.fillStyle = '#475569';
  ctx.font = '600 16px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText(`默書用時 (Time Spent)：${formattedTime}`, 600, 620);
  
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
        modalHint.innerText = '💡 Long press the certificate image above to save to your photo library.';
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

// 💬 自訂防呆對話框系統 (Custom Confirm Modal System)
// ==========================================

function showCustomModal(message, onConfirm) {
  const modal = document.getElementById('custom-modal');
  const body = document.getElementById('custom-modal-body');
  const confirmBtn = document.getElementById('custom-modal-btn-confirm');
  
  if (!modal || !body || !confirmBtn) return;
  
  body.innerText = message;
  
  confirmBtn.onclick = () => {
    closeCustomModal();
    if (onConfirm) onConfirm();
  };
  
  modal.style.display = 'flex';
}

function closeCustomModal() {
  const modal = document.getElementById('custom-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}
