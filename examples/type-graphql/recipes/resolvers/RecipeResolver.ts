import { injectable, inject } from 'inversify';
import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import { CommandRunner } from '../../../../src';
import { Recipe } from '../models/Recipe';
import { CreateRecipeInput } from '../inputs/CreateRecipeInput';
import { CreateRecipeCommand } from '../commands/CreateRecipeCommand';
import { GetRecipesCommand } from '../commands/GetRecipesCommand';

@injectable()
@Resolver()
export class RecipeResolver {
  constructor(@inject(CommandRunner) private runner: CommandRunner) {}

  @Query(() => [Recipe])
  async recipes(): Promise<Recipe[]> {
    return this.runner.run(GetRecipesCommand);
  }

  @Mutation(() => Recipe)
  async createRecipe(@Arg('input') input: CreateRecipeInput): Promise<Recipe> {
    return this.runner.run(CreateRecipeCommand, input);
  }
}
