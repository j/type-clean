import { injectable } from 'inversify';
import { Command } from '../../../../src';
import { Recipe } from '../models/Recipe';
import { RecipeRepository } from '../repository/RecipeRepository';

@injectable()
export class GetRecipesCommand implements Command {
  constructor(private repository: RecipeRepository) {}

  async handle(): Promise<Recipe[]> {
    return this.repository.find();
  }
}
