import { JSONSchemaType } from 'ajv';
import { Message, appendText, extractText } from '../../service/message';
import { newAnalyzer } from '../analyzer';
import { GenerateCallback, GenerateContext } from '../pipeline';
import { batchCompletionsForModel } from '../../service/completion';
import { MODEL, OptionType, ToggleOption } from '../options';
import {
  Document,
  DocumentId,
  DocumentStoreService,
} from '../../service/document';
import { RerankService } from '../../service/rerank';

export type QueryType = 'question' | 'keyword_query' | 'hyde_answer';

/**
 * Data source that provides (hopefully) factual information for 'grounding'
 * LLM answers in reality.
 */
export type GroundDataSource = (
  query: string,
  kind: QueryType,
) => Promise<HitList>;

export type HitList =
  | { type: 'idList'; ids: DocumentId[] }
  | { type: 'chunkList'; chunks: string[] };

export function applyGrounding(
  sources: {
    source: GroundDataSource;
    enableOption?: OptionType<ToggleOption>;
  }[],
  documentStores: Record<string, DocumentStoreService>,
  rerankSvc: RerankService,
): GenerateCallback {
  return async (ctx) => {
    // Generate various kinds of search queries
    const [question, query, hydeAnswer] = await Promise.all([
      generateQuestion(ctx.context),
      generateQuery(ctx.context),
      generateHydeAnswer(ctx),
    ]);

    // Enable only sources for which the option does not exist or is enabled
    const enabledSources = sources
      .filter((src) => !src.enableOption || src.enableOption?.get(ctx))
      .map((src) => src.source);

    const questionResults = enabledSources.map((source) =>
      source(question, 'question'),
    );
    const queryResults = enabledSources.map((source) =>
      source(query, 'keyword_query'),
    );
    const hydeResults = enabledSources.map((source) =>
      source(hydeAnswer, 'hyde_answer'),
    );

    // Execute all queries in parallel
    const hits = (
      await Promise.all([...questionResults, ...queryResults, ...hydeResults])
    ).flat();

    // Find ids of all documents; stringify and put them into Set for deduplication
    const documentIds = new Set(
      hits
        .map((hit) => (hit.type == 'idList' ? hit.ids : []))
        .flat()
        // Only consider the document part of id!
        .map((id) => id.slice(0, 2).join('|')),
    );

    // Get all required documents in parallel (but each only once)
    const documents = new Map<string, Document>();
    (
      await Promise.all(
        [...documentIds]
          .map((id) => id.split('|'))
          .map((id) => documentStores[id[0]].get(id[1])),
      )
    )
      .filter((doc) => !!doc)
      .forEach((doc) => documents.set(doc!.id, doc!));

    // Combine all results together (in more or less random order)
    const results = hits
      .map((hit) => {
        if (hit.type == 'idList') {
          return hit.ids.map(
            (id) =>
              documents.get(id.slice(0, 2).join('|'))?.sections[
                parseInt(id[2])
              ],
          );
        } else {
          return hit.chunks;
        }
      })
      .flat()
      .filter((res) => !!res) as string[];

    if (results.length == 0) {
      // No results
      appendText(
        ctx.context[0],
        `\n\nYou do not know anything about "${query}". Let the user know this if they ask about it.`,
      );
      return;
    }

    // Rerank results!
    const rerankedResults = await rerankSvc(results, question);

    // Inject top 3 results into system prompt
    const includedResults = rerankedResults.splice(0, 3).join('\n\n');
    appendText(
      ctx.context[0],
      `\n\nYou know the following about the topic "${query}":
${includedResults}
---
Use this and ONLY this to answer the user's question!`,
    );
  };
}

const QUESTION_SCHEMA: JSONSchemaType<{ question: string }> = {
  type: 'object',
  properties: {
    question: {
      type: 'string',
      description: 'Question for a human expert',
    },
  },
  required: ['question'],
};

const QUESTION_GENERATOR = newAnalyzer(
  'together:mixtral-8x7',
  `Please rephrase user's LAST message as a self-contained question that a librarian or another researcher could answer.`,
  QUESTION_SCHEMA,
);

async function generateQuestion(ctx: Message[]) {
  // TODO implement parts -> text conversion (explain images to models that don't natively understand them)
  const text = `Below is an excerpt from a conversation between a user and a research AI assistant:

${ctx
  .filter((msg) => msg.type == 'bot' || msg.type == 'user')
  .filter((msg) => extractText(msg))
  .map((msg) =>
    msg.type == 'user'
      ? `User: ${extractText(msg)}`
      : `Assistant: ${extractText(msg) ?? ''}`,
  )
  .join('\n\n')}`;
  const reply = await QUESTION_GENERATOR(text);
  return reply.question;
}

const QUERY_SCHEMA: JSONSchemaType<{ query: string }> = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: 'Query for a search engine',
    },
  },
  required: ['query'],
};

const QUERY_GENERATOR = newAnalyzer(
  'together:mixtral-8x7',
  `Please write a search query based on user's LAST message. Write a keyword search query, not full sentences!`,
  QUERY_SCHEMA,
);

async function generateQuery(ctx: Message[]) {
  const text = `Below is an excerpt from a conversation between a user and a research AI assistant:

${ctx
  .filter((msg) => msg.type == 'bot' || msg.type == 'user')
  .filter((msg) => extractText(msg))
  .map((msg) =>
    msg.type == 'user'
      ? `User: ${extractText(msg)}`
      : `Assistant: ${extractText(msg) ?? ''}`,
  )
  .join('\n\n')}`;
  const reply = await QUERY_GENERATOR(text);
  return reply.query;
}

async function generateHydeAnswer(ctx: GenerateContext) {
  const messages = [...ctx.context];
  appendText(
    messages[0],
    `You are a precise yet helpful AI assistant. Please be brief in your answers. If you don't know something, feel free to guess!`,
  );
  const completions = batchCompletionsForModel(MODEL.getOrThrow(ctx));
  return await completions(ctx.context, {
    maxTokens: 200,
  });
}
