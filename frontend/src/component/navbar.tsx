import { route } from 'preact-router';
import { deleteTopic } from '../service/topic';
import { responses } from '../types';

export const NavBar = ({
  topics,
  currentTopic,
  deleteTopic,
}: {
  topics: responses['Topic'][];
  currentTopic: number;
  deleteTopic: (id: number) => void;
}) => {
  return (
    <nav class="small-padding surface-variant">
      <UserCard />
      <NewTopicButton />
      <TopicList
        topics={topics}
        currentTopic={currentTopic}
        deleteTopic={deleteTopic}
      />
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
  deleteTopic,
}: {
  topics: responses['Topic'][];
  currentTopic: number;
  deleteTopic: (id: number) => void;
}) => {
  // TODO highlight current topic
  return (
    <>
      {topics.map((topic) => (
        <TopicEntry
          key={topic.id}
          topic={topic}
          isCurrent={topic.id == currentTopic}
          deleteThis={() => deleteTopic(topic.id)}
        />
      ))}
    </>
  );
};

const TopicEntry = ({
  topic,
  isCurrent,
  deleteThis,
}: {
  topic: responses['Topic'];
  isCurrent: boolean;
  deleteThis: () => void;
}) => {
  const _delete = () => {
    deleteThis();
    if (isCurrent) {
      setTimeout(() => route('/'), 100);
    }
  };

  let styles = 'row no-margin no-padding no-space surface-variant primary-text';
  if (isCurrent) {
    styles += ' fill';
  }
  return (
    <button key={topic.id} class={styles} onClick={() => route(`/${topic.id}`)}>
      <i class="small-padding">chat</i>
      <div class="max left-align truncate">{topic.title}</div>
      <button class="transparent circle front" onClick={_delete}>
        <i class="no-padding">delete</i>
        <div class="tooltip">Delete topic</div>
      </button>
    </button>
  );
};
