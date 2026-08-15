import { BrowserWindow } from 'electron'
import { join } from 'node:path'

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export interface WorkArea {
  x: number
  y: number
  width: number
  height: number
}

const DEFAULT_WIDTH = 380
const DEFAULT_HEIGHT = 560
const MARGIN = 24

export function getDefaultBounds(workArea: WorkArea): Bounds {
  return {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    x: workArea.x + workArea.width - DEFAULT_WIDTH - MARGIN,
    y: workArea.y + workArea.height - DEFAULT_HEIGHT - MARGIN
  }
}

export function clampBoundsToDisplay(bounds: Bounds, workArea: WorkArea): Bounds {
  const width = Math.min(bounds.width, workArea.width)
  const height = Math.min(bounds.height, workArea.height)
  const x = Math.min(Math.max(bounds.x, workArea.x), workArea.x + workArea.width - width)
  const y = Math.min(Math.max(bounds.y, workArea.y), workArea.y + workArea.height - height)
  return { x, y, width, height }
}

export function createOverlayWindow(savedBounds?: Bounds): BrowserWindow {
  const { screen } = require('electron')
  const workArea = screen.getPrimaryDisplay().workArea
  const bounds = savedBounds
    ? clampBoundsToDisplay(savedBounds, workArea)
    : getDefaultBounds(workArea)

  const win = new BrowserWindow({
    ...bounds,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}
