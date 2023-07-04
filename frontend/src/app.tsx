import { render } from 'preact';
import 'beercss';
import { EmptyTopic, Topic } from './component/topic';
import { SideBar } from './component/sidebar';
import Router, { RoutableProps } from 'preact-router';
import './layout.css';

const App = ({ id }: { id?: string } & RoutableProps) => {
  return (
    <>
      <SideBar currentTopic={id ?? ''} />
      <main>{id ? <Topic id={parseInt(id)} /> : <EmptyTopic />}</main>
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
