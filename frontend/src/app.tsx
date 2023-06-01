import { render } from 'preact';
import 'beercss';
import { Topic } from './component/topic';
import { SideBar } from './component/sidebar';
import Router from 'preact-router';

const App = () => {
  return (
    <>
      <SideBar />
      <main class="responsive" style={{ marginLeft: '22em', maxWidth: '80em' }}>
        <Router>
          <Topic path="/:id" />
          <Topic default />
        </Router>
      </main>
    </>
  );
};

render(<App />, document.getElementById('app') as HTMLElement);
