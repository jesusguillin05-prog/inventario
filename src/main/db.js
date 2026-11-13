import { app } from 'electron'
import { join } from 'path'
import { schema } from './schema.js'

// getBuiltinModule evita que el empaquetador intente resolver 'node:sqlite'
const { DatabaseSync } = process.getBuiltinModule('node:sqlite')

let db

export function initDb() {
  const file = join(app.getPath('userData'), 'inventario.db')
  db = new DatabaseSync(file)
  db.exec('PRAGMA busy_timeout = 5000') // espera hasta 5 s si la BD está ocupada
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(schema)

  const rows = db.prepare('SELECT id, sku FROM productos WHERE sku IS NOT NULL ORDER BY id').all()
  const seen = new Set()

  for (const row of rows) {
    const cleanSku = String(row.sku ?? '').trim()
    if (!cleanSku) {
      db.prepare('UPDATE productos SET sku = NULL WHERE id = ?').run(row.id)
      continue
    }

    if (seen.has(cleanSku)) {
      db.prepare('UPDATE productos SET sku = NULL WHERE id = ?').run(row.id)
      continue
    }

    seen.add(cleanSku)
  }

  return db
}

export const getDb = () => db

// Reemplazo de db.transaction(): si algo falla, se revierte todo
export function transaction(fn) {
  return (...args) => {
    db.exec('BEGIN')
    try {
      const result = fn(...args)
      db.exec('COMMIT')
      return result
    } catch (e) {
      db.exec('ROLLBACK')
      throw e
    }
  }
}