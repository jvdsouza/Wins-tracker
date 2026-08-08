import { contextBridge } from 'electron'

// Task 11 replaces this with the real window.api surface
contextBridge.exposeInMainWorld('api', {})
