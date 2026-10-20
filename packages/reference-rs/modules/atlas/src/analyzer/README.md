# Analyzer ownership tests

Pins for which modules count as the app's own code. Each test builds a throwaway project whose library renders observed and tracked components internally, then asserts only the app's call sites count — with the library placed under the module directory, beside the app, or included by glob.
