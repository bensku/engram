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

const App = ({ id }: { id?: string } & RoutableProps) => {
  const currentTopic = id ? parseInt(id) : undefined;
  const [topics, setTopics] = useState<responses['Topic'][]>([]);
  const [engines, setEngines] = useState<responses['ChatEngine'][]>([]);
  const [currentEngine, setCurrentEngine] = useState('default');

  useEffect(() => {
    void (async () => {
      const topicsPromise = listTopics({});
      const enginesPromise = listEngines({});
      setTopics((await topicsPromise).data);
      setEngines((await enginesPromise).data);
    })();
  }, []);

  useEffect(() => {
    if (currentTopic === undefined) {
      setCurrentEngine('default');
    } else {
      void (async () => {
        // TODO do not issue getTopic call twice
        setCurrentEngine((await getTopic({ id: currentTopic })).data.engine);
      })();
    }
  }, [id]);

  const _updateTopic = async (
    newTopic: Partial<responses['Topic']>,
  ): Promise<number> => {
    const topicId = newTopic.id;

    // Update existing topic...
    if (topicId !== undefined) {
      for (let i = 0; i < topics.length; i++) {
        if (topics[i].id == topicId) {
          await updateTopic({ id: topicId, ...newTopic });
          topics.splice(i, 1, { ...topics[i], ...newTopic });
          setTopics([...topics]);
          return topicId;
        }
      }
      throw new Error();
    } else {
      // OR create a new topic
      const details = (
        await createTopic({
          title: newTopic.title,
          engine: currentEngine,
        })
      ).data;
      setTopics([
        {
          id: details.id,
          user: details.user,
          title: newTopic.title ?? '',
          engine: newTopic.engine ?? 'default',
          options: newTopic.options ?? [],
        },
        ...topics,
      ]);
      return details.id;
    }
  };

  const updateEngine = (id: string) => {
    setCurrentEngine(id);
    if (currentTopic !== undefined) {
      void _updateTopic({ id: currentTopic, engine: id });
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

  const engineMap = new Map();
  for (const engine of engines) {
    engineMap.set(engine.id, engine);
  }

  return (
    <>
      <NavBar
        topics={topics}
        currentTopic={currentTopic}
        deleteTopic={_deleteTopic}
      />
      <main>
        {id ? (
          <Topic
            id={parseInt(id)}
            updateTopic={_updateTopic}
            engines={engineMap}
          />
        ) : (
          <EmptyTopic updateTopic={_updateTopic} engines={engineMap} />
        )}
      </main>
      <TopicOptions
        availableEngines={engines}
        setEngine={updateEngine}
        engine={currentEngine}
      />
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
