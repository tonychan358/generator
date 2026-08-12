const fs = require('fs');
const vm = require('vm');

try {
  const code = fs.readFileSync('index.html', 'utf8');
  const matches = code.matchAll(/<script>([\s\S]*?)<\/script>/gi);
  let scriptIndex = 0;
  let hasErrors = false;
  
  for (const match of matches) {
    scriptIndex++;
    const scriptContent = match[1];
    try {
      new vm.Script(scriptContent, { filename: `index.html[script-${scriptIndex}]` });
    } catch (e) {
      hasErrors = true;
      console.error(`Error in script block ${scriptIndex}:`);
      console.error(e.stack);
      
      const lines = scriptContent.split('\n');
      const errLine = e.stack.match(/index\.html\[script-\d+\]:(\d+)/);
      if (errLine) {
        const lineNum = parseInt(errLine[1]);
        console.error(`\nLine ${lineNum} surrounding code:`);
        for (let i = Math.max(0, lineNum - 5); i < Math.min(lines.length, lineNum + 5); i++) {
          console.error(`${i + 1}: ${lines[i]}`);
        }
      }
    }
  }
  
  if (hasErrors) {
    console.error("❌ 語法檢查未通過！發現錯誤。");
    process.exit(1);
  } else {
    console.log("✅ 靜態語法檢查完成。沒有發現 SyntaxError！");
  }
} catch (err) {
  console.error("讀取或檢查 index.html 失敗:", err);
  process.exit(1);
}
