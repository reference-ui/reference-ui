import fs from 'fs'
const report = JSON.parse(fs.readFileSync('packages/reference-lib/playwright/test-results/results.json', 'utf8'))
const attachments = report.suites[0].suites[0].specs[0].tests[0].results[0].attachments
console.log(attachments)
