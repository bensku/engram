import { qdrantSearch } from '../../service/impl/qdrant';
import { getTool } from '../../tool/core';
import { registerEngine } from '../engine';
import { applyGrounding } from '../grounding';
import { MODEL, PROMPT, TEMPERATURE } from '../options';
import { searchDataSource } from '../search';
import { wrapVectorSearch } from '../../service/embedding';
import { openAIEmbeddings } from '../../service/impl/openai';
import { WikipediaStore } from '../../service/impl/mongodb';
import { cohereRerankings } from '../../service/impl/cohere';

const engine = registerEngine(
  'default',
  'Curious',
  MODEL.create({
    defaultValue: 'openai:gpt-3.5-turbo',
    choices: [
      { value: 'openai:gpt-3.5-turbo', title: 'GPT-3.5 (default)' },
      { value: 'openai:gpt-4', title: 'GPT-4' },
      { value: 'anyscale:mixtral-8x7', title: 'Mixtral 8x7B' },
      { value: 'bedrock:claude-instant-v1', title: 'Claude Instant' },
      { value: 'bedrock:claude-v2', title: 'Claude 2' },
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
        `You are Spark, a friendly and helpful AI assistant. You are talking with a trusted human user; your main task is to help them make informed decisions.
    
    Some ground rules:
    * If you make a mistake, there is no need to apologize - just fix it and move on
    * When you are not sure about something, TELL the user about this!
    * If you truly don't know something, that is ok - again, tell the user
    
    The user may consult you about VERY IMPORTANT matters. Do your best job!`,
      ],
    },
  }),
  getTool('wolfram_alpha').enableOption.create({
    defaultValue: false,
    userEditable: true,
  }),
  getTool('online_search').enableOption.create({
    defaultValue: false,
    userEditable: true,
  }),
  getTool('weather_forecast').enableOption.create({
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
    'Represent this sentence for searching relevant passages:',
  );
  engine.preHandlers = [
    applyGrounding(
      [searchDataSource('enwiki', wikipedia, 0.7, 10)],
      {
        enwiki: new WikipediaStore('mongodb://echo.benjami.fi', 'enwiki'),
      },
      rerankSvc,
    ),
  ];
}
