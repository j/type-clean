import { InputType, Field } from 'type-graphql';

@InputType()
export class CreateRecipeInput {
  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;
}
