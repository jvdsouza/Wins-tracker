import { describe, it, expect, vi } from 'vitest'
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

  it('subscribes onUpdated to the wins:updated channel', () => {
    const invoke = vi.fn()
    const on = vi.fn()
    const api = buildApi({ invoke, on } as any)
    const callback = vi.fn()

    api.wins.onUpdated(callback)

    expect(on).toHaveBeenCalledWith('wins:updated', expect.any(Function))
  })
})
