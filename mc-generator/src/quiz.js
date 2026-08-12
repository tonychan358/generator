let currentLang = (langMode === 'en') ? 'en' : 'cn';
let studentName = '';
let activeQuestions = [];
let currentQuestionIndex = 0; // 用於單頁模式 (one, random10)

let userAnswers = {}; // { qIndex: selectedLetter }
let submittedAnswers = {}; // { qIndex: { chosen: letter, isCorrect: bool } }
let isQuizSubmitted = false;

// 系統多語系詞典
const i18n = {
  cn: {
    question: "第 {num} 題",
    submit: "提交測驗",
    next: "下一題",
    prev: "上一題",
    correct: "正確！",
    incorrect: "錯誤！",
    correctAnswer: "正確答案為",
    explanationTitle: "題目解析",
    progress: "答題進度",
    score: "答對題數",
    summaryTitle: "練習完成！",
    studentNameLabel: "學生姓名 / Student Name",
    studentNamePlaceholder: "請輸入姓名 / Enter your name",
    btnStart: "開始作答 / Start",
    btnRetry: "重新挑戰",
    commentExcellent: "表現卓越！完美解答！",
    commentGood: "表現不錯！非常接近完美！",
    commentPass: "及格了，多加練習會更好！",
    commentFail: "還需要加油，再試一次吧！",
    modeAll: "練習模式：一次顯示全部題目",
    modeOne: "練習模式：一次顯示一題",
    modeRandom: "練習模式：隨機抽 10 題進行挑戰",
    studentDisplay: "同學：{name}",
    nameRequired: "請先輸入您的姓名以開始練習！",
    submitQuizPrompt: "提交測驗後將無法修改答案，確定要提交嗎？",
    answersSummaryTitle: "答題回顧與詳解 / Review & Explanations",
    retryForCert: "⚠️ 未達合格門檻 {passing}%，請點擊下方按鈕重新挑戰以取得證書！"
  },
  en: {
    question: "Question {num}",
    submit: "Submit Quiz",
    next: "Next",
    prev: "Prev",
    correct: "Correct!",
    incorrect: "Incorrect!",
    correctAnswer: "Correct Answer is",
    explanationTitle: "Explanation",
    progress: "Progress",
    score: "Correct",
    summaryTitle: "Quiz Completed!",
    studentNameLabel: "Student Name",
    studentNamePlaceholder: "Enter your name",
    btnStart: "Start Quiz",
    btnRetry: "Try Again",
    commentExcellent: "Outstanding! Perfect score!",
    commentGood: "Great job! Very close to perfect!",
    commentPass: "Passed! Keep practicing!",
    commentFail: "Needs improvement. Try again!",
    modeAll: "Mode: Show all questions",
    modeOne: "Mode: One question per page",
    modeRandom: "Mode: Random 10 Questions Challenge",
    studentDisplay: "Student: {name}",
    nameRequired: "Please enter your name to start!",
    submitQuizPrompt: "Are you sure you want to submit? You cannot modify answers after submission.",
    answersSummaryTitle: "Review & Explanations",
    retryForCert: "⚠️ You have not reached the passing score of {passing}%. Please click the button below to retry and earn your certificate!"
  }
};

// 初始化
window.addEventListener('DOMContentLoaded', () => {
  if (langMode === 'bilingual') {
    document.getElementById('lang-switch-wrapper').style.display = 'flex';
  }
  updateLobbyUI();
});

// 大廳姓名檢查
function toggleStartButton() {
  const nameVal = document.getElementById('student-name').value.trim();
  const btn = document.getElementById('btn-start-quiz');
  btn.disabled = nameVal.length === 0;
}

// 更新大廳多語系顯示
function updateLobbyUI() {
  const texts = i18n[currentLang];
  
  document.getElementById('label-student-name').innerText = texts.studentNameLabel;
  document.getElementById('student-name').placeholder = texts.studentNamePlaceholder;
  document.getElementById('btn-start-quiz').innerText = texts.btnStart;
  
  const modeTag = document.getElementById('lobby-mode-tag');
  if (quizMode === 'all') {
    modeTag.innerText = texts.modeAll;
  } else if (quizMode === 'one') {
    modeTag.innerText = texts.modeOne;
  } else if (quizMode === 'random10') {
    modeTag.innerText = texts.modeRandom;
  }
}

// 開始測驗
function startQuiz() {
  const nameVal = document.getElementById('student-name').value.trim();
  if (!nameVal) return;
  
  studentName = nameVal;
  isQuizSubmitted = false;
  
  // 決定參與測驗的題目
  if (quizMode === 'random10') {
    const shuffled = [...rawQuestions].sort(() => 0.5 - Math.random());
    activeQuestions = shuffled.slice(0, Math.min(10, shuffled.length));
  } else {
    activeQuestions = [...rawQuestions];
    // 如果是 shuffle 模式且不是 random10
    if (typeof orderMode !== 'undefined' && orderMode === 'shuffle') {
      activeQuestions.sort(() => 0.5 - Math.random());
    }
  }
  
  // 對參與測驗的每道題目處理選項隨機化
  activeQuestions = activeQuestions.map(q => {
    const newQ = JSON.parse(JSON.stringify(q));
    if (typeof orderMode !== 'undefined' && orderMode === 'shuffle') {
      const indices = [0, 1, 2, 3].sort(() => 0.5 - Math.random());
      newQ.shuffledIndices = indices;
      const originalCorrectIdx = q.ans.charCodeAt(0) - 65;
      const newCorrectIdx = indices.indexOf(originalCorrectIdx);
      newQ.ans = String.fromCharCode(65 + newCorrectIdx);
    } else {
      newQ.shuffledIndices = [0, 1, 2, 3];
    }
    return newQ;
  });
  
  currentQuestionIndex = 0;
  userAnswers = {};
  submittedAnswers = {};
  
  // 切換畫面
  document.getElementById('lobby-section').style.display = 'none';
  document.getElementById('questions-container').style.display = 'block';
  document.getElementById('score-bar').style.display = 'flex';
  
  // 長卷模式顯示底部提交
  if (quizMode === 'all') {
    document.getElementById('all-submit-section').style.display = 'block';
    document.getElementById('nav-grid-container').style.display = 'none';
  } else {
    // 分頁模式顯示題號導覽網格
    document.getElementById('all-submit-section').style.display = 'none';
    document.getElementById('nav-grid-container').style.display = 'flex';
  }
  
  renderQuiz();
  renderNavGrid();
  updateScoreBar();
}

// 建立導覽網格
function renderNavGrid() {
  if (quizMode === 'all') return;
  
  const grid = document.getElementById('nav-grid-container');
  grid.innerHTML = '';
  
  activeQuestions.forEach((_, idx) => {
    const btn = document.createElement('button');
    btn.className = 'nav-item';
    btn.innerText = idx + 1;
    btn.id = `nav-item-${idx}`;
    
    // 如果是當前題，標記 active
    if (idx === currentQuestionIndex) {
      btn.classList.add('active');
    }
    
    // 如果已作答，標記 answered
    if (userAnswers[idx]) {
      btn.classList.add('answered');
    }
    
    // 點擊直接跳轉
    btn.onclick = () => {
      jumpToQuestion(idx);
    };
    
    grid.appendChild(btn);
  });
}

// 跳轉題目
function jumpToQuestion(idx) {
  if (isQuizSubmitted) return; // 提交後不可直接在大廳跳轉（提交後會展示全部）
  currentQuestionIndex = idx;
  renderQuiz();
  renderNavGrid();
}

// 渲染測驗頁
function renderQuiz() {
  const container = document.getElementById('questions-container');
  container.innerHTML = '';
  
  const texts = i18n[currentLang];
  
  if (quizMode === 'all') {
    // 顯示全部
    activeQuestions.forEach((q, idx) => {
      container.appendChild(createQuestionCard(q, idx, texts));
    });
  } else {
    // 分頁模式僅顯示當前題
    const q = activeQuestions[currentQuestionIndex];
    if (q) {
      container.appendChild(createQuestionCard(q, currentQuestionIndex, texts));
    }
  }
}

// 建立卡片 DOM
function createQuestionCard(q, idx, texts) {
  const qData = q[currentLang] || q['cn'] || q['en'];
  
  const card = document.createElement('div');
  card.className = 'question-card';
  card.id = `q-card-${idx}`;
  
  let optionsHtml = '';
  ['A', 'B', 'C', 'D'].forEach((letter, oIdx) => {
    const isSelected = (userAnswers[idx] === letter);
    let optClass = 'option-item';
    
    if (isQuizSubmitted) {
      optClass += ' disabled';
      const correctAns = q.ans;
      const chosen = submittedAnswers[idx] ? submittedAnswers[idx].chosen : '';
      
      if (letter === correctAns) {
        optClass += ' correct';
      } else if (letter === chosen && chosen !== correctAns) {
        optClass += ' incorrect';
      }
    } else if (isSelected) {
      optClass += ' selected';
    }
    
    // 依據 shuffledIndices 對應到原始選項內容
    const mappedIdx = (q.shuffledIndices && q.shuffledIndices.length === 4) ? q.shuffledIndices[oIdx] : oIdx;
    
    optionsHtml += `
      <div class="${optClass}" id="opt-${idx}-${letter}" onclick="selectOption(${idx}, '${letter}')">
        <span class="option-badge">${letter}</span>
        <span id="opt-text-${idx}-${letter}">${qData ? qData.o[mappedIdx] : ''}</span>
      </div>
    `;
  });
  
  // 卡片標頭與題幹
  let html = `
    <div class="question-num" id="q-num-${idx}">${texts.question.replace('{num}', idx + 1)}</div>
    <div class="question-text" id="q-text-${idx}">${qData ? qData.q : ''}</div>
    <div class="options-list">${optionsHtml}</div>
  `;
  
  // 底部按鈕
  if (!isQuizSubmitted) {
    if (quizMode !== 'all') {
      const isLast = (idx === activeQuestions.length - 1);
      html += `
        <div class="action-btn-row">
          ${idx > 0 ? `<button class="prev-btn" onclick="prevQuestion()">${texts.prev}</button>` : '<div></div>'}
          <div class="action-btn-row-right">
            ${isLast 
              ? `<button class="submit-btn" id="btn-submit-${idx}" onclick="confirmAndSubmitAll()">${texts.submit}</button>`
              : `<button class="next-btn" id="btn-next-${idx}" onclick="nextQuestion()">${texts.next}</button>`
            }
          </div>
        </div>
      `;
    }
  } else {
    // 提交後在卡片底部展示紅綠反饋與解析
    const isCorrect = submittedAnswers[idx] ? submittedAnswers[idx].isCorrect : false;
    const correctAns = q.ans;
    
    html += `
      <div class="feedback-box ${isCorrect ? 'correct' : 'incorrect'}" style="display: block;">
        <div class="feedback-title">
          ${isCorrect 
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> ${texts.correct}` 
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> ${texts.incorrect} ${texts.correctAnswer} ${correctAns}`
          }
        </div>
        ${(qData && qData.exp) ? `<div class="feedback-explanation"><strong>${texts.explanationTitle}:</strong> ${qData.exp}</div>` : ''}
      </div>
    `;
  }
  
  card.innerHTML = html;
  return card;
}

// 選擇答案
function selectOption(qIdx, letter) {
  if (isQuizSubmitted) return;
  
  userAnswers[qIdx] = letter;
  
  // 更新選項樣式
  ['A', 'B', 'C', 'D'].forEach(l => {
    const opt = document.getElementById(`opt-${qIdx}-${l}`);
    if (opt) opt.classList.toggle('selected', l === letter);
  });
  
  updateScoreBar();
  renderNavGrid();
}

// 分頁切換
function nextQuestion() {
  if (currentQuestionIndex < activeQuestions.length - 1) {
    currentQuestionIndex++;
    renderQuiz();
    renderNavGrid();
  }
}

function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuiz();
    renderNavGrid();
  }
}

// 更新進度與得分
function updateScoreBar() {
  const total = activeQuestions.length;
  const answeredCount = Object.keys(userAnswers).length;
  
  document.getElementById('progress-val').innerText = `${answeredCount} / ${total}`;
  
  // 提交前，得分板隱藏「得分」數值，或顯示為 0；提交後更新為正確數值
  if (isQuizSubmitted) {
    const correctCount = Object.values(submittedAnswers).filter(x => x.isCorrect).length;
    document.getElementById('ui-score').style.display = 'block';
    document.getElementById('score-val').innerText = `${correctCount}`;
  } else {
    // 答題中只顯示進度，隱藏「目前得分」以免透露資訊，或者是只顯示「已答題數」
    document.getElementById('ui-score').style.display = 'none';
  }
}

// 提交確認
function confirmAndSubmitAll() {
  const texts = i18n[currentLang];
  const total = activeQuestions.length;
  const answeredCount = Object.keys(userAnswers).length;
  
  if (answeredCount < total) {
    const unanswered = total - answeredCount;
    const warningMsg = (currentLang === 'cn')
      ? `您還有 ${unanswered} 題尚未作答！確定要提交並進行批改嗎？\n提交後將無法修改答案。`
      : `You still have ${unanswered} unanswered question(s)! Are you sure you want to submit and grade?\nYou cannot modify answers after submission.`;
    
    showCustomModal(warningMsg, () => {
      submitAllQuestions();
    });
  } else {
    showCustomModal(texts.submitQuizPrompt, () => {
      submitAllQuestions();
    });
  }
}

// 提交所有答案一次過批改
function submitAllQuestions() {
  isQuizSubmitted = true;
  
  // 批改
  activeQuestions.forEach((q, idx) => {
    const chosen = userAnswers[idx] || '';
    const isCorrect = (chosen === q.ans);
    submittedAnswers[idx] = { chosen, isCorrect };
  });
  
  // 隱藏統計條與長卷提交區
  document.getElementById('score-bar').style.display = 'none';
  document.getElementById('all-submit-section').style.display = 'none';
  document.getElementById('nav-grid-container').style.display = 'none';
  
  // 顯示結算畫面
  const total = activeQuestions.length;
  const correctCount = Object.values(submittedAnswers).filter(x => x.isCorrect).length;
  const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  
  const texts = i18n[currentLang];
  const summarySec = document.getElementById('summary-section');
  summarySec.style.display = 'block';
  
  document.getElementById('summary-student-display').innerText = texts.studentDisplay.replace('{name}', studentName);
  document.getElementById('summary-score-value').innerText = `${pct}% (${correctCount} / ${total})`;
  updateComment(pct);
  
  // 檢查是否達到合格門檻，達標才出證書，否則給予重做提示
  const isPassed = (pct >= passingScore);
  const retryHintEl = document.getElementById('retry-hint');
  
  if (isPassed) {
    if (retryHintEl) retryHintEl.style.display = 'none';
    // 產生證書
    generateCertificate(studentName, pct, correctCount, total);
  } else {
    // 隱藏證書區
    const certCont = document.getElementById('cert-container');
    if (certCont) certCont.style.display = 'none';
    
    // 顯示重做提示
    if (retryHintEl) {
      retryHintEl.innerText = texts.retryForCert.replace('{passing}', passingScore);
      retryHintEl.style.display = 'block';
    }
  }
  
  // 結算後，一次性在下方列出所有已被批改的題目（方便學生溫習）
  const container = document.getElementById('questions-container');
  container.innerHTML = '';
  
  // 插入一個「答題回顧與詳解」的標題
  const reviewTitle = document.createElement('h3');
  reviewTitle.style.cssText = 'text-align: center; margin: 2rem 0 1rem 0; font-size: 1.25rem; font-weight: 700; color: var(--primary-color);';
  reviewTitle.innerText = texts.answersSummaryTitle;
  container.appendChild(reviewTitle);
  
  activeQuestions.forEach((q, idx) => {
    container.appendChild(createQuestionCard(q, idx, texts));
  });
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateComment(pct) {
  const texts = i18n[currentLang];
  let comment = '';
  if (pct === 100) comment = texts.commentExcellent;
  else if (pct >= 80) comment = texts.commentGood;
  else if (pct >= 60) comment = texts.commentPass;
  else comment = texts.commentFail;
  
  document.getElementById('summary-comment-text').innerText = comment;
}

// 語系無縫切換
function switchLanguage(lang) {
  if (langMode !== 'bilingual') return;
  currentLang = lang;
  
  document.getElementById('btn-lang-cn').classList.toggle('active', lang === 'cn');
  document.getElementById('btn-lang-en').classList.toggle('active', lang === 'en');
  
  updateLobbyUI();
  updateUIVocabulary();
}

function updateUIVocabulary() {
  const texts = i18n[currentLang];
  
  // 更新計分板與大廳
  const progressVal = document.getElementById('progress-val').innerText;
  document.getElementById('ui-progress').innerHTML = `${texts.progress}: <span id="progress-val">${progressVal}</span>`;
  
  if (isQuizSubmitted) {
    const scoreVal = document.getElementById('score-val').innerText;
    document.getElementById('ui-score').innerHTML = `${texts.score}: <span id="score-val">${scoreVal}</span>`;
  }
  
  // 更新結算
  document.getElementById('summary-title').innerText = texts.summaryTitle;
  document.getElementById('summary-student-display').innerText = texts.studentDisplay.replace('{name}', studentName);
  document.getElementById('btn-retry-text').innerText = texts.btnRetry;
  
  // 更新不及格重做提示文字
  const retryHintEl = document.getElementById('retry-hint');
  if (retryHintEl && retryHintEl.style.display !== 'none') {
    retryHintEl.innerText = texts.retryForCert.replace('{passing}', passingScore);
  }
  
  // 長卷提交按鈕
  document.getElementById('btn-submit-all-quiz').innerText = `${texts.submit}`;
  
  // 更新卡片內容
  activeQuestions.forEach((q, idx) => {
    const qData = q[currentLang] || q['cn'] || q['en'];
    if (!qData) return;
    
    const numElem = document.getElementById(`q-num-${idx}`);
    if (numElem) numElem.innerText = texts.question.replace('{num}', idx + 1);
    
    const textElem = document.getElementById(`q-text-${idx}`);
    if (textElem) textElem.innerText = qData.q;
    
    ['A', 'B', 'C', 'D'].forEach((letter, oIdx) => {
      const optTextElem = document.getElementById(`opt-text-${idx}-${letter}`);
      if (optTextElem) {
        const mappedIdx = (q.shuffledIndices && q.shuffledIndices.length === 4) ? q.shuffledIndices[oIdx] : oIdx;
        optTextElem.innerText = qData.o[mappedIdx];
      }
    });
    
    // 如果尚未提交，更新 Next/Prev/Submit 按鈕文字
    if (!isQuizSubmitted) {
      const btnNext = document.getElementById(`btn-next-${idx}`);
      if (btnNext) btnNext.innerText = texts.next;
      
      const btnSubmit = document.getElementById(`btn-submit-${idx}`);
      if (btnSubmit) btnSubmit.innerText = texts.submit;
      
      const btnPrev = document.querySelector(`#q-card-${idx} .prev-btn`);
      if (btnPrev) btnPrev.innerText = texts.prev;
    } else {
      // 若已提交，更新解析區文字
      const fBox = document.getElementById(`feedback-${idx}`);
      if (fBox) {
        const isCorrect = submittedAnswers[idx] ? submittedAnswers[idx].isCorrect : false;
        const correctAns = q.ans;
        fBox.innerHTML = `
          <div class="feedback-title">
            ${isCorrect 
              ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> ${texts.correct}` 
              : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> ${texts.incorrect} ${texts.correctAnswer} ${correctAns}`
            }
          </div>
          ${(qData && qData.exp) ? `<div class="feedback-explanation"><strong>${texts.explanationTitle}:</strong> ${qData.exp}</div>` : ''}
        `;
      }
    }
  });
}

// 重新挑戰
function resetQuiz() {
  userAnswers = {};
  submittedAnswers = {};
  currentQuestionIndex = 0;
  isQuizSubmitted = false;
  
  // 返回大廳
  document.getElementById('summary-section').style.display = 'none';
  document.getElementById('questions-container').style.display = 'none';
  document.getElementById('lobby-section').style.display = 'block';
  
  // 隱藏並重設證書
  const certContainer = document.getElementById('cert-container');
  if (certContainer) {
    certContainer.style.display = 'none';
  }
  const certImg = document.getElementById('cert-image');
  if (certImg) {
    certImg.src = '';
  }
  
  // 隱藏並清空重做提示
  const retryHintEl = document.getElementById('retry-hint');
  if (retryHintEl) {
    retryHintEl.style.display = 'none';
    retryHintEl.innerText = '';
  }
  
  toggleStartButton();
  updateLobbyUI();
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// 🏆 證書動態生成系統 (Canvas Rendering System)
// ==========================================

function generateCertificate(name, scorePercent, correctCount, totalCount) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 840;
  const ctx = canvas.getContext('2d');
  
  // 獲取當前主題色
  const primaryColor = themePrimaryColor || '#0284c7';
  
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
  
  // 5. 證書標題 (固定為修畢證書)
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
  ctx.fillText(name, 600, 395);
  
  // 學生底線
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(350, 410);
  ctx.lineTo(850, 410);
  ctx.stroke();
  
  // 茲證明完成互動學習
  ctx.fillStyle = '#475569';
  ctx.font = '500 20px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText('已成功完成本校之電子學習評估任務', 600, 460);
  
  ctx.fillStyle = '#64748B';
  ctx.font = 'italic 14px "Outfit", sans-serif';
  ctx.fillText('has successfully completed the e-learning assessment task:', 600, 485);
  
  // 從 DOM 中取得學科和標題
  const subjectEl = document.getElementById('lobby-sub-subject');
  const titleEl = document.getElementById('lobby-main-title');
  const subjectStr = subjectEl ? subjectEl.innerText.trim() : '';
  const titleStr = titleEl ? titleEl.innerText.trim() : '';
  
  // 課卷資訊
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 24px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText(`《${subjectStr} - ${titleStr}》`, 600, 535);
  
  // 得分
  ctx.fillStyle = primaryColor;
  ctx.font = 'bold 26px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.fillText(`答對題數 (Score)：${correctCount} / ${totalCount} (${scorePercent}%)`, 600, 595);
  
  // 頒發日期與印章
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  
  ctx.fillStyle = '#64748B';
  ctx.font = '500 14px "Outfit", sans-serif';
  ctx.fillText(`頒發日期 (Date)：${formattedDate}`, 600, 645);
  
  // 7. 繪製勳章 (Seal)
  drawSeal(ctx, 220, 690, 55, 30, 55, 45, scorePercent);
  
  // 8. 繪製學校印章
  drawSchoolSeal(ctx, 980, 690);
  
  // 9. 轉為圖片並顯示
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const img = document.getElementById('cert-image');
    if (img) img.src = dataUrl;
    
    const certCont = document.getElementById('cert-container');
    if (certCont) certCont.style.display = 'block';
  } catch (e) {
    console.error('Failed to generate certificate image:', e);
  }
}

// 繪製四角裝飾
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
  
  // 中間主文字 (固定為 COMPLETED)
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
  
  // 印章字樣「圓玄三中電子之印」
  ctx.fillText('圓玄', cx - 20, cy - 20);
  ctx.fillText('三中', cx + 20, cy - 20);
  ctx.fillText('學習', cx - 20, cy + 20);
  ctx.fillText('之印', cx + 20, cy + 20);
}

// ==========================================
// 💬 自訂防呆對話框系統 (Custom Confirm Modal System)
// ==========================================

function showCustomModal(message, onConfirm) {
  const modal = document.getElementById('custom-modal');
  const body = document.getElementById('custom-modal-body');
  const confirmBtn = document.getElementById('custom-modal-btn-confirm');
  
  if (!modal || !body || !confirmBtn) return;
  
  body.innerText = message;
  
  // 綁定點擊事件，點擊後關閉 modal 並呼叫確認回調
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
