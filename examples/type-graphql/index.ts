import 'reflect-metadata';
import { Container } from 'inversify';
import { ApolloServer } from 'apollo-server';
import { buildSchema } from 'type-graphql';
import { CommandRunner } from '../../src';
import { RecipeResolver } from './recipes/resolvers/RecipeResolver';
import { CreateRecipeCommand } from './recipes/commands/CreateRecipeCommand';
import { RecipeRepository } from './recipes/repository/RecipeRepository';
import { GetRecipesCommand } from './recipes/commands/GetRecipesCommand';
import { NotifyCommand } from './recipes/commands/NotifyCommand';

async function bootstrap() {
  // `skipBaseClassChecks` required for using `AbstractCommand`
  const container = new Container({ skipBaseClassChecks: true });
  const runner = new CommandRunner({ container });

  container.bind(CommandRunner).toConstantValue(runner);
  container.bind(CreateRecipeCommand).toSelf();
  container.bind(GetRecipesCommand).toSelf();
  container.bind(NotifyCommand).toSelf();
  container.bind(RecipeRepository).toSelf();
  container.bind(RecipeResolver).toSelf();

  const schema = await buildSchema({
    resolvers: [RecipeResolver],
    container,
    emitSchemaFile: false
  });

  const server = new ApolloServer({
    schema,
    playground: true
  });

  const { url } = await server.listen(4000);
  console.log(`Server is running, GraphQL Playground available at ${url}`);
}

bootstrap();
