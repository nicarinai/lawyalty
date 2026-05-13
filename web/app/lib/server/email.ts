export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailSender {
  send(msg: EmailMessage): Promise<void>;
}

export class ConsoleEmailSender implements EmailSender {
  async send(msg: EmailMessage): Promise<void> {
    console.log(
      '[email]',
      JSON.stringify({ to: msg.to, subject: msg.subject, text: msg.text }, null, 2),
    );
  }
}

export function makeEmailSender(_env: unknown): EmailSender {
  return new ConsoleEmailSender();
}
