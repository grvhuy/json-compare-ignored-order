import { NextResponse } from "next/server";

type ColumnItem = {
  columnName: string;
  value: string;
};

type RowData = {
  row1: ColumnItem[];
};

function toMap(data: RowData): Map<string, string> {
  const map = new Map<string, string>();
  data.row1.forEach(item => {
    map.set(item.columnName, item.value);
  });
  return map;
}

export async function POST(req: Request) {
  const body = await req.json();
  const json1: RowData = body.json1;
  const json2: RowData = body.json2;

  const map1 = toMap(json1);
  const map2 = toMap(json2);

  const diffs: { columnName: string; json1Value?: string; json2Value?: string }[] = [];

  const allKeys = new Set([...map1.keys(), ...map2.keys()]);

  allKeys.forEach(key => {
    const val1 = map1.get(key);
    const val2 = map2.get(key);

    if (val1 !== val2) {
      diffs.push({
        columnName: key,
        json1Value: val1,
        json2Value: val2,
      });
    }
  });

  if (diffs.length === 0) {
    return NextResponse.json({ ok: true });
  } else {
    return NextResponse.json({ ok: false, diffs });
  }
}
