export interface ParsedRow {
  index: number;
  testName: string;
  resultValue: string;
  comments: string;
}

function splitSmart(line: string): string[] {
  if (line.includes('\t')) return line.split('\t').map((c) => c.trim());
  return line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
}

export function parseResultText(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const firstCols = splitSmart(lines[0]).map((c) => c.toLowerCase());
  const hasHeader =
    firstCols.some((c) => c.includes('test') || c.includes('name') || c.includes('param'));
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line, i) => {
    const cols = splitSmart(line);
    if (cols.length === 1) {
      return { index: i, testName: '', resultValue: cols[0], comments: '' };
    }
    if (cols.length === 2) {
      return { index: i, testName: cols[0], resultValue: cols[1], comments: '' };
    }
    return {
      index: i,
      testName: cols[0],
      resultValue: cols[1],
      comments: cols.slice(2).join(' '),
    };
  });
}

export function matchParsedToTestCases(
  parsed: ParsedRow[],
  testCases: Array<{ id: string; name: string }>
): Record<string, { resultValue: string; comments: string }> {
  const result: Record<string, { resultValue: string; comments: string }> = {};

  parsed.forEach((row) => {
    const byName = row.testName
      ? testCases.find((tc) =>
          tc.name.toLowerCase().includes(row.testName.toLowerCase()) ||
          row.testName.toLowerCase().includes(tc.name.toLowerCase())
        )
      : null;

    const tc = byName ?? testCases[row.index];
    if (tc) {
      result[tc.id] = { resultValue: row.resultValue, comments: row.comments };
    }
  });

  return result;
}

export function generateResultTemplate(
  testCases: Array<{ name: string; unit: string; specification: string }>
): string {
  const header = 'Test Name,Result Value,Unit,Specification,Comments';
  const rows = testCases.map((tc) =>
    `"${tc.name}","","${tc.unit ?? ''}","${tc.specification ?? ''}",""`
  );
  return [header, ...rows].join('\n');
}
