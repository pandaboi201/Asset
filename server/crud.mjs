// Generic CRUD engine that sits directly on top of SQLite.
// Each "resource" describes how to map a flat DB row <-> the nested JSON
// shape the frontend expects (see src/types/index.ts), plus which DB columns
// are searchable/sortable/filterable so it can replicate the same
// search + filter + sort + paginate behaviour the old in-memory mock had.

import { randomUUID } from "node:crypto";
import { db } from "./db.mjs";

/**
 * @param {object} opts
 * @param {string} opts.table
 * @param {string} [opts.idColumn]
 * @param {(row: any) => any} opts.toApi   maps a raw DB row to the API/JSON shape
 * @param {(api: any, existing?: any) => any} opts.toRow  maps API input to a flat DB row (column: value)
 * @param {string[]} opts.insertColumns  full column list used for INSERT (in order)
 * @param {string[]} opts.searchColumns  DB columns scanned for free-text search
 * @param {Record<string,string>} [opts.fieldToColumn] maps API field names (used in sortBy/filters) to DB columns
 * @param {string} [opts.defaultSort]
 */
export function createResource(opts) {
  const {
    table,
    idColumn = "id",
    toApi,
    toRow,
    insertColumns,
    searchColumns = [],
    fieldToColumn = {},
    defaultSort,
  } = opts;

  function resolveColumn(field) {
    return fieldToColumn[field] || field;
  }

  function all() {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    return rows.map(toApi);
  }

  function getById(id) {
    const row = db
      .prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`)
      .get(id);
    return row ? toApi(row) : undefined;
  }

  function query(params = {}) {
    const {
      search,
      page = 1,
      pageSize = 10,
      sortBy,
      sortDir = "asc",
      filters = {},
    } = params;

    const where = [];
    const args = [];

    if (search && String(search).trim()) {
      const q = `%${String(search).trim().toLowerCase()}%`;
      const clauses = searchColumns.map((c) => `LOWER(${c}) LIKE ?`);
      if (clauses.length) {
        where.push(`(${clauses.join(" OR ")})`);
        for (let i = 0; i < clauses.length; i++) args.push(q);
      }
    }

    for (const [field, allowed] of Object.entries(filters || {})) {
      if (allowed == null || (Array.isArray(allowed) && allowed.length === 0)) {
        continue;
      }
      const column = resolveColumn(field);
      const list = Array.isArray(allowed) ? allowed : [allowed];
      where.push(`${column} IN (${list.map(() => "?").join(",")})`);
      args.push(...list);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const totalRow = db
      .prepare(`SELECT COUNT(*) AS c FROM ${table} ${whereSql}`)
      .get(...args);
    const total = totalRow.c;

    let orderSql = "";
    const sortField = sortBy || defaultSort;
    if (sortField) {
      const column = resolveColumn(sortField);
      const dir = sortDir === "desc" ? "DESC" : "ASC";
      orderSql = `ORDER BY ${column} ${dir}`;
    }

    const offset = (Math.max(1, page) - 1) * pageSize;
    const rows = db
      .prepare(`SELECT * FROM ${table} ${whereSql} ${orderSql} LIMIT ? OFFSET ?`)
      .all(...args, pageSize, offset);

    return { data: rows.map(toApi), total, page, pageSize };
  }

  function create(input) {
    const id = input.id || randomUUID();
    const row = toRow({ ...input, id });
    const columns = insertColumns;
    const placeholders = columns.map(() => "?").join(", ");
    db.prepare(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
    ).run(...columns.map((c) => (row[c] === undefined ? null : row[c])));
    return getById(id);
  }

  function update(id, patch) {
    const existingRow = db
      .prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`)
      .get(id);
    if (!existingRow) return undefined;
    const existingApi = toApi(existingRow);
    const merged = { ...existingApi, ...patch, id };
    const row = toRow(merged, existingRow);
    const columns = insertColumns.filter((c) => c !== idColumn);
    const setSql = columns.map((c) => `${c} = ?`).join(", ");
    db.prepare(`UPDATE ${table} SET ${setSql} WHERE ${idColumn} = ?`).run(
      ...columns.map((c) => (row[c] === undefined ? null : row[c])),
      id,
    );
    return getById(id);
  }

  function remove(id) {
    db.prepare(`DELETE FROM ${table} WHERE ${idColumn} = ?`).run(id);
    return { id };
  }

  return { all, query, getById, create, update, remove };
}

export { db };
