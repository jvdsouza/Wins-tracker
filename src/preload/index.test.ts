import { describe, it, expect, vi } from 'vitest'

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn()
  },
  ipcRenderer: {}
}))

import { buildApi } from './index'

describe('buildApi', () => {
  it('forwards wins.add to ipcRenderer.invoke on the correct channel', async () => {
    const invoke = vi.fn().mockResolvedValue({ id: '1' })
    const on = vi.fn()
    const api = buildApi({ invoke, on } as any)

    const result = await api.wins.add({ text: 'hi', rating: null })

    expect(invoke).toHaveBeenCalledWith('wins:add', { text: 'hi', rating: null })
    expect(result).toEqual({ id: '1' })
  })

  it('forwards wins.update to ipcRenderer.invoke on the correct channel', async () => {
    const invoke = vi.fn().mockResolvedValue({ id: '1', text: 'new text' })
    const on = vi.fn()
    const api = buildApi({ invoke, on } as any)

    const result = await api.wins.update('1', { text: 'new text' })

    expect(invoke).toHaveBeenCalledWith('wins:update', '1', { text: 'new text' })
    expect(result).toEqual({ id: '1', text: 'new text' })
  })

  it('forwards wins.delete to ipcRenderer.invoke on the correct channel', async () => {
    const invoke = vi.fn().mockResolvedValue(undefined)
    const on = vi.fn()
    const api = buildApi({ invoke, on } as any)

    await api.wins.delete('1')

    expect(invoke).toHaveBeenCalledWith('wins:delete', '1')
  })

  it('subscribes onUpdated to the wins:updated channel', () => {
    const invoke = vi.fn()
    const on = vi.fn()
    const api = buildApi({ invoke, on } as any)
    const callback = vi.fn()

    api.wins.onUpdated(callback)

    expect(on).toHaveBeenCalledWith('wins:updated', expect.any(Function))
  })
})
