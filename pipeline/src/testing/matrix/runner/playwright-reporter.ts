/*
 * Summary reporter injected into matrix Playwright runs.
 *
 * The Dagger exec throws on a non-zero Playwright exit, so the default
 * reporters' streamed output can be lost. This reporter is the only channel
 * that survives: it prints an aggregate line plus, on failure, each failing
 * test's title and assertion messages so the container log names the break
 * instead of only reporting a count.
 */
export const playwrightSummaryReporterCode = `
class SummaryReporter {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.failures = [];
    this.startTime = Date.now();
  }

  onTestEnd(test, result) {
    if (result.status === 'passed') {
      this.passed++;
      return;
    }

    this.failed++;

    const titlePath = typeof test.titlePath === 'function' ? test.titlePath() : [];
    const title = titlePath.filter(Boolean).join(' \\u203a ');
    const errors = Array.isArray(result.errors) && result.errors.length > 0
      ? result.errors
      : (result.error ? [result.error] : []);
    const messages = errors
      .map((error) => (error && error.message ? String(error.message) : String(error)))
      .filter((message) => message.trim().length > 0);

    this.failures.push({ title: title || test.title, messages });
  }

  onEnd() {
    const total = this.passed + this.failed;
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1) + 's';
    
    // ANSI codes for Vitest-like coloring
    const bold = (s) => '\\x1b[1m' + s + '\\x1b[0m';
    const boldGreen = (s) => '\\x1b[1;32m' + s + '\\x1b[0m';
    const boldRed = (s) => '\\x1b[1;31m' + s + '\\x1b[0m';
    const dim = (s) => '\\x1b[2m' + s + '\\x1b[0m';

    let testsStr = '';
    if (this.failed > 0) {
      testsStr = boldGreen(this.passed + ' passed') + ' | ' + boldRed(this.failed + ' failed') + ' ' + dim('(' + total + ')');
    } else {
      testsStr = boldGreen(this.passed + ' passed') + ' ' + dim('(' + total + ')');
    }

    const startAt = new Date(this.startTime).toLocaleTimeString('en-US', { hour12: false });

    console.log('');
    console.log('🎭 ' + bold('Playwright') + ' ' + testsStr);
    console.log('    Start at  ' + startAt);
    console.log('    Duration  ' + duration);
    console.log('');

    if (this.failures.length > 0) {
      console.log(boldRed('  Failed tests:'));
      for (const failure of this.failures) {
        console.log('    ' + boldRed('\\u2718') + ' ' + failure.title);
        for (const message of failure.messages) {
          for (const line of message.split('\\n')) {
            console.log('        ' + line);
          }
        }
        console.log('');
      }
    }
  }
}

module.exports = SummaryReporter;
`
