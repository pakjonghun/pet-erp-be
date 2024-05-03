import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { MoveService } from './move.service';
import { Move } from './entities/move.entity';
import { CreateMoveInput } from './dto/create-move.input';
import { UpdateMoveInput } from './dto/update-move.input';

@Resolver(() => Move)
export class MoveResolver {
  constructor(private readonly moveService: MoveService) {}

  @Mutation(() => Move)
  createMove(@Args('createMoveInput') createMoveInput: CreateMoveInput) {
    return this.moveService.create(createMoveInput);
  }

  @Query(() => [Move], { name: 'move' })
  findAll() {
    return this.moveService.findAll();
  }

  @Query(() => Move, { name: 'move' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.moveService.findOne(id);
  }

  @Mutation(() => Move)
  updateMove(@Args('updateMoveInput') updateMoveInput: UpdateMoveInput) {
    return this.moveService.update(updateMoveInput.id, updateMoveInput);
  }

  @Mutation(() => Move)
  removeMove(@Args('id', { type: () => Int }) id: number) {
    return this.moveService.remove(id);
  }
}
