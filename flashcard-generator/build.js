const fs = require('fs');
const path = require('path');

function build() {
  console.log('Starting build process for Flashcard Generator...');
  
  const srcDir = path.join(__dirname, 'src');
  
  // Verify files exist
  const cssPath = path.join(srcDir, 'flashcard.css');
  const jsPath = path.join(srcDir, 'flashcard.js');
  const templatePath = path.join(srcDir, 'flashcard-template.html');
  const generatorPath = path.join(srcDir, 'generator.html');
  
  if (!fs.existsSync(cssPath) || !fs.existsSync(jsPath) || 
      !fs.existsSync(templatePath) || !fs.existsSync(generatorPath)) {
    console.error('Error: Missing source files in src/ directory.');
    process.exit(1);
  }

  // Read contents
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const jsContent = fs.readFileSync(jsPath, 'utf8');
  let templateContent = fs.readFileSync(templatePath, 'utf8');
  
  // Inject CSS and JS into student template
  templateContent = templateContent
    .replace('/* {{QUIZ_CSS}} */', cssContent)
    .replace('// {{QUIZ_JS}}', jsContent);
  
  // Escape template content so it can be safely nested within a backtick template string
  let escapedTemplate = templateContent
    .replace(/\\/g, '\\\\')        // 1. Escape backslashes
    .replace(/`/g, '\\`')          // 2. Escape backticks
    .replace(/\$\{/g, '\\${')      // 3. Escape ${
    .replace(/<\/script>/g, '<\\/script>')  // 4. Escape closing script tags
    .replace(/<\/style>/g, '<\\/style>');   // 5. Escape closing style tags
  
  // Unescape specific ES6 template placeholders for runtime evaluation
  escapedTemplate = escapedTemplate
    .replace(/\/\* \{\{DICT_TITLE\}\} \*\//g, '${title}')
    .replace(/\/\* \{\{DICT_SUBJECT\}\} \*\//g, '${subject}')
    .replace(/'\\\$\{dictAccent\}'/g, "'\${dictAccent}'")
    .replace(/'\\\$\{initialCardFace\}'/g, "'\${initialCardFace}'")
    .replace(/\\\$\{stringifiedData\}/g, '${stringifiedData}')
    .replace(/\/\* \{\{THEME_PRIMARY\}\} \*\//g, '${theme.primary}')
    .replace(/\/\* \{\{THEME_PRIMARY_HOVER\}\} \*\//g, '${theme.primaryHover}')
    .replace(/\/\* \{\{THEME_PRIMARY_LIGHT\}\} \*\//g, '${theme.primaryLight}')
    .replace(/\/\* \{\{THEME_BG_START\}\} \*\//g, '${theme.bgGradientStart}')
    .replace(/\/\* \{\{THEME_BG_END\}\} \*\//g, '${theme.bgGradientEnd}')
    .replace(/\/\* \{\{THEME_ACCENT_BG\}\} \*\//g, '${theme.accentBg}')
    .replace(/\/\* \{\{THEME_SHADOW_COLOR\}\} \*\//g, '${theme.shadowColor}');

  const buildHTMLCode = `return \`${escapedTemplate}\`;`;
  
  // Read generator HTML
  let generatorContent = fs.readFileSync(generatorPath, 'utf8');
  
  // Inject built code into the generator buildCardHTML function placeholder
  generatorContent = generatorContent.replace('/* {{QUIZ_TEMPLATE_STRING}} */', buildHTMLCode);
  
  // Write index.html at root
  const outputPath = path.join(__dirname, 'index.html');
  fs.writeFileSync(outputPath, generatorContent, 'utf8');
  
  console.log(`Successfully compiled and built ${outputPath}!`);
}

build();
