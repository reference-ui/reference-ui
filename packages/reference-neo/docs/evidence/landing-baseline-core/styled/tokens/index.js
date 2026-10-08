const tokens = {
  "spacing.px": {
    "value": "1px",
    "variable": "var(--spacing-px)"
  },
  "spacing.r": {
    "value": "var(--spacing-root)",
    "variable": "var(--spacing-r)"
  },
  "spacing.0.5r": {
    "value": "calc(0.5 * var(--spacing-root))",
    "variable": "var(--spacing-0\\.5r)"
  },
  "spacing.1/2r": {
    "value": "calc(var(--spacing-root) / 2)",
    "variable": "var(--spacing-1\\/2r)"
  },
  "spacing.1/3r": {
    "value": "calc(var(--spacing-root) / 3)",
    "variable": "var(--spacing-1\\/3r)"
  },
  "spacing.1/4r": {
    "value": "calc(var(--spacing-root) / 4)",
    "variable": "var(--spacing-1\\/4r)"
  },
  "spacing.1/5r": {
    "value": "calc(var(--spacing-root) / 5)",
    "variable": "var(--spacing-1\\/5r)"
  },
  "spacing.1/6r": {
    "value": "calc(var(--spacing-root) / 6)",
    "variable": "var(--spacing-1\\/6r)"
  },
  "spacing.1r": {
    "value": "var(--spacing-root)",
    "variable": "var(--spacing-1r)"
  },
  "spacing.1.5r": {
    "value": "calc(1.5 * var(--spacing-root))",
    "variable": "var(--spacing-1\\.5r)"
  },
  "spacing.2r": {
    "value": "calc(2 * var(--spacing-root))",
    "variable": "var(--spacing-2r)"
  },
  "spacing.3r": {
    "value": "calc(3 * var(--spacing-root))",
    "variable": "var(--spacing-3r)"
  },
  "spacing.4r": {
    "value": "calc(4 * var(--spacing-root))",
    "variable": "var(--spacing-4r)"
  },
  "spacing.5r": {
    "value": "calc(5 * var(--spacing-root))",
    "variable": "var(--spacing-5r)"
  },
  "spacing.6r": {
    "value": "calc(6 * var(--spacing-root))",
    "variable": "var(--spacing-6r)"
  },
  "spacing.8r": {
    "value": "calc(8 * var(--spacing-root))",
    "variable": "var(--spacing-8r)"
  },
  "spacing.8.5r": {
    "value": "calc(8.5 * var(--spacing-root))",
    "variable": "var(--spacing-8\\.5r)"
  },
  "spacing.10r": {
    "value": "calc(10 * var(--spacing-root))",
    "variable": "var(--spacing-10r)"
  },
  "spacing.12r": {
    "value": "calc(12 * var(--spacing-root))",
    "variable": "var(--spacing-12r)"
  },
  "colors.slate.50": {
    "value": "oklch(98.4% 0.003 247.858)",
    "variable": "var(--colors-slate-50)"
  },
  "colors.slate.100": {
    "value": "oklch(96.8% 0.007 247.896)",
    "variable": "var(--colors-slate-100)"
  },
  "colors.slate.200": {
    "value": "oklch(92.9% 0.013 255.508)",
    "variable": "var(--colors-slate-200)"
  },
  "colors.slate.300": {
    "value": "oklch(86.9% 0.022 252.894)",
    "variable": "var(--colors-slate-300)"
  },
  "colors.slate.400": {
    "value": "oklch(70.4% 0.04 256.788)",
    "variable": "var(--colors-slate-400)"
  },
  "colors.slate.500": {
    "value": "oklch(55.4% 0.046 257.417)",
    "variable": "var(--colors-slate-500)"
  },
  "colors.slate.600": {
    "value": "oklch(44.6% 0.043 257.281)",
    "variable": "var(--colors-slate-600)"
  },
  "colors.slate.700": {
    "value": "oklch(37.2% 0.044 257.287)",
    "variable": "var(--colors-slate-700)"
  },
  "colors.slate.800": {
    "value": "oklch(27.9% 0.041 260.031)",
    "variable": "var(--colors-slate-800)"
  },
  "colors.slate.900": {
    "value": "oklch(20.8% 0.042 265.755)",
    "variable": "var(--colors-slate-900)"
  },
  "colors.slate.950": {
    "value": "oklch(12.9% 0.042 264.695)",
    "variable": "var(--colors-slate-950)"
  },
  "colors.gray.50": {
    "value": "oklch(98.5% 0.002 247.839)",
    "variable": "var(--colors-gray-50)"
  },
  "colors.gray.100": {
    "value": "oklch(96.7% 0.003 264.542)",
    "variable": "var(--colors-gray-100)"
  },
  "colors.gray.200": {
    "value": "oklch(92.8% 0.006 264.531)",
    "variable": "var(--colors-gray-200)"
  },
  "colors.gray.300": {
    "value": "oklch(87.2% 0.01 258.338)",
    "variable": "var(--colors-gray-300)"
  },
  "colors.gray.400": {
    "value": "oklch(70.7% 0.022 261.325)",
    "variable": "var(--colors-gray-400)"
  },
  "colors.gray.500": {
    "value": "oklch(55.1% 0.027 264.364)",
    "variable": "var(--colors-gray-500)"
  },
  "colors.gray.600": {
    "value": "oklch(44.6% 0.03 256.802)",
    "variable": "var(--colors-gray-600)"
  },
  "colors.gray.700": {
    "value": "oklch(37.3% 0.034 259.733)",
    "variable": "var(--colors-gray-700)"
  },
  "colors.gray.800": {
    "value": "oklch(27.8% 0.033 256.848)",
    "variable": "var(--colors-gray-800)"
  },
  "colors.gray.900": {
    "value": "oklch(21% 0.034 264.665)",
    "variable": "var(--colors-gray-900)"
  },
  "colors.gray.950": {
    "value": "oklch(13% 0.028 261.692)",
    "variable": "var(--colors-gray-950)"
  },
  "colors.red.50": {
    "value": "oklch(97.1% 0.013 17.38)",
    "variable": "var(--colors-red-50)"
  },
  "colors.red.100": {
    "value": "oklch(93.6% 0.032 17.717)",
    "variable": "var(--colors-red-100)"
  },
  "colors.red.200": {
    "value": "oklch(88.5% 0.062 18.334)",
    "variable": "var(--colors-red-200)"
  },
  "colors.red.300": {
    "value": "oklch(80.8% 0.114 19.571)",
    "variable": "var(--colors-red-300)"
  },
  "colors.red.400": {
    "value": "oklch(70.4% 0.191 22.216)",
    "variable": "var(--colors-red-400)"
  },
  "colors.red.500": {
    "value": "oklch(63.7% 0.237 25.331)",
    "variable": "var(--colors-red-500)"
  },
  "colors.red.600": {
    "value": "oklch(57.7% 0.245 27.325)",
    "variable": "var(--colors-red-600)"
  },
  "colors.red.700": {
    "value": "oklch(50.5% 0.213 27.518)",
    "variable": "var(--colors-red-700)"
  },
  "colors.red.800": {
    "value": "oklch(44.4% 0.177 26.899)",
    "variable": "var(--colors-red-800)"
  },
  "colors.red.900": {
    "value": "oklch(39.6% 0.141 25.723)",
    "variable": "var(--colors-red-900)"
  },
  "colors.red.950": {
    "value": "oklch(25.8% 0.092 26.042)",
    "variable": "var(--colors-red-950)"
  },
  "colors.orange.50": {
    "value": "oklch(98% 0.016 73.684)",
    "variable": "var(--colors-orange-50)"
  },
  "colors.orange.100": {
    "value": "oklch(95.4% 0.038 75.164)",
    "variable": "var(--colors-orange-100)"
  },
  "colors.orange.200": {
    "value": "oklch(90.1% 0.076 70.697)",
    "variable": "var(--colors-orange-200)"
  },
  "colors.orange.300": {
    "value": "oklch(83.7% 0.128 66.29)",
    "variable": "var(--colors-orange-300)"
  },
  "colors.orange.400": {
    "value": "oklch(75% 0.183 55.934)",
    "variable": "var(--colors-orange-400)"
  },
  "colors.orange.500": {
    "value": "oklch(70.5% 0.213 47.604)",
    "variable": "var(--colors-orange-500)"
  },
  "colors.orange.600": {
    "value": "oklch(64.6% 0.222 41.116)",
    "variable": "var(--colors-orange-600)"
  },
  "colors.orange.700": {
    "value": "oklch(55.3% 0.195 38.402)",
    "variable": "var(--colors-orange-700)"
  },
  "colors.orange.800": {
    "value": "oklch(47% 0.157 37.304)",
    "variable": "var(--colors-orange-800)"
  },
  "colors.orange.900": {
    "value": "oklch(40.8% 0.123 38.172)",
    "variable": "var(--colors-orange-900)"
  },
  "colors.orange.950": {
    "value": "oklch(26.6% 0.079 36.259)",
    "variable": "var(--colors-orange-950)"
  },
  "colors.amber.50": {
    "value": "oklch(98.7% 0.022 95.277)",
    "variable": "var(--colors-amber-50)"
  },
  "colors.amber.100": {
    "value": "oklch(96.2% 0.059 95.617)",
    "variable": "var(--colors-amber-100)"
  },
  "colors.amber.200": {
    "value": "oklch(92.4% 0.12 95.746)",
    "variable": "var(--colors-amber-200)"
  },
  "colors.amber.300": {
    "value": "oklch(87.9% 0.169 91.605)",
    "variable": "var(--colors-amber-300)"
  },
  "colors.amber.400": {
    "value": "oklch(82.8% 0.189 84.429)",
    "variable": "var(--colors-amber-400)"
  },
  "colors.amber.500": {
    "value": "oklch(76.9% 0.188 70.08)",
    "variable": "var(--colors-amber-500)"
  },
  "colors.amber.600": {
    "value": "oklch(66.6% 0.179 58.318)",
    "variable": "var(--colors-amber-600)"
  },
  "colors.amber.700": {
    "value": "oklch(55.5% 0.163 48.998)",
    "variable": "var(--colors-amber-700)"
  },
  "colors.amber.800": {
    "value": "oklch(47.3% 0.137 46.201)",
    "variable": "var(--colors-amber-800)"
  },
  "colors.amber.900": {
    "value": "oklch(41.4% 0.112 45.904)",
    "variable": "var(--colors-amber-900)"
  },
  "colors.amber.950": {
    "value": "oklch(27.9% 0.077 45.635)",
    "variable": "var(--colors-amber-950)"
  },
  "colors.yellow.50": {
    "value": "oklch(98.7% 0.026 102.212)",
    "variable": "var(--colors-yellow-50)"
  },
  "colors.yellow.100": {
    "value": "oklch(97.3% 0.071 103.193)",
    "variable": "var(--colors-yellow-100)"
  },
  "colors.yellow.200": {
    "value": "oklch(94.5% 0.129 101.54)",
    "variable": "var(--colors-yellow-200)"
  },
  "colors.yellow.300": {
    "value": "oklch(90.5% 0.182 98.111)",
    "variable": "var(--colors-yellow-300)"
  },
  "colors.yellow.400": {
    "value": "oklch(85.2% 0.199 91.936)",
    "variable": "var(--colors-yellow-400)"
  },
  "colors.yellow.500": {
    "value": "oklch(79.5% 0.184 86.047)",
    "variable": "var(--colors-yellow-500)"
  },
  "colors.yellow.600": {
    "value": "oklch(68.1% 0.162 75.834)",
    "variable": "var(--colors-yellow-600)"
  },
  "colors.yellow.700": {
    "value": "oklch(55.4% 0.135 66.442)",
    "variable": "var(--colors-yellow-700)"
  },
  "colors.yellow.800": {
    "value": "oklch(47.6% 0.114 61.907)",
    "variable": "var(--colors-yellow-800)"
  },
  "colors.yellow.900": {
    "value": "oklch(42.1% 0.095 57.708)",
    "variable": "var(--colors-yellow-900)"
  },
  "colors.yellow.950": {
    "value": "oklch(28.6% 0.066 53.813)",
    "variable": "var(--colors-yellow-950)"
  },
  "colors.lime.50": {
    "value": "oklch(98.6% 0.031 120.757)",
    "variable": "var(--colors-lime-50)"
  },
  "colors.lime.100": {
    "value": "oklch(96.7% 0.067 122.328)",
    "variable": "var(--colors-lime-100)"
  },
  "colors.lime.200": {
    "value": "oklch(93.8% 0.127 124.321)",
    "variable": "var(--colors-lime-200)"
  },
  "colors.lime.300": {
    "value": "oklch(89.7% 0.196 126.665)",
    "variable": "var(--colors-lime-300)"
  },
  "colors.lime.400": {
    "value": "oklch(84.1% 0.238 128.85)",
    "variable": "var(--colors-lime-400)"
  },
  "colors.lime.500": {
    "value": "oklch(76.8% 0.233 130.85)",
    "variable": "var(--colors-lime-500)"
  },
  "colors.lime.600": {
    "value": "oklch(64.8% 0.2 131.684)",
    "variable": "var(--colors-lime-600)"
  },
  "colors.lime.700": {
    "value": "oklch(53.2% 0.157 131.589)",
    "variable": "var(--colors-lime-700)"
  },
  "colors.lime.800": {
    "value": "oklch(45.3% 0.124 130.933)",
    "variable": "var(--colors-lime-800)"
  },
  "colors.lime.900": {
    "value": "oklch(40.5% 0.101 131.063)",
    "variable": "var(--colors-lime-900)"
  },
  "colors.lime.950": {
    "value": "oklch(27.4% 0.072 132.109)",
    "variable": "var(--colors-lime-950)"
  },
  "colors.green.50": {
    "value": "oklch(98.2% 0.018 155.826)",
    "variable": "var(--colors-green-50)"
  },
  "colors.green.100": {
    "value": "oklch(96.2% 0.044 156.743)",
    "variable": "var(--colors-green-100)"
  },
  "colors.green.200": {
    "value": "oklch(92.5% 0.084 155.995)",
    "variable": "var(--colors-green-200)"
  },
  "colors.green.300": {
    "value": "oklch(87.1% 0.15 154.449)",
    "variable": "var(--colors-green-300)"
  },
  "colors.green.400": {
    "value": "oklch(79.2% 0.209 151.711)",
    "variable": "var(--colors-green-400)"
  },
  "colors.green.500": {
    "value": "oklch(72.3% 0.219 149.579)",
    "variable": "var(--colors-green-500)"
  },
  "colors.green.600": {
    "value": "oklch(62.7% 0.194 149.214)",
    "variable": "var(--colors-green-600)"
  },
  "colors.green.700": {
    "value": "oklch(52.7% 0.154 150.069)",
    "variable": "var(--colors-green-700)"
  },
  "colors.green.800": {
    "value": "oklch(44.8% 0.119 151.328)",
    "variable": "var(--colors-green-800)"
  },
  "colors.green.900": {
    "value": "oklch(39.3% 0.095 152.535)",
    "variable": "var(--colors-green-900)"
  },
  "colors.green.950": {
    "value": "oklch(26.6% 0.065 152.934)",
    "variable": "var(--colors-green-950)"
  },
  "colors.emerald.50": {
    "value": "oklch(97.9% 0.021 166.113)",
    "variable": "var(--colors-emerald-50)"
  },
  "colors.emerald.100": {
    "value": "oklch(95% 0.052 163.051)",
    "variable": "var(--colors-emerald-100)"
  },
  "colors.emerald.200": {
    "value": "oklch(90.5% 0.093 164.15)",
    "variable": "var(--colors-emerald-200)"
  },
  "colors.emerald.300": {
    "value": "oklch(84.5% 0.143 164.978)",
    "variable": "var(--colors-emerald-300)"
  },
  "colors.emerald.400": {
    "value": "oklch(76.5% 0.177 163.223)",
    "variable": "var(--colors-emerald-400)"
  },
  "colors.emerald.500": {
    "value": "oklch(69.6% 0.17 162.48)",
    "variable": "var(--colors-emerald-500)"
  },
  "colors.emerald.600": {
    "value": "oklch(59.6% 0.145 163.225)",
    "variable": "var(--colors-emerald-600)"
  },
  "colors.emerald.700": {
    "value": "oklch(50.8% 0.118 165.612)",
    "variable": "var(--colors-emerald-700)"
  },
  "colors.emerald.800": {
    "value": "oklch(43.2% 0.095 166.913)",
    "variable": "var(--colors-emerald-800)"
  },
  "colors.emerald.900": {
    "value": "oklch(37.8% 0.077 168.94)",
    "variable": "var(--colors-emerald-900)"
  },
  "colors.emerald.950": {
    "value": "oklch(26.2% 0.051 172.552)",
    "variable": "var(--colors-emerald-950)"
  },
  "colors.teal.50": {
    "value": "oklch(98.4% 0.014 180.72)",
    "variable": "var(--colors-teal-50)"
  },
  "colors.teal.100": {
    "value": "oklch(95.3% 0.051 180.801)",
    "variable": "var(--colors-teal-100)"
  },
  "colors.teal.200": {
    "value": "oklch(91% 0.096 180.426)",
    "variable": "var(--colors-teal-200)"
  },
  "colors.teal.300": {
    "value": "oklch(85.5% 0.138 181.071)",
    "variable": "var(--colors-teal-300)"
  },
  "colors.teal.400": {
    "value": "oklch(77.7% 0.152 181.912)",
    "variable": "var(--colors-teal-400)"
  },
  "colors.teal.500": {
    "value": "oklch(70.4% 0.14 182.503)",
    "variable": "var(--colors-teal-500)"
  },
  "colors.teal.600": {
    "value": "oklch(60% 0.118 184.704)",
    "variable": "var(--colors-teal-600)"
  },
  "colors.teal.700": {
    "value": "oklch(51.1% 0.096 186.391)",
    "variable": "var(--colors-teal-700)"
  },
  "colors.teal.800": {
    "value": "oklch(43.7% 0.078 188.216)",
    "variable": "var(--colors-teal-800)"
  },
  "colors.teal.900": {
    "value": "oklch(38.6% 0.063 188.416)",
    "variable": "var(--colors-teal-900)"
  },
  "colors.teal.950": {
    "value": "oklch(27.7% 0.046 192.524)",
    "variable": "var(--colors-teal-950)"
  },
  "colors.cyan.50": {
    "value": "oklch(98.4% 0.019 200.873)",
    "variable": "var(--colors-cyan-50)"
  },
  "colors.cyan.100": {
    "value": "oklch(95.6% 0.045 203.388)",
    "variable": "var(--colors-cyan-100)"
  },
  "colors.cyan.200": {
    "value": "oklch(91.7% 0.08 205.041)",
    "variable": "var(--colors-cyan-200)"
  },
  "colors.cyan.300": {
    "value": "oklch(86.5% 0.127 207.078)",
    "variable": "var(--colors-cyan-300)"
  },
  "colors.cyan.400": {
    "value": "oklch(78.9% 0.154 211.53)",
    "variable": "var(--colors-cyan-400)"
  },
  "colors.cyan.500": {
    "value": "oklch(71.5% 0.143 215.221)",
    "variable": "var(--colors-cyan-500)"
  },
  "colors.cyan.600": {
    "value": "oklch(60.9% 0.126 221.723)",
    "variable": "var(--colors-cyan-600)"
  },
  "colors.cyan.700": {
    "value": "oklch(52% 0.105 223.128)",
    "variable": "var(--colors-cyan-700)"
  },
  "colors.cyan.800": {
    "value": "oklch(45% 0.085 224.283)",
    "variable": "var(--colors-cyan-800)"
  },
  "colors.cyan.900": {
    "value": "oklch(39.8% 0.07 227.392)",
    "variable": "var(--colors-cyan-900)"
  },
  "colors.cyan.950": {
    "value": "oklch(30.2% 0.056 229.695)",
    "variable": "var(--colors-cyan-950)"
  },
  "colors.sky.50": {
    "value": "oklch(97.7% 0.013 236.62)",
    "variable": "var(--colors-sky-50)"
  },
  "colors.sky.100": {
    "value": "oklch(95.1% 0.026 236.824)",
    "variable": "var(--colors-sky-100)"
  },
  "colors.sky.200": {
    "value": "oklch(90.1% 0.058 230.902)",
    "variable": "var(--colors-sky-200)"
  },
  "colors.sky.300": {
    "value": "oklch(82.8% 0.111 230.318)",
    "variable": "var(--colors-sky-300)"
  },
  "colors.sky.400": {
    "value": "oklch(74.6% 0.16 232.661)",
    "variable": "var(--colors-sky-400)"
  },
  "colors.sky.500": {
    "value": "oklch(68.5% 0.169 237.323)",
    "variable": "var(--colors-sky-500)"
  },
  "colors.sky.600": {
    "value": "oklch(58.8% 0.158 241.966)",
    "variable": "var(--colors-sky-600)"
  },
  "colors.sky.700": {
    "value": "oklch(50% 0.134 242.749)",
    "variable": "var(--colors-sky-700)"
  },
  "colors.sky.800": {
    "value": "oklch(44.3% 0.11 240.79)",
    "variable": "var(--colors-sky-800)"
  },
  "colors.sky.900": {
    "value": "oklch(39.1% 0.09 240.876)",
    "variable": "var(--colors-sky-900)"
  },
  "colors.sky.950": {
    "value": "oklch(29.3% 0.066 243.157)",
    "variable": "var(--colors-sky-950)"
  },
  "colors.blue.50": {
    "value": "oklch(97% 0.014 254.604)",
    "variable": "var(--colors-blue-50)"
  },
  "colors.blue.100": {
    "value": "oklch(93.2% 0.032 255.585)",
    "variable": "var(--colors-blue-100)"
  },
  "colors.blue.200": {
    "value": "oklch(88.2% 0.059 254.128)",
    "variable": "var(--colors-blue-200)"
  },
  "colors.blue.300": {
    "value": "oklch(80.9% 0.105 251.813)",
    "variable": "var(--colors-blue-300)"
  },
  "colors.blue.400": {
    "value": "oklch(70.7% 0.165 254.624)",
    "variable": "var(--colors-blue-400)"
  },
  "colors.blue.500": {
    "value": "oklch(62.3% 0.214 259.815)",
    "variable": "var(--colors-blue-500)"
  },
  "colors.blue.600": {
    "value": "oklch(54.6% 0.245 262.881)",
    "variable": "var(--colors-blue-600)"
  },
  "colors.blue.700": {
    "value": "oklch(48.8% 0.243 264.376)",
    "variable": "var(--colors-blue-700)"
  },
  "colors.blue.800": {
    "value": "oklch(42.4% 0.199 265.638)",
    "variable": "var(--colors-blue-800)"
  },
  "colors.blue.900": {
    "value": "oklch(37.9% 0.146 265.522)",
    "variable": "var(--colors-blue-900)"
  },
  "colors.blue.950": {
    "value": "oklch(28.2% 0.091 267.935)",
    "variable": "var(--colors-blue-950)"
  },
  "colors.indigo.50": {
    "value": "oklch(96.2% 0.018 272.314)",
    "variable": "var(--colors-indigo-50)"
  },
  "colors.indigo.100": {
    "value": "oklch(93% 0.034 272.788)",
    "variable": "var(--colors-indigo-100)"
  },
  "colors.indigo.200": {
    "value": "oklch(87% 0.065 274.039)",
    "variable": "var(--colors-indigo-200)"
  },
  "colors.indigo.300": {
    "value": "oklch(78.5% 0.115 274.713)",
    "variable": "var(--colors-indigo-300)"
  },
  "colors.indigo.400": {
    "value": "oklch(67.3% 0.182 276.935)",
    "variable": "var(--colors-indigo-400)"
  },
  "colors.indigo.500": {
    "value": "oklch(58.5% 0.233 277.117)",
    "variable": "var(--colors-indigo-500)"
  },
  "colors.indigo.600": {
    "value": "oklch(51.1% 0.262 276.966)",
    "variable": "var(--colors-indigo-600)"
  },
  "colors.indigo.700": {
    "value": "oklch(45.7% 0.24 277.023)",
    "variable": "var(--colors-indigo-700)"
  },
  "colors.indigo.800": {
    "value": "oklch(39.8% 0.195 277.366)",
    "variable": "var(--colors-indigo-800)"
  },
  "colors.indigo.900": {
    "value": "oklch(35.9% 0.144 278.697)",
    "variable": "var(--colors-indigo-900)"
  },
  "colors.indigo.950": {
    "value": "oklch(25.7% 0.09 281.288)",
    "variable": "var(--colors-indigo-950)"
  },
  "colors.violet.50": {
    "value": "oklch(96.9% 0.016 293.756)",
    "variable": "var(--colors-violet-50)"
  },
  "colors.violet.100": {
    "value": "oklch(94.3% 0.029 294.588)",
    "variable": "var(--colors-violet-100)"
  },
  "colors.violet.200": {
    "value": "oklch(89.4% 0.057 293.283)",
    "variable": "var(--colors-violet-200)"
  },
  "colors.violet.300": {
    "value": "oklch(81.1% 0.111 293.571)",
    "variable": "var(--colors-violet-300)"
  },
  "colors.violet.400": {
    "value": "oklch(70.2% 0.183 293.541)",
    "variable": "var(--colors-violet-400)"
  },
  "colors.violet.500": {
    "value": "oklch(60.6% 0.25 292.717)",
    "variable": "var(--colors-violet-500)"
  },
  "colors.violet.600": {
    "value": "oklch(54.1% 0.281 293.009)",
    "variable": "var(--colors-violet-600)"
  },
  "colors.violet.700": {
    "value": "oklch(49.1% 0.27 292.581)",
    "variable": "var(--colors-violet-700)"
  },
  "colors.violet.800": {
    "value": "oklch(43.2% 0.232 292.759)",
    "variable": "var(--colors-violet-800)"
  },
  "colors.violet.900": {
    "value": "oklch(38% 0.189 293.745)",
    "variable": "var(--colors-violet-900)"
  },
  "colors.violet.950": {
    "value": "oklch(28.3% 0.141 291.089)",
    "variable": "var(--colors-violet-950)"
  },
  "colors.purple.50": {
    "value": "oklch(97.7% 0.014 308.299)",
    "variable": "var(--colors-purple-50)"
  },
  "colors.purple.100": {
    "value": "oklch(94.6% 0.033 307.174)",
    "variable": "var(--colors-purple-100)"
  },
  "colors.purple.200": {
    "value": "oklch(90.2% 0.063 306.703)",
    "variable": "var(--colors-purple-200)"
  },
  "colors.purple.300": {
    "value": "oklch(82.7% 0.119 306.383)",
    "variable": "var(--colors-purple-300)"
  },
  "colors.purple.400": {
    "value": "oklch(71.4% 0.203 305.504)",
    "variable": "var(--colors-purple-400)"
  },
  "colors.purple.500": {
    "value": "oklch(62.7% 0.265 303.9)",
    "variable": "var(--colors-purple-500)"
  },
  "colors.purple.600": {
    "value": "oklch(55.8% 0.288 302.321)",
    "variable": "var(--colors-purple-600)"
  },
  "colors.purple.700": {
    "value": "oklch(49.6% 0.265 301.924)",
    "variable": "var(--colors-purple-700)"
  },
  "colors.purple.800": {
    "value": "oklch(43.8% 0.218 303.724)",
    "variable": "var(--colors-purple-800)"
  },
  "colors.purple.900": {
    "value": "oklch(38.1% 0.176 304.987)",
    "variable": "var(--colors-purple-900)"
  },
  "colors.purple.950": {
    "value": "oklch(29.1% 0.149 302.717)",
    "variable": "var(--colors-purple-950)"
  },
  "colors.magenta.50": {
    "value": "oklch(97.7% 0.017 320.058)",
    "variable": "var(--colors-magenta-50)"
  },
  "colors.magenta.100": {
    "value": "oklch(95.2% 0.037 318.852)",
    "variable": "var(--colors-magenta-100)"
  },
  "colors.magenta.200": {
    "value": "oklch(90.3% 0.076 319.62)",
    "variable": "var(--colors-magenta-200)"
  },
  "colors.magenta.300": {
    "value": "oklch(83.3% 0.145 321.434)",
    "variable": "var(--colors-magenta-300)"
  },
  "colors.magenta.400": {
    "value": "oklch(74% 0.238 322.16)",
    "variable": "var(--colors-magenta-400)"
  },
  "colors.magenta.500": {
    "value": "oklch(66.7% 0.295 322.15)",
    "variable": "var(--colors-magenta-500)"
  },
  "colors.magenta.600": {
    "value": "oklch(59.1% 0.293 322.896)",
    "variable": "var(--colors-magenta-600)"
  },
  "colors.magenta.700": {
    "value": "oklch(51.8% 0.253 323.949)",
    "variable": "var(--colors-magenta-700)"
  },
  "colors.magenta.800": {
    "value": "oklch(45.2% 0.211 324.591)",
    "variable": "var(--colors-magenta-800)"
  },
  "colors.magenta.900": {
    "value": "oklch(40.1% 0.17 325.612)",
    "variable": "var(--colors-magenta-900)"
  },
  "colors.magenta.950": {
    "value": "oklch(29.3% 0.136 325.661)",
    "variable": "var(--colors-magenta-950)"
  },
  "colors.pink.50": {
    "value": "oklch(97.1% 0.014 343.198)",
    "variable": "var(--colors-pink-50)"
  },
  "colors.pink.100": {
    "value": "oklch(94.8% 0.028 342.258)",
    "variable": "var(--colors-pink-100)"
  },
  "colors.pink.200": {
    "value": "oklch(89.9% 0.061 343.231)",
    "variable": "var(--colors-pink-200)"
  },
  "colors.pink.300": {
    "value": "oklch(82.3% 0.12 346.018)",
    "variable": "var(--colors-pink-300)"
  },
  "colors.pink.400": {
    "value": "oklch(71.8% 0.202 349.761)",
    "variable": "var(--colors-pink-400)"
  },
  "colors.pink.500": {
    "value": "oklch(65.6% 0.241 354.308)",
    "variable": "var(--colors-pink-500)"
  },
  "colors.pink.600": {
    "value": "oklch(59.2% 0.249 0.584)",
    "variable": "var(--colors-pink-600)"
  },
  "colors.pink.700": {
    "value": "oklch(52.5% 0.223 3.958)",
    "variable": "var(--colors-pink-700)"
  },
  "colors.pink.800": {
    "value": "oklch(45.9% 0.187 3.815)",
    "variable": "var(--colors-pink-800)"
  },
  "colors.pink.900": {
    "value": "oklch(40.8% 0.153 2.432)",
    "variable": "var(--colors-pink-900)"
  },
  "colors.pink.950": {
    "value": "oklch(28.4% 0.109 3.907)",
    "variable": "var(--colors-pink-950)"
  },
  "colors.rose.50": {
    "value": "oklch(96.9% 0.015 12.422)",
    "variable": "var(--colors-rose-50)"
  },
  "colors.rose.100": {
    "value": "oklch(94.1% 0.03 12.58)",
    "variable": "var(--colors-rose-100)"
  },
  "colors.rose.200": {
    "value": "oklch(89.2% 0.058 10.001)",
    "variable": "var(--colors-rose-200)"
  },
  "colors.rose.300": {
    "value": "oklch(81% 0.117 11.638)",
    "variable": "var(--colors-rose-300)"
  },
  "colors.rose.400": {
    "value": "oklch(71.2% 0.194 13.428)",
    "variable": "var(--colors-rose-400)"
  },
  "colors.rose.500": {
    "value": "oklch(64.5% 0.246 16.439)",
    "variable": "var(--colors-rose-500)"
  },
  "colors.rose.600": {
    "value": "oklch(58.6% 0.253 17.585)",
    "variable": "var(--colors-rose-600)"
  },
  "colors.rose.700": {
    "value": "oklch(51.4% 0.222 16.935)",
    "variable": "var(--colors-rose-700)"
  },
  "colors.rose.800": {
    "value": "oklch(45.5% 0.188 13.697)",
    "variable": "var(--colors-rose-800)"
  },
  "colors.rose.900": {
    "value": "oklch(41% 0.159 10.272)",
    "variable": "var(--colors-rose-900)"
  },
  "colors.rose.950": {
    "value": "oklch(27.1% 0.105 12.094)",
    "variable": "var(--colors-rose-950)"
  },
  "colors.text.primary": {
    "value": "var(--colors-text-primary)",
    "variable": "var(--colors-text-primary)"
  },
  "colors.text.secondary": {
    "value": "var(--colors-text-secondary)",
    "variable": "var(--colors-text-secondary)"
  },
  "colors.text.disabled": {
    "value": "var(--colors-text-disabled)",
    "variable": "var(--colors-text-disabled)"
  },
  "colors.text.accent": {
    "value": "var(--colors-text-accent)",
    "variable": "var(--colors-text-accent)"
  },
  "colors.text.highlight": {
    "value": "var(--colors-text-highlight)",
    "variable": "var(--colors-text-highlight)"
  },
  "colors.design.background": {
    "value": "var(--colors-design-background)",
    "variable": "var(--colors-design-background)"
  },
  "colors.design.foreground": {
    "value": "var(--colors-design-foreground)",
    "variable": "var(--colors-design-foreground)"
  },
  "colors.design.primary.background": {
    "value": "var(--colors-design-primary-background)",
    "variable": "var(--colors-design-primary-background)"
  },
  "colors.design.primary.foreground": {
    "value": "var(--colors-design-primary-foreground)",
    "variable": "var(--colors-design-primary-foreground)"
  },
  "colors.design.primary.hover.background": {
    "value": "var(--colors-design-primary-hover-background)",
    "variable": "var(--colors-design-primary-hover-background)"
  },
  "colors.design.accent.foreground": {
    "value": "var(--colors-design-accent-foreground)",
    "variable": "var(--colors-design-accent-foreground)"
  },
  "colors.design.accent.background": {
    "value": "var(--colors-design-accent-background)",
    "variable": "var(--colors-design-accent-background)"
  },
  "colors.design.accent.hover": {
    "value": "var(--colors-design-accent-hover)",
    "variable": "var(--colors-design-accent-hover)"
  },
  "colors.design.accent.border": {
    "value": "var(--colors-design-accent-border)",
    "variable": "var(--colors-design-accent-border)"
  },
  "colors.design.text.base": {
    "value": "var(--colors-design-text-base)",
    "variable": "var(--colors-design-text-base)"
  },
  "colors.design.text.light": {
    "value": "var(--colors-design-text-light)",
    "variable": "var(--colors-design-text-light)"
  },
  "colors.design.text.lighter": {
    "value": "var(--colors-design-text-lighter)",
    "variable": "var(--colors-design-text-lighter)"
  },
  "colors.design.mark.background": {
    "value": "var(--colors-design-mark-background)",
    "variable": "var(--colors-design-mark-background)"
  },
  "colors.design.mark.foreground": {
    "value": "var(--colors-design-mark-foreground)",
    "variable": "var(--colors-design-mark-foreground)"
  },
  "colors.reference.text": {
    "value": "var(--colors-reference-text)",
    "variable": "var(--colors-reference-text)"
  },
  "colors.reference.textLight": {
    "value": "var(--colors-reference-text-light)",
    "variable": "var(--colors-reference-text-light)"
  },
  "colors.reference.textLighter": {
    "value": "var(--colors-reference-text-lighter)",
    "variable": "var(--colors-reference-text-lighter)"
  },
  "colors.reference.codeBackground": {
    "value": "var(--colors-reference-code-background)",
    "variable": "var(--colors-reference-code-background)"
  },
  "colors.reference.highlight": {
    "value": "var(--colors-reference-highlight)",
    "variable": "var(--colors-reference-highlight)"
  },
  "colors.reference.border": {
    "value": "var(--colors-reference-border)",
    "variable": "var(--colors-reference-border)"
  },
  "colors.ui.selection.background": {
    "value": "var(--colors-ui-selection-background)",
    "variable": "var(--colors-ui-selection-background)"
  },
  "colors.ui.selection.foreground": {
    "value": "var(--colors-ui-selection-foreground)",
    "variable": "var(--colors-ui-selection-foreground)"
  },
  "colors.ui.dialog.background": {
    "value": "var(--colors-ui-dialog-background)",
    "variable": "var(--colors-ui-dialog-background)"
  },
  "colors.ui.dialog.foreground": {
    "value": "var(--colors-ui-dialog-foreground)",
    "variable": "var(--colors-ui-dialog-foreground)"
  },
  "colors.ui.dialog.border": {
    "value": "var(--colors-ui-dialog-border)",
    "variable": "var(--colors-ui-dialog-border)"
  },
  "colors.ui.hr.border": {
    "value": "var(--colors-ui-hr-border)",
    "variable": "var(--colors-ui-hr-border)"
  },
  "colors.ui.meta.foreground": {
    "value": "var(--colors-ui-meta-foreground)",
    "variable": "var(--colors-ui-meta-foreground)"
  },
  "colors.ui.blockquote.foreground": {
    "value": "var(--colors-ui-blockquote-foreground)",
    "variable": "var(--colors-ui-blockquote-foreground)"
  },
  "colors.ui.blockquote.border": {
    "value": "var(--colors-ui-blockquote-border)",
    "variable": "var(--colors-ui-blockquote-border)"
  },
  "colors.ui.cite.foreground": {
    "value": "var(--colors-ui-cite-foreground)",
    "variable": "var(--colors-ui-cite-foreground)"
  },
  "colors.ui.small.foreground": {
    "value": "var(--colors-ui-small-foreground)",
    "variable": "var(--colors-ui-small-foreground)"
  },
  "colors.ui.code.inline.foreground": {
    "value": "var(--colors-ui-code-inline-foreground)",
    "variable": "var(--colors-ui-code-inline-foreground)"
  },
  "colors.ui.code.inline.background": {
    "value": "var(--colors-ui-code-inline-background)",
    "variable": "var(--colors-ui-code-inline-background)"
  },
  "colors.ui.code.inline.border": {
    "value": "var(--colors-ui-code-inline-border)",
    "variable": "var(--colors-ui-code-inline-border)"
  },
  "colors.ui.kbd.background": {
    "value": "var(--colors-ui-kbd-background)",
    "variable": "var(--colors-ui-kbd-background)"
  },
  "colors.ui.kbd.foreground": {
    "value": "var(--colors-ui-kbd-foreground)",
    "variable": "var(--colors-ui-kbd-foreground)"
  },
  "colors.ui.kbd.border": {
    "value": "var(--colors-ui-kbd-border)",
    "variable": "var(--colors-ui-kbd-border)"
  },
  "colors.ui.kbd.shadowMix": {
    "value": "var(--colors-ui-kbd-shadow-mix)",
    "variable": "var(--colors-ui-kbd-shadow-mix)"
  },
  "colors.ui.pre.foreground": {
    "value": "var(--colors-ui-pre-foreground)",
    "variable": "var(--colors-ui-pre-foreground)"
  },
  "colors.ui.pre.background": {
    "value": "var(--colors-ui-pre-background)",
    "variable": "var(--colors-ui-pre-background)"
  },
  "colors.ui.pre.border": {
    "value": "var(--colors-ui-pre-border)",
    "variable": "var(--colors-ui-pre-border)"
  },
  "colors.ui.samp.background": {
    "value": "var(--colors-ui-samp-background)",
    "variable": "var(--colors-ui-samp-background)"
  },
  "colors.ui.samp.foreground": {
    "value": "var(--colors-ui-samp-foreground)",
    "variable": "var(--colors-ui-samp-foreground)"
  },
  "colors.ui.link.default": {
    "value": "var(--colors-ui-link-default)",
    "variable": "var(--colors-ui-link-default)"
  },
  "colors.ui.link.hover": {
    "value": "var(--colors-ui-link-hover)",
    "variable": "var(--colors-ui-link-hover)"
  },
  "colors.ui.mark.background": {
    "value": "var(--colors-ui-mark-background)",
    "variable": "var(--colors-ui-mark-background)"
  },
  "colors.ui.mark.foreground": {
    "value": "var(--colors-ui-mark-foreground)",
    "variable": "var(--colors-ui-mark-foreground)"
  },
  "colors.ui.ins.foreground": {
    "value": "var(--colors-ui-ins-foreground)",
    "variable": "var(--colors-ui-ins-foreground)"
  },
  "colors.ui.ins.decoration": {
    "value": "var(--colors-ui-ins-decoration)",
    "variable": "var(--colors-ui-ins-decoration)"
  },
  "colors.ui.abbr.textDecoration": {
    "value": "var(--colors-ui-abbr-text-decoration)",
    "variable": "var(--colors-ui-abbr-text-decoration)"
  },
  "colors.ui.del.foreground": {
    "value": "var(--colors-ui-del-foreground)",
    "variable": "var(--colors-ui-del-foreground)"
  },
  "colors.ui.dfn.foreground": {
    "value": "var(--colors-ui-dfn-foreground)",
    "variable": "var(--colors-ui-dfn-foreground)"
  },
  "colors.ui.q.foreground": {
    "value": "var(--colors-ui-q-foreground)",
    "variable": "var(--colors-ui-q-foreground)"
  },
  "colors.ui.s.foreground": {
    "value": "var(--colors-ui-s-foreground)",
    "variable": "var(--colors-ui-s-foreground)"
  },
  "colors.ui.u.textDecoration": {
    "value": "var(--colors-ui-u-text-decoration)",
    "variable": "var(--colors-ui-u-text-decoration)"
  },
  "colors.ui.varTag.foreground": {
    "value": "var(--colors-ui-var-tag-foreground)",
    "variable": "var(--colors-ui-var-tag-foreground)"
  },
  "colors.ui.list.marker.foreground": {
    "value": "var(--colors-ui-list-marker-foreground)",
    "variable": "var(--colors-ui-list-marker-foreground)"
  },
  "colors.ui.list.definition.description.foreground": {
    "value": "var(--colors-ui-list-definition-description-foreground)",
    "variable": "var(--colors-ui-list-definition-description-foreground)"
  },
  "colors.ui.fieldset.border": {
    "value": "var(--colors-ui-fieldset-border)",
    "variable": "var(--colors-ui-fieldset-border)"
  },
  "colors.ui.label.controlAccent": {
    "value": "var(--colors-ui-label-control-accent)",
    "variable": "var(--colors-ui-label-control-accent)"
  },
  "colors.ui.field.border": {
    "value": "var(--colors-ui-field-border)",
    "variable": "var(--colors-ui-field-border)"
  },
  "colors.ui.field.borderHover": {
    "value": "var(--colors-ui-field-border-hover)",
    "variable": "var(--colors-ui-field-border-hover)"
  },
  "colors.ui.field.background": {
    "value": "var(--colors-ui-field-background)",
    "variable": "var(--colors-ui-field-background)"
  },
  "colors.ui.field.foreground": {
    "value": "var(--colors-ui-field-foreground)",
    "variable": "var(--colors-ui-field-foreground)"
  },
  "colors.ui.field.focusRing": {
    "value": "var(--colors-ui-field-focus-ring)",
    "variable": "var(--colors-ui-field-focus-ring)"
  },
  "colors.ui.field.placeholder": {
    "value": "var(--colors-ui-field-placeholder)",
    "variable": "var(--colors-ui-field-placeholder)"
  },
  "colors.ui.field.controlAccent": {
    "value": "var(--colors-ui-field-control-accent)",
    "variable": "var(--colors-ui-field-control-accent)"
  },
  "colors.ui.checkbox.unchecked.borderMix": {
    "value": "var(--colors-ui-checkbox-unchecked-border-mix)",
    "variable": "var(--colors-ui-checkbox-unchecked-border-mix)"
  },
  "colors.ui.checkbox.checked.fill": {
    "value": "var(--colors-ui-checkbox-checked-fill)",
    "variable": "var(--colors-ui-checkbox-checked-fill)"
  },
  "colors.ui.checkbox.tick.stroke": {
    "value": "var(--colors-ui-checkbox-tick-stroke)",
    "variable": "var(--colors-ui-checkbox-tick-stroke)"
  },
  "colors.ui.radio.track.background": {
    "value": "var(--colors-ui-radio-track-background)",
    "variable": "var(--colors-ui-radio-track-background)"
  },
  "colors.ui.radio.checked.inner.background": {
    "value": "var(--colors-ui-radio-checked-inner-background)",
    "variable": "var(--colors-ui-radio-checked-inner-background)"
  },
  "colors.ui.radio.checked.ring.border": {
    "value": "var(--colors-ui-radio-checked-ring-border)",
    "variable": "var(--colors-ui-radio-checked-ring-border)"
  },
  "colors.ui.button.background": {
    "value": "var(--colors-ui-button-background)",
    "variable": "var(--colors-ui-button-background)"
  },
  "colors.ui.button.foreground": {
    "value": "var(--colors-ui-button-foreground)",
    "variable": "var(--colors-ui-button-foreground)"
  },
  "colors.ui.button.disabled.background": {
    "value": "var(--colors-ui-button-disabled-background)",
    "variable": "var(--colors-ui-button-disabled-background)"
  },
  "colors.ui.button.disabled.foreground": {
    "value": "var(--colors-ui-button-disabled-foreground)",
    "variable": "var(--colors-ui-button-disabled-foreground)"
  },
  "colors.ui.progress.bar.foreground": {
    "value": "var(--colors-ui-progress-bar-foreground)",
    "variable": "var(--colors-ui-progress-bar-foreground)"
  },
  "colors.ui.progress.track.mixForeground": {
    "value": "var(--colors-ui-progress-track-mix-foreground)",
    "variable": "var(--colors-ui-progress-track-mix-foreground)"
  },
  "colors.ui.progress.track.mixBackground": {
    "value": "var(--colors-ui-progress-track-mix-background)",
    "variable": "var(--colors-ui-progress-track-mix-background)"
  },
  "colors.ui.meter.optimum.foreground": {
    "value": "var(--colors-ui-meter-optimum-foreground)",
    "variable": "var(--colors-ui-meter-optimum-foreground)"
  },
  "colors.ui.meter.suboptimum.foreground": {
    "value": "var(--colors-ui-meter-suboptimum-foreground)",
    "variable": "var(--colors-ui-meter-suboptimum-foreground)"
  },
  "colors.ui.meter.evenLessGood.foreground": {
    "value": "var(--colors-ui-meter-even-less-good-foreground)",
    "variable": "var(--colors-ui-meter-even-less-good-foreground)"
  },
  "colors.ui.focus.ring": {
    "value": "var(--colors-ui-focus-ring)",
    "variable": "var(--colors-ui-focus-ring)"
  },
  "colors.ui.table.border": {
    "value": "var(--colors-ui-table-border)",
    "variable": "var(--colors-ui-table-border)"
  },
  "colors.ui.table.row.mutedBackground": {
    "value": "var(--colors-ui-table-row-muted-background)",
    "variable": "var(--colors-ui-table-row-muted-background)"
  },
  "colors.ui.table.footer.mutedBackground": {
    "value": "var(--colors-ui-table-footer-muted-background)",
    "variable": "var(--colors-ui-table-footer-muted-background)"
  },
  "colors.ui.table.cell.foreground": {
    "value": "var(--colors-ui-table-cell-foreground)",
    "variable": "var(--colors-ui-table-cell-foreground)"
  },
  "colors.ui.table.caption.foreground": {
    "value": "var(--colors-ui-table-caption-foreground)",
    "variable": "var(--colors-ui-table-caption-foreground)"
  },
  "colors.ui.media.caption.foreground": {
    "value": "var(--colors-ui-media-caption-foreground)",
    "variable": "var(--colors-ui-media-caption-foreground)"
  },
  "colors.ui.media.embed.border": {
    "value": "var(--colors-ui-media-embed-border)",
    "variable": "var(--colors-ui-media-embed-border)"
  },
  "colors.ui.disclosure.border": {
    "value": "var(--colors-ui-disclosure-border)",
    "variable": "var(--colors-ui-disclosure-border)"
  },
  "colors.ui.tab.track.background": {
    "value": "var(--colors-ui-tab-track-background)",
    "variable": "var(--colors-ui-tab-track-background)"
  },
  "radii.sm": {
    "value": "0.27rem",
    "variable": "var(--radii-sm)"
  },
  "radii.md": {
    "value": "0.4rem",
    "variable": "var(--radii-md)"
  },
  "radii.lg": {
    "value": "0.6rem",
    "variable": "var(--radii-lg)"
  },
  "radii.full": {
    "value": "9999px",
    "variable": "var(--radii-full)"
  },
  "fonts.reference.mono": {
    "value": "var(--fonts-mono)",
    "variable": "var(--fonts-reference-mono)"
  },
  "fonts.reference.sans": {
    "value": "var(--fonts-sans)",
    "variable": "var(--fonts-reference-sans)"
  },
  "fonts.sans": {
    "value": "\"Inter\", ui-sans-serif, sans-serif",
    "variable": "var(--fonts-sans)"
  },
  "fonts.serif": {
    "value": "\"Literata\", ui-serif, serif",
    "variable": "var(--fonts-serif)"
  },
  "fonts.mono": {
    "value": "\"JetBrains Mono\", ui-monospace, monospace",
    "variable": "var(--fonts-mono)"
  },
  "animations.spin.slow": {
    "value": "spin 4s linear infinite",
    "variable": "var(--animations-spin-slow)"
  },
  "animations.spin.normal": {
    "value": "spin 2s linear infinite",
    "variable": "var(--animations-spin-normal)"
  },
  "animations.spin.fast": {
    "value": "spin 1s linear infinite",
    "variable": "var(--animations-spin-fast)"
  },
  "animations.fadeIn.quick": {
    "value": "fadeIn 0.2s ease-out",
    "variable": "var(--animations-fade-in-quick)"
  },
  "animations.fadeIn.normal": {
    "value": "fadeIn 0.5s ease-out",
    "variable": "var(--animations-fade-in-normal)"
  },
  "animations.fadeIn.slow": {
    "value": "fadeIn 1s ease-out",
    "variable": "var(--animations-fade-in-slow)"
  },
  "animations.fadeOut.quick": {
    "value": "fadeOut 0.2s ease-out",
    "variable": "var(--animations-fade-out-quick)"
  },
  "animations.fadeOut.normal": {
    "value": "fadeOut 0.5s ease-out",
    "variable": "var(--animations-fade-out-normal)"
  },
  "animations.slideUp.quick": {
    "value": "slideUp 0.3s ease-out",
    "variable": "var(--animations-slide-up-quick)"
  },
  "animations.slideUp.normal": {
    "value": "slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
    "variable": "var(--animations-slide-up-normal)"
  },
  "animations.slideDown.quick": {
    "value": "slideDown 0.3s ease-out",
    "variable": "var(--animations-slide-down-quick)"
  },
  "animations.slideDown.normal": {
    "value": "slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
    "variable": "var(--animations-slide-down-normal)"
  },
  "animations.scaleIn.quick": {
    "value": "scaleIn 0.2s ease-out",
    "variable": "var(--animations-scale-in-quick)"
  },
  "animations.scaleIn.normal": {
    "value": "scaleIn 0.3s ease-out",
    "variable": "var(--animations-scale-in-normal)"
  },
  "animations.pulse.slow": {
    "value": "pulse 2s ease-in-out infinite",
    "variable": "var(--animations-pulse-slow)"
  },
  "animations.pulse.normal": {
    "value": "pulse 1s ease-in-out infinite",
    "variable": "var(--animations-pulse-normal)"
  },
  "animations.pulse.fast": {
    "value": "pulse 0.5s ease-in-out infinite",
    "variable": "var(--animations-pulse-fast)"
  },
  "animations.bounce.normal": {
    "value": "bounce 1s ease-in-out infinite",
    "variable": "var(--animations-bounce-normal)"
  },
  "animations.bounce.fast": {
    "value": "bounce 0.5s ease-in-out infinite",
    "variable": "var(--animations-bounce-fast)"
  },
  "animations.ping.normal": {
    "value": "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
    "variable": "var(--animations-ping-normal)"
  },
  "animations.ping.fast": {
    "value": "ping 0.5s cubic-bezier(0, 0, 0.2, 1) infinite",
    "variable": "var(--animations-ping-fast)"
  },
  "fontWeights.sans.thin": {
    "value": "200",
    "variable": "var(--font-weights-sans-thin)"
  },
  "fontWeights.sans.light": {
    "value": "300",
    "variable": "var(--font-weights-sans-light)"
  },
  "fontWeights.sans.normal": {
    "value": "400",
    "variable": "var(--font-weights-sans-normal)"
  },
  "fontWeights.sans.semibold": {
    "value": "600",
    "variable": "var(--font-weights-sans-semibold)"
  },
  "fontWeights.sans.bold": {
    "value": "700",
    "variable": "var(--font-weights-sans-bold)"
  },
  "fontWeights.sans.black": {
    "value": "900",
    "variable": "var(--font-weights-sans-black)"
  },
  "fontWeights.serif.thin": {
    "value": "100",
    "variable": "var(--font-weights-serif-thin)"
  },
  "fontWeights.serif.light": {
    "value": "300",
    "variable": "var(--font-weights-serif-light)"
  },
  "fontWeights.serif.normal": {
    "value": "373",
    "variable": "var(--font-weights-serif-normal)"
  },
  "fontWeights.serif.semibold": {
    "value": "600",
    "variable": "var(--font-weights-serif-semibold)"
  },
  "fontWeights.serif.bold": {
    "value": "700",
    "variable": "var(--font-weights-serif-bold)"
  },
  "fontWeights.serif.black": {
    "value": "900",
    "variable": "var(--font-weights-serif-black)"
  },
  "fontWeights.mono.thin": {
    "value": "100",
    "variable": "var(--font-weights-mono-thin)"
  },
  "fontWeights.mono.light": {
    "value": "300",
    "variable": "var(--font-weights-mono-light)"
  },
  "fontWeights.mono.normal": {
    "value": "393",
    "variable": "var(--font-weights-mono-normal)"
  },
  "fontWeights.mono.semibold": {
    "value": "600",
    "variable": "var(--font-weights-mono-semibold)"
  },
  "fontWeights.mono.bold": {
    "value": "700",
    "variable": "var(--font-weights-mono-bold)"
  },
  "spacing.-px": {
    "value": "calc(var(--spacing-px) * -1)",
    "variable": "var(--spacing-px)"
  },
  "spacing.-r": {
    "value": "calc(var(--spacing-r) * -1)",
    "variable": "var(--spacing-r)"
  },
  "spacing.-0.5r": {
    "value": "calc(var(--spacing-0\\.5r) * -1)",
    "variable": "var(--spacing-0\\.5r)"
  },
  "spacing.-1/2r": {
    "value": "calc(var(--spacing-1\\/2r) * -1)",
    "variable": "var(--spacing-1\\/2r)"
  },
  "spacing.-1/3r": {
    "value": "calc(var(--spacing-1\\/3r) * -1)",
    "variable": "var(--spacing-1\\/3r)"
  },
  "spacing.-1/4r": {
    "value": "calc(var(--spacing-1\\/4r) * -1)",
    "variable": "var(--spacing-1\\/4r)"
  },
  "spacing.-1/5r": {
    "value": "calc(var(--spacing-1\\/5r) * -1)",
    "variable": "var(--spacing-1\\/5r)"
  },
  "spacing.-1/6r": {
    "value": "calc(var(--spacing-1\\/6r) * -1)",
    "variable": "var(--spacing-1\\/6r)"
  },
  "spacing.-1r": {
    "value": "calc(var(--spacing-1r) * -1)",
    "variable": "var(--spacing-1r)"
  },
  "spacing.-1.5r": {
    "value": "calc(var(--spacing-1\\.5r) * -1)",
    "variable": "var(--spacing-1\\.5r)"
  },
  "spacing.-2r": {
    "value": "calc(var(--spacing-2r) * -1)",
    "variable": "var(--spacing-2r)"
  },
  "spacing.-3r": {
    "value": "calc(var(--spacing-3r) * -1)",
    "variable": "var(--spacing-3r)"
  },
  "spacing.-4r": {
    "value": "calc(var(--spacing-4r) * -1)",
    "variable": "var(--spacing-4r)"
  },
  "spacing.-5r": {
    "value": "calc(var(--spacing-5r) * -1)",
    "variable": "var(--spacing-5r)"
  },
  "spacing.-6r": {
    "value": "calc(var(--spacing-6r) * -1)",
    "variable": "var(--spacing-6r)"
  },
  "spacing.-8r": {
    "value": "calc(var(--spacing-8r) * -1)",
    "variable": "var(--spacing-8r)"
  },
  "spacing.-8.5r": {
    "value": "calc(var(--spacing-8\\.5r) * -1)",
    "variable": "var(--spacing-8\\.5r)"
  },
  "spacing.-10r": {
    "value": "calc(var(--spacing-10r) * -1)",
    "variable": "var(--spacing-10r)"
  },
  "spacing.-12r": {
    "value": "calc(var(--spacing-12r) * -1)",
    "variable": "var(--spacing-12r)"
  },
  "colors.colorPalette.50": {
    "value": "var(--colors-color-palette-50)",
    "variable": "var(--colors-color-palette-50)"
  },
  "colors.colorPalette.100": {
    "value": "var(--colors-color-palette-100)",
    "variable": "var(--colors-color-palette-100)"
  },
  "colors.colorPalette.200": {
    "value": "var(--colors-color-palette-200)",
    "variable": "var(--colors-color-palette-200)"
  },
  "colors.colorPalette.300": {
    "value": "var(--colors-color-palette-300)",
    "variable": "var(--colors-color-palette-300)"
  },
  "colors.colorPalette.400": {
    "value": "var(--colors-color-palette-400)",
    "variable": "var(--colors-color-palette-400)"
  },
  "colors.colorPalette.500": {
    "value": "var(--colors-color-palette-500)",
    "variable": "var(--colors-color-palette-500)"
  },
  "colors.colorPalette.600": {
    "value": "var(--colors-color-palette-600)",
    "variable": "var(--colors-color-palette-600)"
  },
  "colors.colorPalette.700": {
    "value": "var(--colors-color-palette-700)",
    "variable": "var(--colors-color-palette-700)"
  },
  "colors.colorPalette.800": {
    "value": "var(--colors-color-palette-800)",
    "variable": "var(--colors-color-palette-800)"
  },
  "colors.colorPalette.900": {
    "value": "var(--colors-color-palette-900)",
    "variable": "var(--colors-color-palette-900)"
  },
  "colors.colorPalette.950": {
    "value": "var(--colors-color-palette-950)",
    "variable": "var(--colors-color-palette-950)"
  },
  "colors.colorPalette.primary": {
    "value": "var(--colors-color-palette-primary)",
    "variable": "var(--colors-color-palette-primary)"
  },
  "colors.colorPalette.secondary": {
    "value": "var(--colors-color-palette-secondary)",
    "variable": "var(--colors-color-palette-secondary)"
  },
  "colors.colorPalette.disabled": {
    "value": "var(--colors-color-palette-disabled)",
    "variable": "var(--colors-color-palette-disabled)"
  },
  "colors.colorPalette.accent": {
    "value": "var(--colors-color-palette-accent)",
    "variable": "var(--colors-color-palette-accent)"
  },
  "colors.colorPalette.highlight": {
    "value": "var(--colors-color-palette-highlight)",
    "variable": "var(--colors-color-palette-highlight)"
  },
  "colors.colorPalette.background": {
    "value": "var(--colors-color-palette-background)",
    "variable": "var(--colors-color-palette-background)"
  },
  "colors.colorPalette.foreground": {
    "value": "var(--colors-color-palette-foreground)",
    "variable": "var(--colors-color-palette-foreground)"
  },
  "colors.colorPalette.primary.background": {
    "value": "var(--colors-color-palette-primary-background)",
    "variable": "var(--colors-color-palette-primary-background)"
  },
  "colors.colorPalette.primary.foreground": {
    "value": "var(--colors-color-palette-primary-foreground)",
    "variable": "var(--colors-color-palette-primary-foreground)"
  },
  "colors.colorPalette.primary.hover.background": {
    "value": "var(--colors-color-palette-primary-hover-background)",
    "variable": "var(--colors-color-palette-primary-hover-background)"
  },
  "colors.colorPalette.hover.background": {
    "value": "var(--colors-color-palette-hover-background)",
    "variable": "var(--colors-color-palette-hover-background)"
  },
  "colors.colorPalette.accent.foreground": {
    "value": "var(--colors-color-palette-accent-foreground)",
    "variable": "var(--colors-color-palette-accent-foreground)"
  },
  "colors.colorPalette.accent.background": {
    "value": "var(--colors-color-palette-accent-background)",
    "variable": "var(--colors-color-palette-accent-background)"
  },
  "colors.colorPalette.accent.hover": {
    "value": "var(--colors-color-palette-accent-hover)",
    "variable": "var(--colors-color-palette-accent-hover)"
  },
  "colors.colorPalette.hover": {
    "value": "var(--colors-color-palette-hover)",
    "variable": "var(--colors-color-palette-hover)"
  },
  "colors.colorPalette.accent.border": {
    "value": "var(--colors-color-palette-accent-border)",
    "variable": "var(--colors-color-palette-accent-border)"
  },
  "colors.colorPalette.border": {
    "value": "var(--colors-color-palette-border)",
    "variable": "var(--colors-color-palette-border)"
  },
  "colors.colorPalette.text.base": {
    "value": "var(--colors-color-palette-text-base)",
    "variable": "var(--colors-color-palette-text-base)"
  },
  "colors.colorPalette.base": {
    "value": "var(--colors-color-palette-base)",
    "variable": "var(--colors-color-palette-base)"
  },
  "colors.colorPalette.text.light": {
    "value": "var(--colors-color-palette-text-light)",
    "variable": "var(--colors-color-palette-text-light)"
  },
  "colors.colorPalette.light": {
    "value": "var(--colors-color-palette-light)",
    "variable": "var(--colors-color-palette-light)"
  },
  "colors.colorPalette.text.lighter": {
    "value": "var(--colors-color-palette-text-lighter)",
    "variable": "var(--colors-color-palette-text-lighter)"
  },
  "colors.colorPalette.lighter": {
    "value": "var(--colors-color-palette-lighter)",
    "variable": "var(--colors-color-palette-lighter)"
  },
  "colors.colorPalette.mark.background": {
    "value": "var(--colors-color-palette-mark-background)",
    "variable": "var(--colors-color-palette-mark-background)"
  },
  "colors.colorPalette.mark.foreground": {
    "value": "var(--colors-color-palette-mark-foreground)",
    "variable": "var(--colors-color-palette-mark-foreground)"
  },
  "colors.colorPalette.text": {
    "value": "var(--colors-color-palette-text)",
    "variable": "var(--colors-color-palette-text)"
  },
  "colors.colorPalette.textLight": {
    "value": "var(--colors-color-palette-text-light)",
    "variable": "var(--colors-color-palette-text-light)"
  },
  "colors.colorPalette.textLighter": {
    "value": "var(--colors-color-palette-text-lighter)",
    "variable": "var(--colors-color-palette-text-lighter)"
  },
  "colors.colorPalette.codeBackground": {
    "value": "var(--colors-color-palette-code-background)",
    "variable": "var(--colors-color-palette-code-background)"
  },
  "colors.colorPalette.selection.background": {
    "value": "var(--colors-color-palette-selection-background)",
    "variable": "var(--colors-color-palette-selection-background)"
  },
  "colors.colorPalette.selection.foreground": {
    "value": "var(--colors-color-palette-selection-foreground)",
    "variable": "var(--colors-color-palette-selection-foreground)"
  },
  "colors.colorPalette.dialog.background": {
    "value": "var(--colors-color-palette-dialog-background)",
    "variable": "var(--colors-color-palette-dialog-background)"
  },
  "colors.colorPalette.dialog.foreground": {
    "value": "var(--colors-color-palette-dialog-foreground)",
    "variable": "var(--colors-color-palette-dialog-foreground)"
  },
  "colors.colorPalette.dialog.border": {
    "value": "var(--colors-color-palette-dialog-border)",
    "variable": "var(--colors-color-palette-dialog-border)"
  },
  "colors.colorPalette.hr.border": {
    "value": "var(--colors-color-palette-hr-border)",
    "variable": "var(--colors-color-palette-hr-border)"
  },
  "colors.colorPalette.meta.foreground": {
    "value": "var(--colors-color-palette-meta-foreground)",
    "variable": "var(--colors-color-palette-meta-foreground)"
  },
  "colors.colorPalette.blockquote.foreground": {
    "value": "var(--colors-color-palette-blockquote-foreground)",
    "variable": "var(--colors-color-palette-blockquote-foreground)"
  },
  "colors.colorPalette.blockquote.border": {
    "value": "var(--colors-color-palette-blockquote-border)",
    "variable": "var(--colors-color-palette-blockquote-border)"
  },
  "colors.colorPalette.cite.foreground": {
    "value": "var(--colors-color-palette-cite-foreground)",
    "variable": "var(--colors-color-palette-cite-foreground)"
  },
  "colors.colorPalette.small.foreground": {
    "value": "var(--colors-color-palette-small-foreground)",
    "variable": "var(--colors-color-palette-small-foreground)"
  },
  "colors.colorPalette.code.inline.foreground": {
    "value": "var(--colors-color-palette-code-inline-foreground)",
    "variable": "var(--colors-color-palette-code-inline-foreground)"
  },
  "colors.colorPalette.inline.foreground": {
    "value": "var(--colors-color-palette-inline-foreground)",
    "variable": "var(--colors-color-palette-inline-foreground)"
  },
  "colors.colorPalette.code.inline.background": {
    "value": "var(--colors-color-palette-code-inline-background)",
    "variable": "var(--colors-color-palette-code-inline-background)"
  },
  "colors.colorPalette.inline.background": {
    "value": "var(--colors-color-palette-inline-background)",
    "variable": "var(--colors-color-palette-inline-background)"
  },
  "colors.colorPalette.code.inline.border": {
    "value": "var(--colors-color-palette-code-inline-border)",
    "variable": "var(--colors-color-palette-code-inline-border)"
  },
  "colors.colorPalette.inline.border": {
    "value": "var(--colors-color-palette-inline-border)",
    "variable": "var(--colors-color-palette-inline-border)"
  },
  "colors.colorPalette.kbd.background": {
    "value": "var(--colors-color-palette-kbd-background)",
    "variable": "var(--colors-color-palette-kbd-background)"
  },
  "colors.colorPalette.kbd.foreground": {
    "value": "var(--colors-color-palette-kbd-foreground)",
    "variable": "var(--colors-color-palette-kbd-foreground)"
  },
  "colors.colorPalette.kbd.border": {
    "value": "var(--colors-color-palette-kbd-border)",
    "variable": "var(--colors-color-palette-kbd-border)"
  },
  "colors.colorPalette.kbd.shadowMix": {
    "value": "var(--colors-color-palette-kbd-shadow-mix)",
    "variable": "var(--colors-color-palette-kbd-shadow-mix)"
  },
  "colors.colorPalette.shadowMix": {
    "value": "var(--colors-color-palette-shadow-mix)",
    "variable": "var(--colors-color-palette-shadow-mix)"
  },
  "colors.colorPalette.pre.foreground": {
    "value": "var(--colors-color-palette-pre-foreground)",
    "variable": "var(--colors-color-palette-pre-foreground)"
  },
  "colors.colorPalette.pre.background": {
    "value": "var(--colors-color-palette-pre-background)",
    "variable": "var(--colors-color-palette-pre-background)"
  },
  "colors.colorPalette.pre.border": {
    "value": "var(--colors-color-palette-pre-border)",
    "variable": "var(--colors-color-palette-pre-border)"
  },
  "colors.colorPalette.samp.background": {
    "value": "var(--colors-color-palette-samp-background)",
    "variable": "var(--colors-color-palette-samp-background)"
  },
  "colors.colorPalette.samp.foreground": {
    "value": "var(--colors-color-palette-samp-foreground)",
    "variable": "var(--colors-color-palette-samp-foreground)"
  },
  "colors.colorPalette.link.default": {
    "value": "var(--colors-color-palette-link-default)",
    "variable": "var(--colors-color-palette-link-default)"
  },
  "colors.colorPalette.default": {
    "value": "var(--colors-color-palette-default)",
    "variable": "var(--colors-color-palette-default)"
  },
  "colors.colorPalette.link.hover": {
    "value": "var(--colors-color-palette-link-hover)",
    "variable": "var(--colors-color-palette-link-hover)"
  },
  "colors.colorPalette.ins.foreground": {
    "value": "var(--colors-color-palette-ins-foreground)",
    "variable": "var(--colors-color-palette-ins-foreground)"
  },
  "colors.colorPalette.ins.decoration": {
    "value": "var(--colors-color-palette-ins-decoration)",
    "variable": "var(--colors-color-palette-ins-decoration)"
  },
  "colors.colorPalette.decoration": {
    "value": "var(--colors-color-palette-decoration)",
    "variable": "var(--colors-color-palette-decoration)"
  },
  "colors.colorPalette.abbr.textDecoration": {
    "value": "var(--colors-color-palette-abbr-text-decoration)",
    "variable": "var(--colors-color-palette-abbr-text-decoration)"
  },
  "colors.colorPalette.textDecoration": {
    "value": "var(--colors-color-palette-text-decoration)",
    "variable": "var(--colors-color-palette-text-decoration)"
  },
  "colors.colorPalette.del.foreground": {
    "value": "var(--colors-color-palette-del-foreground)",
    "variable": "var(--colors-color-palette-del-foreground)"
  },
  "colors.colorPalette.dfn.foreground": {
    "value": "var(--colors-color-palette-dfn-foreground)",
    "variable": "var(--colors-color-palette-dfn-foreground)"
  },
  "colors.colorPalette.q.foreground": {
    "value": "var(--colors-color-palette-q-foreground)",
    "variable": "var(--colors-color-palette-q-foreground)"
  },
  "colors.colorPalette.s.foreground": {
    "value": "var(--colors-color-palette-s-foreground)",
    "variable": "var(--colors-color-palette-s-foreground)"
  },
  "colors.colorPalette.u.textDecoration": {
    "value": "var(--colors-color-palette-u-text-decoration)",
    "variable": "var(--colors-color-palette-u-text-decoration)"
  },
  "colors.colorPalette.varTag.foreground": {
    "value": "var(--colors-color-palette-var-tag-foreground)",
    "variable": "var(--colors-color-palette-var-tag-foreground)"
  },
  "colors.colorPalette.list.marker.foreground": {
    "value": "var(--colors-color-palette-list-marker-foreground)",
    "variable": "var(--colors-color-palette-list-marker-foreground)"
  },
  "colors.colorPalette.marker.foreground": {
    "value": "var(--colors-color-palette-marker-foreground)",
    "variable": "var(--colors-color-palette-marker-foreground)"
  },
  "colors.colorPalette.list.definition.description.foreground": {
    "value": "var(--colors-color-palette-list-definition-description-foreground)",
    "variable": "var(--colors-color-palette-list-definition-description-foreground)"
  },
  "colors.colorPalette.definition.description.foreground": {
    "value": "var(--colors-color-palette-definition-description-foreground)",
    "variable": "var(--colors-color-palette-definition-description-foreground)"
  },
  "colors.colorPalette.description.foreground": {
    "value": "var(--colors-color-palette-description-foreground)",
    "variable": "var(--colors-color-palette-description-foreground)"
  },
  "colors.colorPalette.fieldset.border": {
    "value": "var(--colors-color-palette-fieldset-border)",
    "variable": "var(--colors-color-palette-fieldset-border)"
  },
  "colors.colorPalette.label.controlAccent": {
    "value": "var(--colors-color-palette-label-control-accent)",
    "variable": "var(--colors-color-palette-label-control-accent)"
  },
  "colors.colorPalette.controlAccent": {
    "value": "var(--colors-color-palette-control-accent)",
    "variable": "var(--colors-color-palette-control-accent)"
  },
  "colors.colorPalette.field.border": {
    "value": "var(--colors-color-palette-field-border)",
    "variable": "var(--colors-color-palette-field-border)"
  },
  "colors.colorPalette.field.borderHover": {
    "value": "var(--colors-color-palette-field-border-hover)",
    "variable": "var(--colors-color-palette-field-border-hover)"
  },
  "colors.colorPalette.borderHover": {
    "value": "var(--colors-color-palette-border-hover)",
    "variable": "var(--colors-color-palette-border-hover)"
  },
  "colors.colorPalette.field.background": {
    "value": "var(--colors-color-palette-field-background)",
    "variable": "var(--colors-color-palette-field-background)"
  },
  "colors.colorPalette.field.foreground": {
    "value": "var(--colors-color-palette-field-foreground)",
    "variable": "var(--colors-color-palette-field-foreground)"
  },
  "colors.colorPalette.field.focusRing": {
    "value": "var(--colors-color-palette-field-focus-ring)",
    "variable": "var(--colors-color-palette-field-focus-ring)"
  },
  "colors.colorPalette.focusRing": {
    "value": "var(--colors-color-palette-focus-ring)",
    "variable": "var(--colors-color-palette-focus-ring)"
  },
  "colors.colorPalette.field.placeholder": {
    "value": "var(--colors-color-palette-field-placeholder)",
    "variable": "var(--colors-color-palette-field-placeholder)"
  },
  "colors.colorPalette.placeholder": {
    "value": "var(--colors-color-palette-placeholder)",
    "variable": "var(--colors-color-palette-placeholder)"
  },
  "colors.colorPalette.field.controlAccent": {
    "value": "var(--colors-color-palette-field-control-accent)",
    "variable": "var(--colors-color-palette-field-control-accent)"
  },
  "colors.colorPalette.checkbox.unchecked.borderMix": {
    "value": "var(--colors-color-palette-checkbox-unchecked-border-mix)",
    "variable": "var(--colors-color-palette-checkbox-unchecked-border-mix)"
  },
  "colors.colorPalette.unchecked.borderMix": {
    "value": "var(--colors-color-palette-unchecked-border-mix)",
    "variable": "var(--colors-color-palette-unchecked-border-mix)"
  },
  "colors.colorPalette.borderMix": {
    "value": "var(--colors-color-palette-border-mix)",
    "variable": "var(--colors-color-palette-border-mix)"
  },
  "colors.colorPalette.checkbox.checked.fill": {
    "value": "var(--colors-color-palette-checkbox-checked-fill)",
    "variable": "var(--colors-color-palette-checkbox-checked-fill)"
  },
  "colors.colorPalette.checked.fill": {
    "value": "var(--colors-color-palette-checked-fill)",
    "variable": "var(--colors-color-palette-checked-fill)"
  },
  "colors.colorPalette.fill": {
    "value": "var(--colors-color-palette-fill)",
    "variable": "var(--colors-color-palette-fill)"
  },
  "colors.colorPalette.checkbox.tick.stroke": {
    "value": "var(--colors-color-palette-checkbox-tick-stroke)",
    "variable": "var(--colors-color-palette-checkbox-tick-stroke)"
  },
  "colors.colorPalette.tick.stroke": {
    "value": "var(--colors-color-palette-tick-stroke)",
    "variable": "var(--colors-color-palette-tick-stroke)"
  },
  "colors.colorPalette.stroke": {
    "value": "var(--colors-color-palette-stroke)",
    "variable": "var(--colors-color-palette-stroke)"
  },
  "colors.colorPalette.radio.track.background": {
    "value": "var(--colors-color-palette-radio-track-background)",
    "variable": "var(--colors-color-palette-radio-track-background)"
  },
  "colors.colorPalette.track.background": {
    "value": "var(--colors-color-palette-track-background)",
    "variable": "var(--colors-color-palette-track-background)"
  },
  "colors.colorPalette.radio.checked.inner.background": {
    "value": "var(--colors-color-palette-radio-checked-inner-background)",
    "variable": "var(--colors-color-palette-radio-checked-inner-background)"
  },
  "colors.colorPalette.checked.inner.background": {
    "value": "var(--colors-color-palette-checked-inner-background)",
    "variable": "var(--colors-color-palette-checked-inner-background)"
  },
  "colors.colorPalette.inner.background": {
    "value": "var(--colors-color-palette-inner-background)",
    "variable": "var(--colors-color-palette-inner-background)"
  },
  "colors.colorPalette.radio.checked.ring.border": {
    "value": "var(--colors-color-palette-radio-checked-ring-border)",
    "variable": "var(--colors-color-palette-radio-checked-ring-border)"
  },
  "colors.colorPalette.checked.ring.border": {
    "value": "var(--colors-color-palette-checked-ring-border)",
    "variable": "var(--colors-color-palette-checked-ring-border)"
  },
  "colors.colorPalette.ring.border": {
    "value": "var(--colors-color-palette-ring-border)",
    "variable": "var(--colors-color-palette-ring-border)"
  },
  "colors.colorPalette.button.background": {
    "value": "var(--colors-color-palette-button-background)",
    "variable": "var(--colors-color-palette-button-background)"
  },
  "colors.colorPalette.button.foreground": {
    "value": "var(--colors-color-palette-button-foreground)",
    "variable": "var(--colors-color-palette-button-foreground)"
  },
  "colors.colorPalette.button.disabled.background": {
    "value": "var(--colors-color-palette-button-disabled-background)",
    "variable": "var(--colors-color-palette-button-disabled-background)"
  },
  "colors.colorPalette.disabled.background": {
    "value": "var(--colors-color-palette-disabled-background)",
    "variable": "var(--colors-color-palette-disabled-background)"
  },
  "colors.colorPalette.button.disabled.foreground": {
    "value": "var(--colors-color-palette-button-disabled-foreground)",
    "variable": "var(--colors-color-palette-button-disabled-foreground)"
  },
  "colors.colorPalette.disabled.foreground": {
    "value": "var(--colors-color-palette-disabled-foreground)",
    "variable": "var(--colors-color-palette-disabled-foreground)"
  },
  "colors.colorPalette.progress.bar.foreground": {
    "value": "var(--colors-color-palette-progress-bar-foreground)",
    "variable": "var(--colors-color-palette-progress-bar-foreground)"
  },
  "colors.colorPalette.bar.foreground": {
    "value": "var(--colors-color-palette-bar-foreground)",
    "variable": "var(--colors-color-palette-bar-foreground)"
  },
  "colors.colorPalette.progress.track.mixForeground": {
    "value": "var(--colors-color-palette-progress-track-mix-foreground)",
    "variable": "var(--colors-color-palette-progress-track-mix-foreground)"
  },
  "colors.colorPalette.track.mixForeground": {
    "value": "var(--colors-color-palette-track-mix-foreground)",
    "variable": "var(--colors-color-palette-track-mix-foreground)"
  },
  "colors.colorPalette.mixForeground": {
    "value": "var(--colors-color-palette-mix-foreground)",
    "variable": "var(--colors-color-palette-mix-foreground)"
  },
  "colors.colorPalette.progress.track.mixBackground": {
    "value": "var(--colors-color-palette-progress-track-mix-background)",
    "variable": "var(--colors-color-palette-progress-track-mix-background)"
  },
  "colors.colorPalette.track.mixBackground": {
    "value": "var(--colors-color-palette-track-mix-background)",
    "variable": "var(--colors-color-palette-track-mix-background)"
  },
  "colors.colorPalette.mixBackground": {
    "value": "var(--colors-color-palette-mix-background)",
    "variable": "var(--colors-color-palette-mix-background)"
  },
  "colors.colorPalette.meter.optimum.foreground": {
    "value": "var(--colors-color-palette-meter-optimum-foreground)",
    "variable": "var(--colors-color-palette-meter-optimum-foreground)"
  },
  "colors.colorPalette.optimum.foreground": {
    "value": "var(--colors-color-palette-optimum-foreground)",
    "variable": "var(--colors-color-palette-optimum-foreground)"
  },
  "colors.colorPalette.meter.suboptimum.foreground": {
    "value": "var(--colors-color-palette-meter-suboptimum-foreground)",
    "variable": "var(--colors-color-palette-meter-suboptimum-foreground)"
  },
  "colors.colorPalette.suboptimum.foreground": {
    "value": "var(--colors-color-palette-suboptimum-foreground)",
    "variable": "var(--colors-color-palette-suboptimum-foreground)"
  },
  "colors.colorPalette.meter.evenLessGood.foreground": {
    "value": "var(--colors-color-palette-meter-even-less-good-foreground)",
    "variable": "var(--colors-color-palette-meter-even-less-good-foreground)"
  },
  "colors.colorPalette.evenLessGood.foreground": {
    "value": "var(--colors-color-palette-even-less-good-foreground)",
    "variable": "var(--colors-color-palette-even-less-good-foreground)"
  },
  "colors.colorPalette.focus.ring": {
    "value": "var(--colors-color-palette-focus-ring)",
    "variable": "var(--colors-color-palette-focus-ring)"
  },
  "colors.colorPalette.ring": {
    "value": "var(--colors-color-palette-ring)",
    "variable": "var(--colors-color-palette-ring)"
  },
  "colors.colorPalette.table.border": {
    "value": "var(--colors-color-palette-table-border)",
    "variable": "var(--colors-color-palette-table-border)"
  },
  "colors.colorPalette.table.row.mutedBackground": {
    "value": "var(--colors-color-palette-table-row-muted-background)",
    "variable": "var(--colors-color-palette-table-row-muted-background)"
  },
  "colors.colorPalette.row.mutedBackground": {
    "value": "var(--colors-color-palette-row-muted-background)",
    "variable": "var(--colors-color-palette-row-muted-background)"
  },
  "colors.colorPalette.mutedBackground": {
    "value": "var(--colors-color-palette-muted-background)",
    "variable": "var(--colors-color-palette-muted-background)"
  },
  "colors.colorPalette.table.footer.mutedBackground": {
    "value": "var(--colors-color-palette-table-footer-muted-background)",
    "variable": "var(--colors-color-palette-table-footer-muted-background)"
  },
  "colors.colorPalette.footer.mutedBackground": {
    "value": "var(--colors-color-palette-footer-muted-background)",
    "variable": "var(--colors-color-palette-footer-muted-background)"
  },
  "colors.colorPalette.table.cell.foreground": {
    "value": "var(--colors-color-palette-table-cell-foreground)",
    "variable": "var(--colors-color-palette-table-cell-foreground)"
  },
  "colors.colorPalette.cell.foreground": {
    "value": "var(--colors-color-palette-cell-foreground)",
    "variable": "var(--colors-color-palette-cell-foreground)"
  },
  "colors.colorPalette.table.caption.foreground": {
    "value": "var(--colors-color-palette-table-caption-foreground)",
    "variable": "var(--colors-color-palette-table-caption-foreground)"
  },
  "colors.colorPalette.caption.foreground": {
    "value": "var(--colors-color-palette-caption-foreground)",
    "variable": "var(--colors-color-palette-caption-foreground)"
  },
  "colors.colorPalette.media.caption.foreground": {
    "value": "var(--colors-color-palette-media-caption-foreground)",
    "variable": "var(--colors-color-palette-media-caption-foreground)"
  },
  "colors.colorPalette.media.embed.border": {
    "value": "var(--colors-color-palette-media-embed-border)",
    "variable": "var(--colors-color-palette-media-embed-border)"
  },
  "colors.colorPalette.embed.border": {
    "value": "var(--colors-color-palette-embed-border)",
    "variable": "var(--colors-color-palette-embed-border)"
  },
  "colors.colorPalette.disclosure.border": {
    "value": "var(--colors-color-palette-disclosure-border)",
    "variable": "var(--colors-color-palette-disclosure-border)"
  },
  "colors.colorPalette.tab.track.background": {
    "value": "var(--colors-color-palette-tab-track-background)",
    "variable": "var(--colors-color-palette-tab-track-background)"
  }
}

export function token(path, fallback) {
  return tokens[path]?.value || fallback
}

function tokenVar(path, fallback) {
  return tokens[path]?.variable || fallback
}

token.var = tokenVar