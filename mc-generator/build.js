const fs = require('fs');
const path = require('path');

function build() {
  console.log('Starting build process for MC Generator...');
  
  const srcDir = path.join(__dirname, 'src');
  
  // 檢查 src 目錄下的檔案是否存在
  const quizCssPath = path.join(srcDir, 'quiz.css');
  const quizJsPath = path.join(srcDir, 'quiz.js');
  const quizTemplatePath = path.join(srcDir, 'quiz-template.html');
  const generatorHtmlPath = path.join(srcDir, 'generator.html');
  
  if (!fs.existsSync(quizCssPath) || !fs.existsSync(quizJsPath) || 
      !fs.existsSync(quizTemplatePath) || !fs.existsSync(generatorHtmlPath)) {
    console.error('Error: Missing source files in src/ directory.');
    process.exit(1);
  }

  // 讀取檔案
  const quizCss = fs.readFileSync(quizCssPath, 'utf8');
  const quizJs = fs.readFileSync(quizJsPath, 'utf8');
  let quizTemplate = fs.readFileSync(quizTemplatePath, 'utf8');
  
  // 將 CSS 與 JS 注入至學生端網頁模板
  quizTemplate = quizTemplate
    .replace('/* {{QUIZ_CSS}} */', quizCss)
    .replace('// {{QUIZ_JS}}', quizJs);
  
  // 轉義學生端模板，使其能夠安全地包裹在外層產生器的 JS 模板字串中
  let escapedTemplate = quizTemplate
    .replace(/\\/g, '\\\\')        // 1. 轉義反斜線
    .replace(/`/g, '\\`')          // 2. 轉義重音符 (backtick)
    .replace(/\$\{/g, '\\${')      // 3. 轉義 ${
    .replace(/<\/script>/g, '<\\/script>')  // 4. 轉義結束 script 標籤防止提前截斷
    .replace(/<\/style>/g, '<\\/style>');   // 5. 轉義結束 style 標籤以保安全
  
  // 將特定的預留位置替換為對應的 JavaScript 模板變數 (非轉義的 ${...})，以便在 buildQuizHTML 調用時動態渲染
  escapedTemplate = escapedTemplate
    .replace(/\/\* \{\{QUIZ_TITLE\}\} \*\//g, '${title}')
    .replace(/\/\* \{\{QUIZ_SUBJECT\}\} \*\//g, '${subject}')
    .replace(/"\/\* \{\{LANG_MODE\}\} \*\/"/g, "'\${langMode}'")
    .replace(/"\/\* \{\{QUIZ_MODE\}\} \*\/"/g, "'\${quizMode}'")
    .replace(/"\/\* \{\{ORDER_MODE\}\} \*\/"/g, "'\${orderMode}'")
    .replace(/\/\* \{\{PASSING_SCORE\}\} \*\//g, '${passingScore}')
    .replace(/\/\* \{\{QUESTIONS_DATA\}\} \*\//g, '${stringifiedData}')
    .replace(/\/\* \{\{THEME_PRIMARY\}\} \*\//g, '${theme.primary}')
    .replace(/\/\* \{\{THEME_PRIMARY_HOVER\}\} \*\//g, '${theme.primaryHover}')
    .replace(/\/\* \{\{THEME_PRIMARY_LIGHT\}\} \*\//g, '${theme.primaryLight}')
    .replace(/\/\* \{\{THEME_BG_START\}\} \*\//g, '${theme.bgGradientStart}')
    .replace(/\/\* \{\{THEME_BG_END\}\} \*\//g, '${theme.bgGradientEnd}')
    .replace(/\/\* \{\{THEME_ACCENT_BG\}\} \*\//g, '${theme.accentBg}')
    .replace(/\/\* \{\{THEME_SHADOW_COLOR\}\} \*\//g, '${theme.shadowColor}');

  // 建立 buildQuizHTML 函數內部的 return 代碼
  const buildQuizHTMLCode = `return \`${escapedTemplate}\`;`;
  
  // 讀取產生器外殼
  let generatorHtml = fs.readFileSync(generatorHtmlPath, 'utf8');
  
  // 將模板程式碼注入產生器的 buildQuizHTML 函數中
  generatorHtml = generatorHtml.replace('/* {{QUIZ_TEMPLATE_STRING}} */', buildQuizHTMLCode);
  
  // 輸出至專案根目錄
  const outputPath = path.join(__dirname, 'index.html');
  fs.writeFileSync(outputPath, generatorHtml, 'utf8');
  
  console.log(`Successfully compiled and built ${outputPath}!`);
}

build();
