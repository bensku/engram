import { Document, MongoClient } from 'mongodb';
import { TextChunk } from './api';

/**
 * Reads wikipedia dump produced by dumpster-dive and splits them into chunks.
 * The chunking respects paragraph boundaries and tries to respect section
 * boundaries whenever possible. Streaming is used, so memory usage should be
 * very reasonable.
 * @param mongoUrl Connection string for MongoDB instance where the
 * data is stored.
 * @param dbName Database name, e.g. enwiki.
 * @param pages List of pages to read. If undefined, reads ALL pages.
 */
export async function* wikipediaSource(
  mongoUrl: string,
  dbName: string,
  pages?: string[],
): AsyncGenerator<TextChunk> {
  const source = new MongoClient(mongoUrl).db(dbName).collection('pages');
  if (pages === undefined) {
    for await (const page of source.find({})) {
      for (const chunk of pageToChunks(page)) {
        yield chunk;
      }
    }
  } else {
    for (const pageName of pages) {
      const page = source.findOne({ _id: { equals: pageName } });
      for (const chunk of pageToChunks(page)) {
        yield chunk;
      }
    }
  }
}

interface Paragraph {
  sentences: { text: string }[];
}
interface Section {
  title: string;
  paragraphs: Paragraph[];
}

const CHUNK_MAX_WORDS = 350; // TODO configurable?

function sectionToChunks(page: string, sectionIndex: number, section: Section) {
  const chunks: TextChunk[] = [];
  let lastWords = Number.MAX_SAFE_INTEGER;
  for (const paragraph of section.paragraphs ?? []) {
    const text = paragraph.sentences.map((sentence) => sentence.text).join(' ');
    const words = text.split(' ').length;

    // Check if the currently processed chunk can have more text added to it
    if (lastWords + words > CHUNK_MAX_WORDS) {
      // It can't -> new chunk
      chunks.push({ id: `${page}.${sectionIndex}`, text: '' });
      lastWords = 0;
    }
    // Append to chunk
    chunks[chunks.length - 1].text += '\n\n' + text;
  }

  // Filter empty chunks out, just in case
  return chunks.filter((chunk) => chunk.text.trim() != '');
}

function pageToChunks(page: Document): TextChunk[] {
  const pageId = page._id as string;
  const sections = page.sections as Section[];
  return sections.flatMap((section, i) => sectionToChunks(pageId, i, section));
}
