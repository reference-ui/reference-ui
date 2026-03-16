import setupTasty from './tasty/globalSetup'
import setupVirtualfs from './virtualfs/globalSetup'

export default async function globalSetup() {
  await setupTasty()
  await setupVirtualfs()
}
