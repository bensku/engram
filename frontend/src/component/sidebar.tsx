import { route } from 'preact-router';
import { deleteTopic } from '../service/topic';
import { responses } from '../types';

export const SideBar = ({
  topics,
  currentTopic,
}: {
  topics: responses['Topic'][];
  currentTopic: number;
}) => {
  return (
    <nav class="small-padding surface-variant">
      <UserCard />
      <NewTopicButton />
      <TopicList topics={topics} currentTopic={currentTopic} />
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

const TopicList = ({
  topics,
  currentTopic,
}: {
  topics: responses['Topic'][];
  currentTopic: number;
}) => {
  // TODO highlight current topic
  return (
    <>
      {topics.map((topic) => (
        <TopicEntry
          key={topic.id}
          topic={topic}
          isCurrent={topic.id == currentTopic}
        />
      ))}
    </>
  );
};

const TopicEntry = ({
  topic,
  isCurrent,
}: {
  topic: responses['Topic'];
  isCurrent: boolean;
}) => {
  const deleteThis = () => {
    void (async () => {
      await deleteTopic({ id: topic.id });
      if (isCurrent) {
        route('/');
      }
    })();
  };

  let styles = 'row no-margin no-padding no-space surface-variant primary-text';
  if (isCurrent) {
    styles += ' fill';
  }
  return (
    <button key={topic.id} class={styles} onClick={() => route(`/${topic.id}`)}>
      <i class="small-padding">chat</i>
      <div class="max left-align truncate">{topic.title}</div>
      <button class="transparent circle front" onClick={deleteThis}>
        <i class="no-padding">delete</i>
        <div class="tooltip">Delete topic</div>
      </button>
    </button>
  );
};
