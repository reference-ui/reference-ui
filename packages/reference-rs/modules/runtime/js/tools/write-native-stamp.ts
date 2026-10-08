/**
 * Stamp writer for freshly compiled native binaries.
 * Records the current rust inputs hash beside a .node binary so later pack
 * and build steps can prove the binary matches the sources it ships with.
 * Used by CI immediately after compiling a target the pack host cannot build.
 */
import { nativeDir, packageDir } from '../shared/paths'
import { writeNativeStamp } from '../shared/native-freshness'

const triple = process.argv.slice(2).find(arg => arg !== '--')
if (!triple) {
  throw new Error('Usage: write-native-stamp.ts <triple>')
}

const stampPath = writeNativeStamp({
  nativeDirPath: nativeDir,
  packageDirPath: packageDir,
  triple,
})
console.log(`Stamped native binary for ${triple} at ${stampPath}`)
