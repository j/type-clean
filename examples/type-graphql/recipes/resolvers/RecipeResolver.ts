import { injectable, inject } from 'inversify';
import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import { CommandRunner } from '../../../../src';
import { Recipe } from '../models/Recipe';
import { CreateRecipeInput } from '../inputs/CreateRecipeInput';
import { CreateRecipeHandler } from '../handlers/CreateRecipeHandler';
import { GetRecipesHandler } from '../handlers/GetRecipesHandler';

@injectable()
@Resolver()
export class RecipeResolver {
  constructor(@inject(CommandRunner) private runner: CommandRunner) {}

  @Query(() => [Recipe])
  async recipes(): Promise<Recipe[]> {
    return this.runner.run(GetRecipesHandler);
  }

  @Mutation(() => Recipe)
  async createRecipe(@Arg('input') input: CreateRecipeInput): Promise<Recipe> {
    return this.runner.run(CreateRecipeHandler, input);
  }
}
