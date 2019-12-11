import { injectable } from 'inversify';
import { CommandHandler } from '../../../../src';
import { Recipe } from '../models/Recipe';
import { RecipeRepository } from '../repository/RecipeRepository';

@injectable()
export class GetRecipesHandler implements CommandHandler {
  constructor(private repository: RecipeRepository) {}

  async handle(): Promise<Recipe[]> {
    return this.repository.find();
  }
}
