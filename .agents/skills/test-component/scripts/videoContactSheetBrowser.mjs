/**
 * Browser-side page.evaluate bodies for the video contact-sheet builder.
 *
 * These functions run inside Playwright's page context, so each is serialized by
 * `page.evaluate` and may touch only its argument and browser globals. Together
 * they prepare the video element and resolve its finite duration, densely sample
 * frame luminance signatures for activity detection, and paint the chosen stills
 * into a labelled grid (or a no-change banner). No Node imports live here; the
 * pure selection math stays in videoContactSheet.mjs.
 */

/**
 * Mounts the video and returns its finite duration. Playwright webm recordings
 * report `Infinity` until the element is seeked far past the end, so this seeks
 * to a huge time, waits for `durationchange`, then seeks back to 0. Leaves the
 * element on `window.__referenceUiVideo` for the later sampling and render steps.
 */
export async function prepareVideo({ assetUrl, timeoutMs }) {
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.src = assetUrl
  // Keep the element a real size and in the layout — Chromium can skip frame
  // production for fully hidden or zero-sized videos, which would paint black.
  video.style.position = 'fixed'
  video.style.top = '0'
  video.style.left = '0'
  video.style.width = '320px'
  video.style.height = '200px'
  video.style.zIndex = '-1'
  document.body.appendChild(video)

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timed out waiting for video metadata')), timeoutMs)
    video.addEventListener('loadedmetadata', () => { clearTimeout(timer); resolve() }, { once: true })
    video.addEventListener('error', () => { clearTimeout(timer); reject(new Error('video failed to load')) }, { once: true })
  })

  let duration = video.duration
  if (!Number.isFinite(duration) || duration <= 0) {
    // Playwright webm recordings report Infinity until forced past the end.
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timed out resolving the video duration')), timeoutMs)
      const onDurationChange = () => {
        if (Number.isFinite(video.duration) && video.duration > 0) {
          clearTimeout(timer)
          video.removeEventListener('durationchange', onDurationChange)
          resolve()
        }
      }
      video.addEventListener('durationchange', onDurationChange)
      video.currentTime = 1e6
    })
    duration = video.duration
    video.currentTime = 0
    await new Promise((resolve) => video.addEventListener('seeked', resolve, { once: true }))
  }

  // The finite-duration path can return before the media is actually seekable;
  // without a seekable range every later `currentTime` write silently no-ops.
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timed out waiting for a seekable video range')), timeoutMs)
    const poll = () => {
      if (video.readyState >= 2 && video.seekable.length > 0 && video.seekable.end(0) > 0) {
        clearTimeout(timer)
        resolve()
      } else {
        requestAnimationFrame(poll)
      }
    }
    poll()
  })

  window.__referenceUiVideo = video
  // page.evaluate serialises each exported function on its own, so a shared
  // helper must live on the page: sampling and rendering both seek through this.
  window.__referenceUiSeekFrame = (timestamp, timeoutMs) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out seeking to ${timestamp}s`)), timeoutMs)
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      // `seeked` can fire a tick before the new frame is available to paint.
      // Wait for the presentation callback, but never hang on it: the timeout
      // still lets a capture proceed if the callback does not fire.
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve()
      }
      if (typeof video.requestVideoFrameCallback === 'function') {
        video.requestVideoFrameCallback(finish)
        setTimeout(finish, 200)
      } else {
        setTimeout(finish, 50)
      }
    }
    video.addEventListener('seeked', onSeeked)
    video.currentTime = timestamp
  })
  return duration
}

/**
 * Seeks to each timestamp in turn and returns `[{ t, signature }]`, where the
 * signature is the 32x20 luminance array of that frame. The tiny canvas keeps
 * each sample cheap while still moving when real content appears, which is all
 * the activity detector needs.
 */
export async function sampleSignatures({ timestamps, signatureWidth, signatureHeight, seekTimeoutMs }) {
  const video = window.__referenceUiVideo
  if (!video) throw new Error('video was not prepared before sampling')

  const canvas = document.createElement('canvas')
  canvas.width = signatureWidth
  canvas.height = signatureHeight
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  const samples = []
  for (const timestamp of timestamps) {
    await window.__referenceUiSeekFrame(timestamp, seekTimeoutMs)
    ctx.drawImage(video, 0, 0, signatureWidth, signatureHeight)
    const { data } = ctx.getImageData(0, 0, signatureWidth, signatureHeight)
    const signature = new Array(signatureWidth * signatureHeight)
    for (let index = 0; index < signature.length; index += 1) {
      const offset = index * 4
      signature[index] = 0.2126 * data[offset] + 0.7152 * data[offset + 1] + 0.0722 * data[offset + 2]
    }
    samples.push({ t: timestamp, signature })
  }
  return samples
}

/**
 * Seeks to each chosen timestamp, paints the frame into its grid cell, and
 * stamps the timestamp label. When `banner` is set (or no timestamps were
 * chosen) it paints a single loud banner instead, so an all-blank recording is
 * obviously an artifact rather than a silent black sheet.
 */
export async function renderContactSheet({ timestamps, geometry, labelHeight, seekTimeoutMs, banner }) {
  const video = window.__referenceUiVideo
  if (!video) throw new Error('video was not prepared before rendering')

  const canvas = document.createElement('canvas')
  canvas.id = 'reference-ui-frames'
  canvas.width = geometry.gridWidth
  canvas.height = geometry.gridHeight
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  if (banner || timestamps.length === 0) {
    ctx.fillStyle = '#7a1010'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const message = banner || 'no frames selected'
    const lineHeight = 26
    const maxWidth = canvas.width - 24
    ctx.font = 'bold 20px ui-monospace, monospace'
    const words = message.split(' ')
    const lines = []
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line)
        line = word
      } else {
        line = candidate
      }
    }
    if (line) lines.push(line)
    const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2
    for (let index = 0; index < lines.length; index += 1) {
      ctx.fillText(lines[index], canvas.width / 2, startY + index * lineHeight)
    }
  } else {
    for (let index = 0; index < timestamps.length; index += 1) {
      const timestamp = timestamps[index]
      const rect = geometry.rects[index]
      await window.__referenceUiSeekFrame(timestamp, seekTimeoutMs)
      ctx.drawImage(video, rect.x, rect.y, rect.width, rect.height)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
      ctx.fillRect(rect.x, rect.y + rect.height - labelHeight, rect.width, labelHeight)
      ctx.fillStyle = '#ffffff'
      ctx.font = '15px ui-monospace, monospace'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${timestamp.toFixed(2)}s`, rect.x + 8, rect.y + rect.height - labelHeight / 2)
    }
  }

  document.body.style.margin = '0'
  document.body.appendChild(canvas)
  return { width: canvas.width, height: canvas.height }
}
