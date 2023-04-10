import { render } from 'preact';
import 'beercss';
import { Topic } from './component/topic';
import { SideBar } from './component/sidebar';

const App = () => {
  return (
    <>
      <SideBar />
      <main class="responsive scroll">
        <Topic id="test" />
      </main>
    </>
  );
};

render(<App />, document.getElementById('app') as HTMLElement);
