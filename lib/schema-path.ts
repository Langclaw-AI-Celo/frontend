export type SchemaPathSegment = {
  isParameter: boolean;
  value: string;
};

export function splitSchemaPath(path: string): SchemaPathSegment[] {
  const segments: SchemaPathSegment[] = [];
  let cursor = 0;

  for (const match of path.matchAll(/\{[^}]+\}/g)) {
    const start = match.index;

    if (start > cursor) {
      segments.push({
        isParameter: false,
        value: path.slice(cursor, start),
      });
    }

    segments.push({ isParameter: true, value: match[0] });
    cursor = start + match[0].length;
  }

  if (cursor < path.length || segments.length === 0) {
    segments.push({ isParameter: false, value: path.slice(cursor) });
  }

  return segments;
}
