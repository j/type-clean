import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class Recipe {
  @Field({ nullable: true })
  id: number;

  @Field({ nullable: true })
  title: string;

  @Field({ nullable: true })
  description?: string;
}
