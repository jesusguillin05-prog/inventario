import { contextBridge, ipcRenderer } from 'electron'

const invoke = (canal) => (...args) => ipcRenderer.invoke(canal, ...args)

contextBridge.exposeInMainWorld('electron', {
  process: { versions: process.versions },
  ipcRenderer: {
    send: (...args) => ipcRenderer.send(...args),
    on: (...args) => ipcRenderer.on(...args),
    removeListener: (...args) => ipcRenderer.removeListener(...args)
  }
})

contextBridge.exposeInMainWorld('api', {
  categorias: {
    listar: invoke('categorias:listar'),
    crear: invoke('categorias:crear'),
    eliminar: invoke('categorias:eliminar')
  },
  productos: {
    listar: invoke('productos:listar'),
    crear: invoke('productos:crear'),
    actualizar: invoke('productos:actualizar'),
    toggle: invoke('productos:toggle'),
    eliminar: invoke('productos:eliminar')
  },
  ventas: { crear: invoke('ventas:crear'), listar: invoke('ventas:listar') },
  compras: { crear: invoke('compras:crear') },
  inventario: { ajustar: invoke('inventario:ajustar') },
  gastos: { crear: invoke('gastos:crear'), listar: invoke('gastos:listar') },
  reportes: { mensual: invoke('reportes:mensual') }
})