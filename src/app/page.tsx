// Tệp pages/index.tsx hoặc app/page.tsx
import { useState, useEffect } from 'react';
import Head from 'next/head';

interface Result {
  equal: boolean;
  message: string;
  details: string;
}

interface ErrorState {
  json1: boolean;
  json2: boolean;
}

export default function JSONComparator() {
  const [json1, setJson1] = useState<string>('{\n  "name": "John",\n  "age": 30,\n  "city": "New York"\n}');
  const [json2, setJson2] = useState<string>('{\n  "age": 30,\n  "city": "New York",\n  "name": "John"\n}');
  const [result, setResult] = useState<Result>({ equal: false, message: '', details: '' });
  const [error, setError] = useState<ErrorState>({ json1: false, json2: false });

  const validateJSON = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  const compareJSON = () => {
    const isJson1Valid = validateJSON(json1);
    const isJson2Valid = validateJSON(json2);

    setError({
      json1: !isJson1Valid,
      json2: !isJson2Valid,
    });

    if (!isJson1Valid || !isJson2Valid) {
      setResult({
        equal: false,
        message: 'JSON không hợp lệ',
        details:
          (!isJson1Valid ? 'JSON bên trái không hợp lệ. ' : '') +
          (!isJson2Valid ? 'JSON bên phải không hợp lệ.' : ''),
      });
      return;
    }

    const obj1 = JSON.parse(json1);
    const obj2 = JSON.parse(json2);

    const areEqual = deepCompare(obj1, obj2);

    if (areEqual) {
      setResult({
        equal: true,
        message: 'Hai JSON giống nhau về mặt nội dung (bỏ qua thứ tự)',
        details: 'Tất cả các giá trị và cấu trúc đều khớp.',
      });
    } else {
      const differences = findDifferences(obj1, obj2);
      setResult({
        equal: false,
        message: 'Hai JSON khác nhau',
        details: differences,
      });
    }
  };

  const deepCompare = (obj1: any, obj2: any): boolean => {
    if (typeof obj1 !== typeof obj2) {
      return false;
    }

    if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
      return obj1 === obj2;
    }

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) {
        return false;
      }

      if (
        obj1.every((item) => typeof item !== 'object' || item === null) &&
        obj2.every((item) => typeof item !== 'object' || item === null)
      ) {
        const sorted1 = [...obj1].sort();
        const sorted2 = [...obj2].sort();
        return sorted1.every((val, idx) => val === sorted2[idx]);
      }

      for (let i = 0; i < obj1.length; i++) {
        let found = false;
        for (let j = 0; j < obj2.length; j++) {
          if (deepCompare(obj1[i], obj2[j])) {
            found = true;
            break;
          }
        }
        if (!found) return false;
      }
      return true;
    }

    if (Array.isArray(obj1) || Array.isArray(obj2)) {
      return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    return keys1.every((key) => keys2.includes(key) && deepCompare(obj1[key], obj2[key]));
  };

  const findDifferences = (obj1: any, obj2: any, path: string = ''): string => {
    let differences = '';

    if (typeof obj1 !== typeof obj2) {
      return `Kiểu dữ liệu khác nhau tại ${path || 'root'}: ${typeof obj1} vs ${typeof obj2}\n`;
    }

    if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) {
      if (obj1 !== obj2) {
        return `Giá trị khác nhau tại ${path || 'root'}: ${obj1} vs ${obj2}\n`;
      }
      return '';
    }

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) {
        differences += `Độ dài mảng khác nhau tại ${path || 'root'}: ${obj1.length} vs ${obj2.length}\n`;
      }

      const maxLength = Math.max(obj1.length, obj2.length);
      for (let i = 0; i < maxLength; i++) {
        if (i >= obj1.length) {
          differences += `Mảng 1 thiếu phần tử tại vị trí ${i}\n`;
        } else if (i >= obj2.length) {
          differences += `Mảng 2 thiếu phần tử tại vị trí ${i}\n`;
        } else {
          const currPath = path ? `${path}[${i}]` : `[${i}]`;
          differences += findDifferences(obj1[i], obj2[i], currPath);
        }
      }
      return differences;
    }

    if (Array.isArray(obj1) || Array.isArray(obj2)) {
      return `Cấu trúc dữ liệu khác nhau tại ${path || 'root'}: ${Array.isArray(obj1) ? 'Array' : 'Object'} vs ${
        Array.isArray(obj2) ? 'Array' : 'Object'
      }\n`;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    for (const key of keys1) {
      const currPath = path ? `${path}.${key}` : key;
      if (!keys2.includes(key)) {
        differences += `Khóa "${key}" chỉ có trong JSON 1 tại ${path || 'root'}\n`;
      } else {
        differences += findDifferences(obj1[key], obj2[key], currPath);
      }
    }

    for (const key of keys2) {
      if (!keys1.includes(key)) {
        differences += `Khóa "${key}" chỉ có trong JSON 2 tại ${path || 'root'}\n`;
      }
    }

    return differences;
  };

  useEffect(() => {
    compareJSON();
  }, []);

  const formatJSON = (textArea: 1 | 2) => {
    try {
      const jsonString = textArea === 1 ? json1 : json2;
      const formattedJSON = JSON.stringify(JSON.parse(jsonString), null, 2);

      if (textArea === 1) {
        setJson1(formattedJSON);
      } else {
        setJson2(formattedJSON);
      }

      setError((prev) => ({
        ...prev,
        [textArea === 1 ? 'json1' : 'json2']: false,
      }));
    } catch {
      setError((prev) => ({
        ...prev,
        [textArea === 1 ? 'json1' : 'json2']: true,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <Head>
        <title>Công cụ so sánh JSON</title>
        <meta name="description" content="So sánh hai đối tượng JSON bỏ qua thứ tự" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="relative py-3 sm:max-w-5xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-10">
          <h1 className="text-2xl font-bold text-center mb-6">Công cụ so sánh JSON (bỏ qua thứ tự)</h1>

          <div className="flex flex-col md:flex-row gap-4">
            {/* JSON 1 */}
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <h2 className="text-lg font-semibold">JSON 1</h2>
                <button
                  onClick={() => formatJSON(1)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  Format
                </button>
              </div>
              <textarea
                className={`w-full h-64 p-2 border rounded font-mono text-sm ${error.json1 ? 'border-red-500' : 'border-gray-300'}`}
                value={json1}
                onChange={(e) => setJson1(e.target.value)}
                placeholder="Nhập JSON thứ nhất tại đây..."
              />
              {error.json1 && <p className="text-red-500 text-xs mt-1">JSON không hợp lệ</p>}
            </div>

            {/* JSON 2 */}
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <h2 className="text-lg font-semibold">JSON 2</h2>
                <button
                  onClick={() => formatJSON(2)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  Format
                </button>
              </div>
              <textarea
                className={`w-full h-64 p-2 border rounded font-mono text-sm ${error.json2 ? 'border-red-500' : 'border-gray-300'}`}
                value={json2}
                onChange={(e) => setJson2(e.target.value)}
                placeholder="Nhập JSON thứ hai tại đây..."
              />
              {error.json2 && <p className="text-red-500 text-xs mt-1">JSON không hợp lệ</p>}
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={compareJSON}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              So sánh
            </button>
          </div>

          {/* Kết quả */}
          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-semibold mb-3">Kết quả so sánh</h2>
            <div
              className={`p-4 rounded ${result.equal ? 'bg-green-100 border border-green-200' : 'bg-red-100 border border-red-200'}`}
            >
              <p className={`font-bold ${result.equal ? 'text-green-700' : 'text-red-700'}`}>{result.message}</p>
              {result.details && (
                <div className="mt-3">
                  <p className="font-medium mb-1">Chi tiết:</p>
                  <pre className="whitespace-pre-wrap text-sm bg-white p-3 rounded border">{result.details}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
