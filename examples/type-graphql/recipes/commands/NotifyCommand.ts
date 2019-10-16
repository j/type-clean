import { injectable } from 'inversify';
import { Command } from '../../../../src';

@injectable()
export class NotifyCommand implements Command<string, void> {
  async handle(message: string): Promise<void> {
    console.log(message);
  }
}
