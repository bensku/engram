import { getTool } from '../../tool/core';
import { registerEngine } from '../engine';
import { MODEL, PROMPT, TEMPERATURE } from '../options';

registerEngine(
  'default',
  'Default',
  MODEL.create({
    defaultValue: 'openai:gpt-3.5-turbo',
    choices: [
      { value: 'openai:gpt-3.5-turbo', title: 'GPT-3.5 (default)' },
      { value: 'openai:gpt-4', title: 'GPT-4' },
      { value: 'bedrock:claude-instant-v1', title: 'Claude Instant' },
      { value: 'bedrock:claude-v2', title: 'Claude 2' },
      { value: 'engram:amalgam', title: 'Amalgam' },
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
      'engram:amalgam': [
        'You are Spark, a friendly and helpful AI chat bot. Please be brief in your replies unless I ask otherwise.',
      ], // TODO improve this, somehow?
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
    defaultValue: true,
    userEditable: true,
  }),
  getTool('online_search').enableOption.create({
    defaultValue: true,
    userEditable: true,
  }),
  getTool('weather_forecast').enableOption.create({
    defaultValue: true,
    userEditable: true,
  }),
);
