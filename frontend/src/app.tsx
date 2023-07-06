import 'beercss';
import 'highlight.js/styles/stackoverflow-light.css';

import { render } from 'preact';
import { EmptyTopic, Topic } from './component/topic';
import { SideBar } from './component/sidebar';
import Router, { RoutableProps } from 'preact-router';
import './layout.css';
import { useEffect, useState } from 'preact/hooks';
import { listTopics } from './service/topic';
import { responses } from './types';

const App = ({ id }: { id?: string } & RoutableProps) => {
  const [topics, setTopics] = useState<responses['Topic'][]>([]);

  useEffect(() => {
    void (async () => {
      setTopics((await listTopics({})).data);
    })();
  }, []);
  // TODO do not update topic list each time topic is changed?

  const updateTopic = (
    topicId: number,
    newTopic: Partial<responses['Topic']>,
  ) => {
    for (let i = 0; i < topics.length; i++) {
      if (topics[i].id == topicId) {
        topics.splice(i, 1, { ...topics[i], ...newTopic });
        setTopics([...topics]);
        return;
      }
    }
    // TODO user = current user
    setTopics([
      ...topics,
      { id: topicId, user: -1, title: newTopic.title ?? '' },
    ]);
  };

  return (
    <>
      <SideBar topics={topics} currentTopic={id ? parseInt(id) : -1} />
      <main>
        {id ? (
          <Topic id={parseInt(id)} updateSidebar={updateTopic} />
        ) : (
          <EmptyTopic updateSidebar={updateTopic} />
        )}
      </main>
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
