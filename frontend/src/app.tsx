import 'beercss';
import 'highlight.js/styles/stackoverflow-light.css';

import { render } from 'preact';
import { EmptyTopic, Topic } from './component/topic';
import { NavBar } from './component/navbar';
import Router, { RoutableProps } from 'preact-router';
import './layout.css';
import { useEffect } from 'preact/hooks';
import {
  createTopic,
  deleteTopic,
  getTopic,
  listTopics,
  updateTopic,
} from './service/topic';
import { responses } from './types';
import { TopicOptions } from './component/topic-options';
import { listEngines } from './service/engine';
import { currentTopic, engineMap, engines, topics } from './state';
import { SpeechInput } from './component/speech';

const App = ({ id }: { id?: string } & RoutableProps) => {
  useEffect(() => {
    void (async () => {
      const topicsPromise = listTopics({});
      const enginesPromise = listEngines({});
      topics.value = (await topicsPromise).data;
      engines.value = (await enginesPromise).data;
      const map = new Map<string, responses['ChatEngine']>();
      for (const engine of engines.value) {
        map.set(engine.id, engine);
      }
      engineMap.value = map;
    })();
  }, []);

  useEffect(() => {
    if (id !== undefined) {
      void (async () => {
        currentTopic.value = (await getTopic({ id: parseInt(id) })).data;
      })();
    } else {
      currentTopic.value = {};
    }
  }, [id]);

  const _updateTopic = async (
    newTopic: Partial<responses['Topic']>,
    updateServer: 'always' | 'if-exists' | 'never' = 'always',
  ): Promise<number> => {
    currentTopic.value = { ...currentTopic.value, ...newTopic };
    const topicId = currentTopic.value.id;

    // Update existing topic...
    if (topicId !== undefined) {
      for (let i = 0; i < topics.value.length; i++) {
        const topic = topics.value[i];
        if (topic.id == topicId) {
          if (updateServer != 'never') {
            await updateTopic({ id: topicId, ...newTopic });
          }
          topics.value.splice(i, 1, { ...topic, ...newTopic });
          topics.value = [...topics.value];
          return topicId;
        }
      }
      throw new Error(`invalid topicId ${topicId}`);
    } else {
      // OR create a new topic
      if (updateServer != 'always') {
        return -1; // Do not create a topic yet; this is probable someone changing options
      }
      const details = (await createTopic(currentTopic.value)).data;
      topics.value = [
        {
          id: details.id,
          user: details.user,
          title: newTopic.title ?? '',
          engine: newTopic.engine ?? 'default',
          options: newTopic.options ?? {},
        },
        ...topics.value,
      ];
      return details.id;
    }
  };

  const _deleteTopic = (id: number) => {
    void deleteTopic({ id });
    for (let i = 0; i < topics.value.length; i++) {
      if (topics.value[i].id == id) {
        topics.value.splice(i, 1);
        topics.value = [...topics.value];
      }
    }
  };

  return (
    <>
      <NavBar deleteTopic={_deleteTopic} />
      <main>
        {id ? (
          <Topic id={parseInt(id)} updateTopic={_updateTopic} />
        ) : (
          <EmptyTopic updateTopic={_updateTopic} />
        )}
      </main>
      <TopicOptions updateTopic={_updateTopic} />
      <SpeechInput />
    </>
  );
};

render(
  <Router>
    <App path="/:id" />
    <App default />
  </Router>,
  document.getElementById('app') as HTMLElement,
);
