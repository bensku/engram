import {
  Collection,
  Condition,
  MongoClient,
  Document as MongoDoc,
  ObjectId,
} from 'mongodb';
import { Document, DocumentStoreService } from '../document';

export class WikipediaStore implements DocumentStoreService {
  private collection: Collection<MongoDoc>;

  constructor(url: string, database: string) {
    this.collection = new MongoClient(url).db(database).collection('pages');
  }

  async get(id: string): Promise<Document | null> {
    const doc = await this.collection.findOne({
      _id: id as unknown as Condition<ObjectId>,
    });
    if (!doc) {
      return null;
    }
    const sections = doc.sections as {
      paragraphs: { sentences: { text: string }[] }[];
    }[];
    return {
      id,
      // Join sentences, then join entire paragraphs to one document string
      sections: sections.map((section) =>
        section.paragraphs
          ?.map((p) => p.sentences.map((sentence) => sentence.text).join(' '))
          .filter((p) => p !== undefined)
          .join('\n\n')
          .trim(),
      ),
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  put(id: string, doc: Document): Promise<void> {
    throw new Error('unsupported operation, use load-wikipedia.sh');
  }
}
