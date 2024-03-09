import { qdrantSearch } from '../../service/impl/qdrant';
import { registerEngine } from '../engine';
import { applyGrounding } from '../grounding/hook';
import {
  MODEL,
  OptionType,
  PROMPT,
  TEMPERATURE,
  ToggleOption,
} from '../options';
import { anotherLlmSource, searchDataSource } from '../grounding/search';
import { wrapVectorSearch } from '../../service/embedding';
import { openAIEmbeddings } from '../../service/impl/openai';
import { WikipediaStore } from '../../service/impl/mongodb';
import { cohereRerankings } from '../../service/impl/cohere';
import { wolframAlphaDataSource } from '../grounding/wolfram-alpha';

const GROUND_WIKIPEDIA = new OptionType<ToggleOption>(
  'toggle',
  'ground.wikipedia',
  'Ground: Wikipedia 50k',
);
const GROUND_WOLFRAM = new OptionType<ToggleOption>(
  'toggle',
  'ground.wolfram',
  'Ground: Wolfram Alpha',
);
const GROUND_PERPLEXITY = new OptionType<ToggleOption>(
  'toggle',
  'ground.perplexity',
  'Ground: Perplexity',
);

const engine = registerEngine(
  'default',
  'Curious',
  MODEL.create({
    defaultValue: 'openai:gpt-3.5-turbo',
    choices: [
      { value: 'openai:gpt-3.5-turbo', title: 'GPT-3.5 (default)' },
      { value: 'openai:gpt-4', title: 'GPT-4' },
      { value: 'anthropic:claude-3-sonnet', title: 'Claude 3 Sonnet' },
      { value: 'anthropic:claude-3-opus', title: 'Claude 3 Opus' },
      { value: 'anyscale:mixtral-8x7', title: 'Mixtral 8x7B' },
      { value: 'engram:multi-step', title: 'Multi-step (Mixtral)' },
    ],
    userEditable: true,
  }),
  TEMPERATURE.create({
    defaultValue: 0.3,
    start: 0,
    end: 1,
    userEditable: true,
  }),
  PROMPT.create({
    defaultValue: {
      // TODO improve this, somehow?
      'engram:multi-step': [
        'You are Spark, a friendly and helpful AI chat bot. Please be brief in your replies unless I ask otherwise.',
      ],
      default: [
        `You are Spark, a friendly and helpful AI assistant. Your main task is to help a curious human user to learn new things, and to help them make informed decisions.
    
    Some ground rules:
    * If you make a mistake, there is no need to apologize - just fix it and move on
    * When you are not sure about something, TELL the user about this!
    * If you truly don't know something, that is ok - again, tell the user
    
    The user may consult you about VERY IMPORTANT matters. Do your best job!`,
      ],
    },
  }),
  GROUND_WIKIPEDIA.create({
    defaultValue: true,
    userEditable: true,
  }),
  GROUND_WOLFRAM.create({
    defaultValue: true,
    userEditable: true,
  }),
  GROUND_PERPLEXITY.create({
    defaultValue: false,
    userEditable: true,
  }),
);

const QDRANT_API_URL = process.env.QDRANT_API_URL;
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const COHERE_API_KEY = process.env.COHERE_API_KEY;

if (QDRANT_API_URL && TOGETHER_API_KEY && COHERE_API_KEY) {
  // TODO don't hardcode for specific model or Together (or Cohere) API
  const rerankSvc = cohereRerankings(COHERE_API_KEY, 'rerank-english-v2.0');
  const wikipedia = wrapVectorSearch(
    openAIEmbeddings(
      'https://api.together.xyz/v1',
      TOGETHER_API_KEY,
      'WhereIsAI/UAE-Large-V1',
    ),
    qdrantSearch(QDRANT_API_URL, 'enwiki'),
  );
  engine.preHandlers = [
    applyGrounding(
      [
        // Search wikipedia; use retrieval prefix for all non-hyde queries
        {
          source: searchDataSource(
            'enwiki',
            wikipedia,
            0.7,
            10,
            (query, kind) =>
              kind != 'hyde_answer'
                ? `Represent this sentence for searching relevant passages: ${query}`
                : query,
          ),
          enableOption: GROUND_WIKIPEDIA,
        },
        // Also send queries to Wolfram Alpha
        { source: wolframAlphaDataSource(), enableOption: GROUND_WOLFRAM },
        {
          source: anotherLlmSource('perplexity:sonar-medium-online'),
          enableOption: GROUND_PERPLEXITY,
        },
      ],
      {
        enwiki: new WikipediaStore('mongodb://echo.benjami.fi', 'enwiki'),
      },
      rerankSvc,
    ),
  ];
}
