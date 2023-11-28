import { route } from 'preact-router';
import { responses } from '../types';
import { currentTopic, topics } from '../state';
import { MinidenticonImg } from './icon';

export const NavBar = ({
  deleteTopic,
}: {
  deleteTopic: (id: number) => void;
}) => {
  return (
    <article
      class="navbar small-padding tiny-margin no-round"
      role="navigation"
    >
      <UserCard />
      <NewTopicButton />
      <TopicList topics={topics.value} deleteTopic={deleteTopic} />
    </article>
  );
};

const UserCard = () => {
  return (
    <article class="row container top-align small-padding">
      <button class="transparent circle extra">
        <MinidenticonImg username="bensku" lightness={40} saturation={80} />
        <div class="tooltip bottom">Settings</div>
      </button>
      <div class="small-padding vertical">
        <div class="large-text">Benjami</div>
        <div class="secondary-text">Administrator</div>
      </div>
      <div class="spacer max" />
      <button class="transparent circle huge">
        <i class="error-text">logout</i>
        <div class="tooltip bottom">Log out</div>
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
      class="border row small-padding no-margin surface-variant primary-text"
      onClick={newTopic}
    >
      <i>add</i>
      New topic
    </button>
  );
};

const TopicList = ({
  topics,
  deleteTopic,
}: {
  topics: responses['Topic'][];
  deleteTopic: (id: number) => void;
}) => {
  // TODO highlight current topic
  return (
    <div class="vertical">
      {topics.map((topic) => (
        <TopicEntry
          key={topic.id}
          topic={topic}
          isCurrent={topic.id == currentTopic.value.id}
          deleteThis={() => deleteTopic(topic.id)}
        />
      ))}
    </div>
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
    // FIXME don't always go to the front page
    setTimeout(() => route('/'), 100);
  };

  let styles = 'no-padding chip no-round';
  if (isCurrent) {
    styles += ' border surface-variant';
  } else {
    styles += ' no-border';
  }
  return (
    <a key={topic.id} class={styles} onClick={() => route(`/${topic.id}`)}>
      <i class="small-padding">chat</i>
      <div class="max-width truncate">{topic.title}</div>
      <button
        class="transparent circle front small center-align no-margin"
        onClick={_delete}
      >
        <i class="no-padding">delete</i>
      </button>
    </a>
  );
};
