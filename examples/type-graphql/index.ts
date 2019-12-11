import 'reflect-metadata';
import { Container } from 'inversify';
import { ApolloServer } from 'apollo-server';
import { buildSchema } from 'type-graphql';
import { CommandRunner } from '../../src';
import { RecipeResolver } from './recipes/resolvers/RecipeResolver';
import { CreateRecipeHandler } from './recipes/handlers/CreateRecipeHandler';
import { RecipeRepository } from './recipes/repository/RecipeRepository';
import { GetRecipesHandler } from './recipes/handlers/GetRecipesHandler';
import { NotifyHandler } from './recipes/handlers/NotifyHandler';

async function bootstrap() {
  // `skipBaseClassChecks` required for using `AbstractCommand`
  const container = new Container({ skipBaseClassChecks: true });
  const runner = new CommandRunner({ container });

  container.bind(CommandRunner).toConstantValue(runner);
  container.bind(CreateRecipeHandler).toSelf();
  container.bind(GetRecipesHandler).toSelf();
  container.bind(NotifyHandler).toSelf();
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
