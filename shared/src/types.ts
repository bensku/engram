interface CompletionPartBase {
  type: string;
}

interface MessagePart extends CompletionPartBase {
  type: 'msg';
  data: string;
}

interface EndPart extends CompletionPartBase {
  type: 'end';
}

export type CompletionPart = MessagePart | EndPart;
