import { injectable } from 'inversify';
import { AbstractCommand } from '../../../../src';
import { CreateRecipeInput } from '../inputs/CreateRecipeInput';
import { Recipe } from '../models/Recipe';
import { RecipeRepository } from '../repository/RecipeRepository';
import { NotifyCommand } from './NotifyCommand';

@injectable()
export class CreateRecipeCommand extends AbstractCommand<
  CreateRecipeInput,
  Recipe
> {
  constructor(private repository: RecipeRepository) {
    super();
  }

  async handle(input: CreateRecipeInput): Promise<Recipe> {
    const recipe = await this.repository.create(input);

    // this can also be configured as a separate subscriber using `@AfterCommand()`
    await this.run(NotifyCommand, `Created Recipe ${recipe.id}`);

    return recipe;
  }
}
