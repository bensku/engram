interface ReadResult {
  done: boolean;
  value?: Uint8Array;
}

interface StreamReader {
  read(): Promise<ReadResult>;
  releaseLock(): void;
}

const CR = '\r'.charCodeAt(0);
const LF = '\n'.charCodeAt(0);

export async function* readLines(reader: StreamReader) {
  let data = new Uint8Array();
  let linebreakOffset = 0;

  const decoder = new TextDecoder('utf-8');
  const lines = function* () {
    for (let i = 0; i < data.length; i++) {
      const c = data.at(i);
      if (c == CR || c == LF) {
        const text = decoder.decode(data.slice(linebreakOffset, i));
        linebreakOffset = i + 1;
        yield text;
      }
    }
  };

  for (;;) {
    const { value } = await reader.read();
    if (!value) {
      break;
    }
    const newData = new Uint8Array(
      data.length - linebreakOffset + value.length,
    );
    newData.set(data.slice(linebreakOffset), 0);
    newData.set(value, data.length - linebreakOffset);
    data = newData;

    linebreakOffset = 0;
    for (const line of lines()) {
      yield line;
    }
  }

  // Final line
  if (data.length > 0) {
    yield decoder.decode(data);
  }
}
