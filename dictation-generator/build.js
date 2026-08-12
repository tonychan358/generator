const fs = require('fs');
const path = require('path');

function build() {
  console.log('Starting build process for Dictation Generator...');
  
  const srcDir = path.join(__dirname, 'src');
  
  // 檢查源檔案
  const cssPath = path.join(srcDir, 'dictation.css');
  const jsPath = path.join(srcDir, 'dictation.js');
  const templatePath = path.join(srcDir, 'dictation-template.html');
  const generatorPath = path.join(srcDir, 'generator.html');
  
  if (!fs.existsSync(cssPath) || !fs.existsSync(jsPath) || 
      !fs.existsSync(templatePath) || !fs.existsSync(generatorPath)) {
    console.error('Error: Missing source files in src/ directory.');
    process.exit(1);
  }

  // 讀取檔案
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const jsContent = fs.readFileSync(jsPath, 'utf8');
  let templateContent = fs.readFileSync(templatePath, 'utf8');
  
  // 注入 CSS 與 JS 至學生端網頁模板
  templateContent = templateContent
    .replace('/* {{QUIZ_CSS}} */', cssContent)
    .replace('// {{QUIZ_JS}}', jsContent);
  
  // 轉義處理使其能被包裹在 JS 模板字串中
  let escapedTemplate = templateContent
    .replace(/\\/g, '\\\\')        // 1. 轉義反斜線
    .replace(/`/g, '\\`')          // 2. 轉義重音符
    .replace(/\$\{/g, '\\${')      // 3. 轉義 ${
    .replace(/<\/script>/g, '<\\/script>')  // 4. 轉義結束 script 標籤
    .replace(/<\/style>/g, '<\\/style>');   // 5. 轉義結束 style 標籤
  
  // 將特定 placeholders 替換為未轉義的 ES6 模板變數，以便在 buildDictHTML 運行時動態生成
  escapedTemplate = escapedTemplate
    .replace(/\/\* \{\{DICT_TITLE\}\} \*\//g, '${title}')
    .replace(/\/\* \{\{DICT_SUBJECT\}\} \*\//g, '${subject}')
    .replace(/'\\\$\{dictAccent\}'/g, "'\${dictAccent}'")
    .replace(/'\\\$\{dictMode\}'/g, "'\${dictMode}'")
    .replace(/\\\$\{isCaseSensitive\}/g, '${isCaseSensitive}')
    .replace(/\\\$\{isIgnorePunctuation\}/g, '${isIgnorePunctuation}')
    .replace(/\\\$\{stringifiedData\}/g, '${stringifiedData}')
    .replace(/\/\* \{\{THEME_PRIMARY\}\} \*\//g, '${theme.primary}')
    .replace(/\/\* \{\{THEME_PRIMARY_HOVER\}\} \*\//g, '${theme.primaryHover}')
    .replace(/\/\* \{\{THEME_PRIMARY_LIGHT\}\} \*\//g, '${theme.primaryLight}')
    .replace(/\/\* \{\{THEME_BG_START\}\} \*\//g, '${theme.bgGradientStart}')
    .replace(/\/\* \{\{THEME_BG_END\}\} \*\//g, '${theme.bgGradientEnd}')
    .replace(/\/\* \{\{THEME_ACCENT_BG\}\} \*\//g, '${theme.accentBg}')
    .replace(/\/\* \{\{THEME_SHADOW_COLOR\}\} \*\//g, '${theme.shadowColor}');

  const buildDictHTMLCode = `return \`${escapedTemplate}\`;`;
  
  // 讀取產生器本體
  let generatorContent = fs.readFileSync(generatorPath, 'utf8');
  
  // 注入編譯代碼到 buildDictHTML 函數中
  generatorContent = generatorContent.replace('/* {{QUIZ_TEMPLATE_STRING}} */', buildDictHTMLCode);
  
  // 寫入到專案根目錄
  const outputPath = path.join(__dirname, 'index.html');
  fs.writeFileSync(outputPath, generatorContent, 'utf8');
  
  console.log(`Successfully compiled and built ${outputPath}!`);
}

build();
