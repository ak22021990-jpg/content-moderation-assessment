import { execSync } from 'node:child_process'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PUBLIC = resolve(ROOT, 'public')
const PLAYLIST_PATH = resolve(ROOT, 'src', 'data', 'playlist.json')
const SPRITES_DIR = resolve(PUBLIC, 'sprites')
const VTT_DIR = resolve(PUBLIC, 'vtt')

export function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = (seconds % 60).toFixed(3)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(6, '0')}`
}

export function generateThumbsVtt(videoId, durationSec, COLS = 10, ROWS = 10, TILE_W = 160, TILE_H = 90) {
  const interval = durationSec / (COLS * ROWS)
  let vtt = 'WEBVTT\n\n'
  for (let i = 0; i < COLS * ROWS; i++) {
    const startTime = formatTime(i * interval)
    const endTime = formatTime((i + 1) * interval)
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const x = col * TILE_W
    const y = row * TILE_H
    vtt += `${startTime} --> ${endTime}\n`
    vtt += `/sprites/${videoId}_sprite.jpg#xywh=${x},${y},${TILE_W},${TILE_H}\n\n`
  }
  return vtt
}

export function generateChaptersVtt(chapters) {
  let vtt = 'WEBVTT\n\n'
  for (const ch of chapters) {
    const ts = formatTime(ch.t)
    vtt += `${ts} --> ${ts}\n`
    vtt += `${ch.label}\n\n`
  }
  return vtt
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

async function main() {
  const playlistRaw = readFileSync(PLAYLIST_PATH, 'utf-8')
  const playlist = JSON.parse(playlistRaw)

  ensureDir(SPRITES_DIR)
  ensureDir(VTT_DIR)

  for (const video of playlist.videos) {
    const videoPath = resolve(PUBLIC, 'videos', `${video.id}.mp4`)
    if (!existsSync(videoPath)) {
      console.error(`Video not found: ${videoPath}`)
      process.exitCode = 1
      continue
    }

    console.log(`Processing: ${video.id}`)

    let durationSec = video.durationSec
    try {
      const durRaw = execSync(
        `ffprobe -v error -show_entries format=duration -of csv=p=0 "${videoPath}"`,
        { encoding: 'utf-8' }
      ).trim()
      const parsed = parseFloat(durRaw)
      if (!isNaN(parsed) && parsed > 0) {
        durationSec = parsed
      }
    } catch {
      console.warn(`ffprobe failed for ${video.id}, using playlist durationSec: ${durationSec}`)
    }

    const COLS = 10
    const ROWS = 10
    const TILE_W = 160
    const TILE_H = 90
    const interval = durationSec / (COLS * ROWS)

    const spritePath = resolve(SPRITES_DIR, `${video.id}_sprite.jpg`)
    console.log(`  Generating sprite: ${spritePath}`)
    try {
      execSync(
        `ffmpeg -y -i "${videoPath}" -vf "fps=1/${interval},scale=${TILE_W}:${TILE_H},tile=${COLS}x${ROWS}" -frames:v 1 "${spritePath}"`,
        { stdio: 'pipe' }
      )
    } catch (err) {
      console.error(`ffmpeg failed for ${video.id}: ${err.message}`)
      process.exitCode = 1
      continue
    }

    const thumbsVtt = generateThumbsVtt(video.id, durationSec, COLS, ROWS, TILE_W, TILE_H)
    const thumbsPath = resolve(VTT_DIR, `${video.id}.thumbs.vtt`)
    writeFileSync(thumbsPath, thumbsVtt, 'utf-8')
    console.log(`  Wrote thumbs VTT: ${thumbsPath}`)

    if (video.chapters && video.chapters.length > 0) {
      const chaptersVtt = generateChaptersVtt(video.chapters)
      const chaptersPath = resolve(VTT_DIR, `${video.id}.chapters.vtt`)
      writeFileSync(chaptersPath, chaptersVtt, 'utf-8')
      console.log(`  Wrote chapters VTT: ${chaptersPath}`)
    }

    console.log(`  Done: ${video.id}`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
