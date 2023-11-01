import 'beercss';
import 'highlight.js/styles/stackoverflow-light.css';

import { render } from 'preact';
import { EmptyTopic, Topic } from './component/topic';
import { NavBar } from './component/navbar';
import Router, { RoutableProps } from 'preact-router';
import './layout.css';
import { useEffect, useState } from 'preact/hooks';
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
import { currentTopic, engineMap, engines } from './state';

const App = ({ id }: { id?: string } & RoutableProps) => {
  const [topics, setTopics] = useState<responses['Topic'][]>([]);

  useEffect(() => {
    void (async () => {
      const topicsPromise = listTopics({});
      const enginesPromise = listEngines({});
      setTopics((await topicsPromise).data);
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
      for (let i = 0; i < topics.length; i++) {
        if (topics[i].id == topicId) {
          if (updateServer != 'never') {
            await updateTopic({ id: topicId, ...newTopic });
          }
          topics.splice(i, 1, { ...topics[i], ...newTopic });
          setTopics([...topics]);
          return topicId;
        }
      }
      throw new Error();
    } else {
      // OR create a new topic
      if (updateServer != 'always') {
        return -1; // Do not create a topic yet; this is probable someone changing options
      }
      const details = (await createTopic(currentTopic.value)).data;
      setTopics([
        {
          id: details.id,
          user: details.user,
          title: newTopic.title ?? '',
          engine: newTopic.engine ?? 'default',
          options: newTopic.options ?? {},
        },
        ...topics,
      ]);
      return details.id;
    }
  };

  const _deleteTopic = (id: number) => {
    void deleteTopic({ id });
    for (let i = 0; i < topics.length; i++) {
      if (topics[i].id == id) {
        topics.splice(i, 1);
        setTopics([...topics]);
      }
    }
  };

  return (
    <>
      <NavBar topics={topics} deleteTopic={_deleteTopic} />
      <main>
        {id ? (
          <Topic id={parseInt(id)} updateTopic={_updateTopic} />
        ) : (
          <EmptyTopic updateTopic={_updateTopic} />
        )}
      </main>
      <TopicOptions updateTopic={_updateTopic} />
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
