export const playwrightSummaryReporterCode = `
class SummaryReporter {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.startTime = Date.now();
  }

  onTestEnd(test, result) {
    if (result.status === 'passed') {
      this.passed++;
    } else {
      this.failed++;
    }
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
  }
}

module.exports = SummaryReporter;
`
