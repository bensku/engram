import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { listTopics } from '../service/topic';
import { responses } from '../types';

export const SideBar = () => {
  return (
    <nav
      class="fixed vertical small-padding surface-variant"
      style={{ width: '22em', alignItems: 'stretch' }}
    >
      <UserCard />
      <NewTopicButton />
      <TopicList />
      <div class="spacer" style={'height: 100vh;'} />
    </nav>
  );
};

const UserCard = () => {
  return (
    <article class="row secondary-container top-align">
      <div class="large-text">bensku</div>
      <div class="spacer max" />
      <button class="transparent circle">
        <i>settings</i>
        <div class="tooltip">Settings</div>
      </button>
      <button class="transparent circle">
        <i class="error-text">logout</i>
        <div class="tooltip">Logout</div>
      </button>
    </article>
  );
};

const NewTopicButton = () => {
  const newTopic = () => {
    // Topic is actually created when first message is sent!
    route('/');
  };

  return (
    <button
      class="border row small-padding surface-variant primary-text"
      onClick={newTopic}
    >
      <i>add</i>
      New topic
    </button>
  );
};

const TopicList = () => {
  const [topics, setTopics] = useState<responses['Topic'][]>([]);

  useEffect(() => {
    void (async () => {
      setTopics((await listTopics({})).data);
    })();
  }, []);

  return (
    <div class="vertical">
      {topics.map((topic) => (
        <button
          key={topic.id}
          class="row no-margin no-padding no-space surface-variant primary-text"
          onClick={() => route(`/${topic.id}`)}
        >
          <i class="small-padding">chat</i>
          <div class="max left-align truncate">{topic.title}</div>
          <button class="transparent circle front">
            <i class="no-padding">delete</i>
            <div class="tooltip">Delete topic</div>
          </button>
        </button>
      ))}
    </div>
  );
};
