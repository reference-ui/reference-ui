/**
 * Stamp writer for native binaries built elsewhere.
 * Records the current rust inputs hash beside a .node binary in dist/native so
 * pack and build steps can prove the binary matches the sources it ships with.
 * The stamp is the hash of the current sources, so run it only after copying a
 * binary built from these exact sources onto this host. CI calls it right after
 * each napi build (.github/workflows/rust-compile.yml) and uploads the stamp
 * beside its binary.
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
