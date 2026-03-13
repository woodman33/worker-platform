import type { Context } from "hono";
import type { Env } from "../types";

function sanitizeIdentifier(identifier: string): string {
	return identifier.replace(/[^a-zA-Z0-9_]/g, "");
}

function sanitizeKeyword(identifier: string): string {
	return "`" + sanitizeIdentifier(identifier) + "`";
}

async function handleGet(
	c: Context<{ Bindings: Env }>,
	tableName: string,
	id?: string,
): Promise<Response> {
	const table = sanitizeKeyword(tableName);
	const searchParams = new URL(c.req.url).searchParams;
	const params: (string | number)[] = [];
	const conditions: string[] = [];
	let query = `SELECT * FROM ${table}`;

	if (id) {
		conditions.push("id = ?");
		params.push(id);
	}

	for (const [key, value] of searchParams.entries()) {
		if (["sort_by", "order", "limit", "offset"].includes(key)) continue;
		conditions.push(`${sanitizeIdentifier(key)} = ?`);
		params.push(value);
	}

	if (conditions.length > 0) {
		query += ` WHERE ${conditions.join(" AND ")}`;
	}

	const sortBy = searchParams.get("sort_by");
	if (sortBy) {
		const order =
			searchParams.get("order")?.toUpperCase() === "DESC" ? "DESC" : "ASC";
		query += ` ORDER BY ${sanitizeIdentifier(sortBy)} ${order}`;
	}

	const limit = searchParams.get("limit");
	if (limit) {
		query += ` LIMIT ?`;
		params.push(parseInt(limit));
		const offset = searchParams.get("offset");
		if (offset) {
			query += ` OFFSET ?`;
			params.push(parseInt(offset));
		}
	}

	const results = await c.env.DB.prepare(query)
		.bind(...params)
		.all();
	return c.json(results);
}

async function handlePost(
	c: Context<{ Bindings: Env }>,
	tableName: string,
): Promise<Response> {
	const table = sanitizeKeyword(tableName);
	const data = await c.req.json();
	if (!data || typeof data !== "object" || Array.isArray(data)) {
		return c.json({ error: "Invalid data format" }, 400);
	}
	const columns = Object.keys(data).map(sanitizeIdentifier);
	const placeholders = columns.map(() => "?").join(", ");
	const query = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;
	const params = Object.values(data);
	await c.env.DB.prepare(query)
		.bind(...params)
		.run();
	return c.json({ message: "Created", data }, 201);
}

async function handleUpdate(
	c: Context<{ Bindings: Env }>,
	tableName: string,
	id: string,
): Promise<Response> {
	const table = sanitizeKeyword(tableName);
	const data = await c.req.json();
	if (!data || typeof data !== "object" || Array.isArray(data)) {
		return c.json({ error: "Invalid data format" }, 400);
	}
	const setColumns = Object.keys(data)
		.map(sanitizeIdentifier)
		.map((col) => `${col} = ?`)
		.join(", ");
	const query = `UPDATE ${table} SET ${setColumns} WHERE id = ?`;
	const params = [...Object.values(data), id];
	await c.env.DB.prepare(query)
		.bind(...params)
		.run();
	return c.json({ message: "Updated", data });
}

async function handleDelete(
	c: Context<{ Bindings: Env }>,
	tableName: string,
	id: string,
): Promise<Response> {
	const table = sanitizeKeyword(tableName);
	await c.env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`)
		.bind(id)
		.run();
	return c.json({ message: "Deleted" });
}

export async function handleRest(
	c: Context<{ Bindings: Env }>,
): Promise<Response> {
	const url = new URL(c.req.url);
	const pathParts = url.pathname.split("/").filter(Boolean);
	if (pathParts.length < 2) {
		return c.json(
			{ error: "Expected format: /rest/{tableName}/{id?}" },
			400,
		);
	}
	const tableName = pathParts[1];
	const id = pathParts[2];

	switch (c.req.method) {
		case "GET":
			return handleGet(c, tableName, id);
		case "POST":
			return handlePost(c, tableName);
		case "PUT":
		case "PATCH":
			if (!id) return c.json({ error: "ID required for updates" }, 400);
			return handleUpdate(c, tableName, id);
		case "DELETE":
			if (!id) return c.json({ error: "ID required for deletion" }, 400);
			return handleDelete(c, tableName, id);
		default:
			return c.json({ error: "Method not allowed" }, 405);
	}
}
