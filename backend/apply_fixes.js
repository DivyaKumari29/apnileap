const fs = require('fs');

const path = 'c:/uni/projects/apnileap/backend/server.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix hardcoded dates
content = content.replace(/new Date\("2026-05-27"\)/g, 'new Date()');

// 2. Fix mockTasksStore persistence
const mockInitTarget = `let mockTasksStore = {
  "3": [],
  "101": [],
  "102": [],
  "103": []
};`;

const mockInitReplacement = `const fs = require('fs');
let mockTasksStore = {
  "3": [],
  "101": [],
  "102": [],
  "103": []
};
if (fs.existsSync('./mockTasks.json')) {
  try {
    mockTasksStore = JSON.parse(fs.readFileSync('./mockTasks.json', 'utf8'));
  } catch (e) {
    console.error("Failed to load mockTasksStore", e);
  }
}
const saveMockStore = () => fs.writeFileSync('./mockTasks.json', JSON.stringify(mockTasksStore, null, 2));`;

content = content.replace(mockInitTarget, mockInitReplacement);

// We need to inject `saveMockStore()` into all places where mockTasksStore is modified.
// For example: `mockTasksStore[boardId] = issues;`
content = content.replace(/mockTasksStore\[.*?\] = issues;/g, match => `${match} saveMockStore();`);
content = content.replace(/spokeTasks\.push\((.*?)\);/g, match => `${match} saveMockStore();`);

fs.writeFileSync(path, content, 'utf8');
console.log("Bugfixes applied successfully to server.js");
