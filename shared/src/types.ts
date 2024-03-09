interface CompletionPartBase {
  type: string;
}

interface StartPart extends CompletionPartBase {
  type: 'start';
  /**
   * The message this reply is for.
   */
  replyTo?: unknown;

  agent: string;
  time: number;
}

interface MessagePart extends CompletionPartBase {
  type: 'msg';
  data: string;
}

interface FragmentPart extends CompletionPartBase {
  type: 'fragment';
  data: Fragment;
}

interface EndPart extends CompletionPartBase {
  type: 'end';

  /**
   * Final id of the message. This is sent last, because it comes from the
   * database when the message is saved.
   */
  id: number;
}

export type CompletionPart = StartPart | MessagePart | FragmentPart | EndPart;

interface FragmentBase {
  type: string;
}

interface TitleFragment extends FragmentBase {
  type: 'title';
  title: string;
}

interface ToolCallFragment extends FragmentBase {
  type: 'toolCall';
  tool: string;
  text: string;
}

interface ToolCallCompletedFragment extends FragmentBase {
  type: 'toolCallCompleted';
  tool: string;
  text: string;
}

interface UserMessageFragment extends FragmentBase {
  type: 'userMessage';
  kind: 'error' | 'info';
  msg: string;
}

export type Fragment =
  | TitleFragment
  | ToolCallFragment
  | ToolCallCompletedFragment
  | UserMessageFragment;
