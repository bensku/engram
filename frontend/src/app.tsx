import { render } from 'preact';
import 'beercss';
import { Topic } from './component/topic';

const App = () => {
  return <Topic id="test" />;
};

render(<App />, document.getElementById('app') as HTMLElement);
