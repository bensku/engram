import { responses } from '../types';

export const SideBar = () => {
  return (
    <div
      class="fixed vertical medium-padding surface-variant"
      style={'width: 15vw;'}
    >
      <UserCard />
      <NewTopicButton />
      <TopicList />
      <div class="spacer" style={'height: 100vh;'} />
    </div>
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
  return (
    <button class="border row small-padding secondary-container primary-text">
      <i>add</i>
      New topic
    </button>
  );
};

const TopicList = () => {
  const topics: responses['Topic'][] = [
    { id: 'test1', title: 'Test topic' },
    { id: 'test1', title: 'Test topic 2' },
  ];

  return (
    <div class="vertical">
      {topics.map((topic) => (
        <button
          key={topic.id}
          class="row no-margin no-padding border secondary-container primary-text"
        >
          <i class="small-padding">chat</i>
          {topic.title}
          <div class="spacer max" />
          <button class="transparent circle front">
            <i>delete</i>
            <div class="tooltip">Delete topic</div>
          </button>
        </button>
      ))}
    </div>
  );
};
