import { JSONSchemaType } from 'ajv';
import { Message } from '../service/message';
import { newAnalyzer } from './analyzer';
import { GenerateCallback, GenerateContext } from './pipeline';
import { batchCompletionsForModel } from '../service/completion';
import { MODEL } from './options';
import { DocumentId } from '../service/document';

/**
 * Data source that provides (hopefully) factual information for 'grounding'
 * LLM answers in reality.
 */
export type GroundDataSource = (query: string) => Promise<DocumentId[]>;

export function applyGrounding(
  ...sources: GroundDataSource[]
): GenerateCallback {
  return async (ctx) => {
    // Generate various kinds of search queries
    const [question, query, hydeAnswer] = await Promise.all([
      generateQuestion(ctx.context),
      generateQuery(ctx.context),
      generateHydeAnswer(ctx),
    ]);
    console.log('question', question);
    console.log('query', query);
    console.log('hyde', hydeAnswer);

    const questionResults = sources.map((source) => source(question));
    const queryResults = sources.map((source) => source(query));

    // Execute queries in parallel, flatten results to one array and de-duplicate them
    const allResults = new Set(
      (await Promise.all([...questionResults, ...queryResults])).flat(),
    );
    console.log(allResults);

    // Fetch results from document stores using dataset ids
    // We do this here to avoid fetching duplicate results more than once
    // TODO

    // Generate an answer
    // TODO how? directly feed to results to context window? extract relevant details using separate pass?
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
  `Please rephrase user's last message as a self-contained question that a librarian or another researcher could answer.`,
  QUESTION_SCHEMA,
);

async function generateQuestion(ctx: Message[]) {
  const text = `Below is an excerpt from a conversation between a user and a research AI assistant:

${ctx
  .filter((msg) => msg.type == 'bot' || msg.type == 'user')
  .filter((msg) => msg.text)
  .map((msg) =>
    msg.type == 'user' ? `User: ${msg.text}` : `Assistant: ${msg.text ?? ''}`,
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
  'together:mistral-7b-v1',
  `Please write a search query based on user's last message. Write a keyword search query, not full sentences!`,
  QUERY_SCHEMA,
);

async function generateQuery(ctx: Message[]) {
  const text = `Below is an excerpt from a conversation between a user and a research AI assistant:

${ctx
  .filter((msg) => msg.type == 'bot' || msg.type == 'user')
  .filter((msg) => msg.text)
  .map((msg) =>
    msg.type == 'user' ? `User: ${msg.text}` : `Assistant: ${msg.text ?? ''}`,
  )
  .join('\n\n')}`;
  const reply = await QUERY_GENERATOR(text);
  return reply.query;
}

async function generateHydeAnswer(ctx: GenerateContext) {
  const messages = ctx.context;
  messages[0].text = `You are a precise yet helpful AI assistant. Please be brief in your answers. If you don't know something, feel free to guess!`;
  const completions = batchCompletionsForModel(MODEL.getOrThrow(ctx));
  return await completions(ctx.context, {
    maxTokens: 200,
  });
}
