import setupAtlas from './atlas/globalSetup'
import setupTasty from './tasty/globalSetup'
import setupVirtualfs from './virtualfs/globalSetup'

export default async function globalSetup() {
  await setupAtlas()
  await setupTasty()
  await setupVirtualfs()
}
