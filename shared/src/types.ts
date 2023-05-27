interface CompletionPartBase {
  type: string;
}

interface StartPart extends CompletionPartBase {
  type: 'start';
  /**
   * Id of the message this reply is for.
   */
  replyTo: { id: number; time: number };

  agent: string;
  time: number;
}

interface MessagePart extends CompletionPartBase {
  type: 'msg';
  data: string;
}

interface EndPart extends CompletionPartBase {
  type: 'end';

  /**
   * Final id of the message. This is sent last, because it comes from the
   * database when the message is saved.
   */
  id: number;
}

export type CompletionPart = StartPart | MessagePart | EndPart;
