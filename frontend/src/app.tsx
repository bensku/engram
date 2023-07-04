import { render } from 'preact';
import 'beercss';
import { EmptyTopic, Topic } from './component/topic';
import { SideBar } from './component/sidebar';
import Router, { RoutableProps } from 'preact-router';

const App = ({ id }: { id?: string } & RoutableProps) => {
  return (
    <>
      <SideBar currentTopic={id ?? ''} />
      <main class="responsive" style={{ marginLeft: '22em', maxWidth: '80em' }}>
        {id ? <Topic id={parseInt(id)} /> : <EmptyTopic />}
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
