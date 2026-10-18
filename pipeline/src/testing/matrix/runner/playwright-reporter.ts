/*
 * Summary reporter injected into matrix Playwright runs.
 *
 * The Dagger exec throws on a non-zero Playwright exit, so the default
 * reporters' streamed output can be lost. This reporter is the only channel
 * that survives: it prints an aggregate line plus, on failure, each failing
 * test's title and assertion messages so the container log names the break
 * instead of only reporting a count.
 *
 * Each test counts once, by its Playwright outcome after retries: a test
 * marked `test.fail` that fails is expected (counted apart, never as
 * failed), one that passes is unexpected, and skipped and flaky tests are
 * counted apart too. Only unexpected outcomes are failures, as Playwright's
 * own exit code judges them.
 */
export const playwrightSummaryReporterCode = `
class SummaryReporter {
  constructor() {
    this.tests = new Map();
    this.startTime = Date.now();
  }

  onTestEnd(test, result) {
    // Each retry reports again; the last attempt and the test's outcome decide.
    this.tests.set(test.id, { test, result });
  }

  outcome(test, result) {
    if (typeof test.outcome === 'function') return test.outcome();
    if (result.status === 'skipped') return 'skipped';
    return result.status === test.expectedStatus ? 'expected' : 'unexpected';
  }

  failure(test, result) {
    const titlePath = typeof test.titlePath === 'function' ? test.titlePath() : [];
    const title = titlePath.filter(Boolean).join(' \\u203a ');
    const errors = Array.isArray(result.errors) && result.errors.length > 0
      ? result.errors
      : (result.error ? [result.error] : []);
    const messages = errors
      .map((error) => (error && error.message ? String(error.message) : String(error)))
      .filter((message) => message.trim().length > 0);
    if (messages.length === 0 && test.expectedStatus === 'failed') {
      messages.push('expected to fail, but ' + result.status);
    }
    return { title: title || test.title, messages };
  }

  tally() {
    const counts = { passed: 0, expectedFailures: 0, flaky: 0, skipped: 0, failed: 0 };
    const failures = [];
    for (const { test, result } of this.tests.values()) {
      const outcome = this.outcome(test, result);
      if (outcome === 'skipped') counts.skipped++;
      else if (outcome === 'flaky') counts.flaky++;
      else if (outcome === 'expected' && test.expectedStatus === 'failed') counts.expectedFailures++;
      else if (outcome === 'expected') counts.passed++;
      else {
        counts.failed++;
        failures.push(this.failure(test, result));
      }
    }
    return { counts, failures };
  }

  onEnd() {
    const { counts, failures } = this.tally();
    const total = this.tests.size;
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1) + 's';

    // ANSI codes for Vitest-like coloring
    const bold = (s) => '\\x1b[1m' + s + '\\x1b[0m';
    const boldGreen = (s) => '\\x1b[1;32m' + s + '\\x1b[0m';
    const boldRed = (s) => '\\x1b[1;31m' + s + '\\x1b[0m';
    const yellow = (s) => '\\x1b[33m' + s + '\\x1b[0m';
    const dim = (s) => '\\x1b[2m' + s + '\\x1b[0m';

    const parts = [boldGreen(counts.passed + ' passed')];
    if (counts.expectedFailures > 0) parts.push(dim(counts.expectedFailures + ' expected to fail'));
    if (counts.flaky > 0) parts.push(yellow(counts.flaky + ' flaky'));
    if (counts.skipped > 0) parts.push(dim(counts.skipped + ' skipped'));
    if (counts.failed > 0) parts.push(boldRed(counts.failed + ' failed'));
    const testsStr = parts.join(' | ') + ' ' + dim('(' + total + ')');

    const startAt = new Date(this.startTime).toLocaleTimeString('en-US', { hour12: false });

    console.log('');
    console.log('🎭 ' + bold('Playwright') + ' ' + testsStr);
    console.log('    Start at  ' + startAt);
    console.log('    Duration  ' + duration);
    console.log('');

    if (failures.length > 0) {
      console.log(boldRed('  Failed tests:'));
      for (const failure of failures) {
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
