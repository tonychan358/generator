const fs = require('fs');
const vm = require('vm');

try {
  const code = fs.readFileSync('index.html', 'utf8');
  const matches = code.matchAll(/<script>([\s\S]*?)<\/script>/gi);
  let scriptIndex = 0;
  for (const match of matches) {
    scriptIndex++;
    const scriptContent = match[1];
    try {
      new vm.Script(scriptContent, { filename: `index.html[script-${scriptIndex}]` });
    } catch (e) {
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
  console.log("Check complete.");
} catch (err) {
  console.error("Failed to read or check file:", err);
}
