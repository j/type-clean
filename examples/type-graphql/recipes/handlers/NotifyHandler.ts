import { injectable } from 'inversify';
import { CommandHandler } from '../../../../src';

@injectable()
export class NotifyHandler implements CommandHandler<string, void> {
  async handle(message: string): Promise<void> {
    console.log(message);
  }
}
