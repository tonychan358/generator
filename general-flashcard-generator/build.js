const fs = require('fs');
const path = require('path');

function build() {
  console.log('正在為 通用跨學科翻卡溫習產生器 執行打包程序...');
  
  const srcDir = path.join(__dirname, 'src');
  
  // 驗證檔案是否存在
  const cssPath = path.join(srcDir, 'flashcard.css');
  const jsPath = path.join(srcDir, 'flashcard.js');
  const templatePath = path.join(srcDir, 'flashcard-template.html');
  const generatorPath = path.join(srcDir, 'generator.html');
  
  if (!fs.existsSync(cssPath) || !fs.existsSync(jsPath) || 
      !fs.existsSync(templatePath) || !fs.existsSync(generatorPath)) {
    console.error('錯誤：在 src/ 資料夾下找不到必要的源代碼檔案。');
    process.exit(1);
  }

  // 讀取源代碼
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const jsContent = fs.readFileSync(jsPath, 'utf8');
  let templateContent = fs.readFileSync(templatePath, 'utf8');
  
  // 將 CSS 與 JS 注入至學生端模板中
  templateContent = templateContent
    .replace('/* {{QUIZ_CSS}} */', cssContent)
    .replace('// {{QUIZ_JS}}', jsContent);
  
  // 轉義模板字串，使其可以安全地嵌套在教師端產生器的反引號 (backtick) 變數中
  let escapedTemplate = templateContent
    .replace(/\\/g, '\\\\')        // 1. 轉義反斜線
    .replace(/`/g, '\\`')          // 2. 轉義反引號
    .replace(/\$\{/g, '\\${')      // 3. 轉義 ${
    .replace(/<\/script>/g, '<\\/script>')  // 4. 轉義 script 關閉標籤
    .replace(/<\/style>/g, '<\\/style>');   // 5. 轉義 style 關閉標籤
  
  // 重新還原運行時需要評估的 ES6 模板佔位符
  escapedTemplate = escapedTemplate
    .replace(/\/\* \{\{DICT_TITLE\}\} \*\//g, '${titleZh || titleEn}')
    .replace(/\/\* \{\{DICT_SUBJECT\}\} \*\//g, '${subjectZh || subjectEn}')
    .replace(/'\\\$\{ttsSetting\}'/g, "'\${ttsSetting}'")
    .replace(/'\\\$\{ttsFace\}'/g, "'\${ttsFace}'")
    .replace(/'\\\$\{studyMode\}'/g, "'\${studyMode}'")
    .replace(/'\\\$\{subjectZh\}'/g, "'\${subjectZh}'")
    .replace(/'\\\$\{subjectEn\}'/g, "'\${subjectEn}'")
    .replace(/'\\\$\{titleZh\}'/g, "'\${titleZh}'")
    .replace(/'\\\$\{titleEn\}'/g, "'\${titleEn}'")
    .replace(/\\\$\{stringifiedData\}/g, '${stringifiedData}')
    .replace(/\/\* \{\{THEME_PRIMARY\}\} \*\//g, '${theme.primary}')
    .replace(/\/\* \{\{THEME_PRIMARY_HOVER\}\} \*\//g, '${theme.primaryHover}')
    .replace(/\/\* \{\{THEME_PRIMARY_LIGHT\}\} \*\//g, '${theme.primaryLight}')
    .replace(/\/\* \{\{THEME_BG_START\}\} \*\//g, '${theme.bgGradientStart}')
    .replace(/\/\* \{\{THEME_BG_END\}\} \*\//g, '${theme.bgGradientEnd}')
    .replace(/\/\* \{\{THEME_ACCENT_BG\}\} \*\//g, '${theme.accentBg}')
    .replace(/\/\* \{\{THEME_SHADOW_COLOR\}\} \*\//g, '${theme.shadowColor}');

  const buildHTMLCode = `return \`${escapedTemplate}\`;`;
  
  // 讀取教師端產生器 HTML
  let generatorContent = fs.readFileSync(generatorPath, 'utf8');
  
  // 注入打包完成的代碼至 buildCardHTML 函數佔位符中
  generatorContent = generatorContent.replace('/* {{QUIZ_TEMPLATE_STRING}} */', buildHTMLCode);
  
  // 寫入專案根目錄的 index.html
  const outputPath = path.join(__dirname, 'index.html');
  fs.writeFileSync(outputPath, generatorContent, 'utf8');
  
  console.log(`成功編譯並打包至成品：${outputPath}`);
}

build();
