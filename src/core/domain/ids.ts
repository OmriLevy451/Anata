// src/core/domain/ids.ts

/**
 * A branded string ID type to prevent mixing IDs of different entities.
 * e.g., you can’t accidentally pass a PageID where a BoardID is expected.
 */
export type ID<T extends string = string> = string & { readonly __brand: T };

/** Generate a random unique ID (UUID v4–style). */
export function createId<T extends string = string>(): ID<T> {
  return crypto.randomUUID() as ID<T>;
}

/**
 * Converts any string to a branded ID (use carefully when reading from DB).
 * Example: brandId<"board">(row.id)
 */
export function brandId<T extends string>(value: string): ID<T> {
  return value as ID<T>;
}

/**
 * Type aliases for stronger typing across the domain.
 */
export type BoardID = ID<"board">;
export type PageID = ID<"page">;
export type LayerID = ID<"layer">;
export type ShapeID = ID<"shape">;
export type CommentID = ID<"comment">;
export type UserID = ID<"user">;
