import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'
const url = process.argv[2]
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const observations = []
try {
  const page = await browser.newPage({ viewport: { width: 1050, height: 1000 } })
  for (const text of ['2.3', '11']) {
    for (const action of ['Enter', 'blur']) {
      await page.goto(`${url}/repro-number-form.html`)
      const input = page.getByLabel('validate amount', { exact: true })
      await input.click()
      await input.press('Meta+A')
      await input.pressSequentially(text)
      if (action === 'Enter') await input.press('Enter')
      else await page.getByRole('button', { name: 'Submit validate', exact: true }).click()
      await page.waitForTimeout(150)
      const result = {
        text, action, input: await input.inputValue(),
        invalid: await input.getAttribute('aria-invalid'),
        canonical: await page.getByTestId('value-validate').innerText(),
        events: JSON.parse(await page.getByTestId('events-validate').innerText()),
        submitAlreadyCanceled: await page.getByTestId('prevented-validate').innerText(),
      }
      observations.push(result)
      if (text === '2.3' && action === 'Enter') await page.screenshot({ path: 'evidence/supervisor-invalid-commit.png', fullPage: true })
    }
  }
  const report = { url, observations }
  await writeFile('logs/supervisor-invalid-commit.json', JSON.stringify(report, null, 2))
  await writeFile('logs/supervisor-invalid-commit.log', 'SUPERVISOR: independent real-keyboard NumberField invalid-commit reproduction\n' + JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
} finally { await browser.close() }
