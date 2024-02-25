import { Condition, Document, MongoClient, ObjectId } from 'mongodb';
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
  query?: { pages: string[] } | { categories: string[] },
): AsyncGenerator<TextChunk> {
  const source = new MongoClient(mongoUrl).db(dbName).collection('pages');
  if (query === undefined) {
    for await (const page of source.find({})) {
      for (const chunk of pageToChunks(page)) {
        yield chunk;
      }
    }
  } else {
    if ('pages' in query) {
      for (let i = 0; i < query.pages.length; i++) {
        const pageName = query.pages[i];
        const page = await source.findOne({
          // dumpster-dive does something weird with ids (or maybe Mongo's TS types are just bad?)
          _id: pageName as unknown as Condition<ObjectId>,
        });
        if (!page) {
          console.warn(
            'Missing page from dump:',
            pageName,
            '(this can happen if page names are from newer dump or live wiki)',
          );
          continue;
        }
        for (const chunk of pageToChunks(page)) {
          chunk.docIndex = i;
          yield chunk;
        }
      }
    } else {
      for await (const page of source.find({ categories: query.categories })) {
        for (const chunk of pageToChunks(page)) {
          yield chunk;
        }
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
      chunks.push({ id: [page, `${sectionIndex}`], text: '' });
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
