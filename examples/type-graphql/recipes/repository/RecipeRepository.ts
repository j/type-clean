import { injectable } from 'inversify';
import { Recipe } from '../models/Recipe';

const recipes: Recipe[] = [
  Object.assign(new Recipe(), {
    id: 1,
    title: 'Pizza',
    description: 'Pepperoni'
  })
];

@injectable()
export class RecipeRepository {
  async find(): Promise<Recipe[]> {
    return recipes;
  }

  async create(fields: Partial<Recipe>): Promise<Recipe> {
    const recipe = Object.assign(new Recipe(), {
      ...fields,
      id: recipes.length + 1
    });

    recipes.push(recipe);

    return recipe;
  }
}
