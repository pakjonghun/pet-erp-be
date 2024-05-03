import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { WholesaleSupplierService } from './wholesale-supplier.service';
import { WholesaleSupplier } from './entities/wholesale-supplier.entity';
import { CreateWholesaleSupplierInput } from './dto/create-wholesale-supplier.input';
import { UpdateWholesaleSupplierInput } from './dto/update-wholesale-supplier.input';

@Resolver(() => WholesaleSupplier)
export class WholesaleSupplierResolver {
  constructor(private readonly wholesaleSupplierService: WholesaleSupplierService) {}

  @Mutation(() => WholesaleSupplier)
  createWholesaleSupplier(@Args('createWholesaleSupplierInput') createWholesaleSupplierInput: CreateWholesaleSupplierInput) {
    return this.wholesaleSupplierService.create(createWholesaleSupplierInput);
  }

  @Query(() => [WholesaleSupplier], { name: 'wholesaleSupplier' })
  findAll() {
    return this.wholesaleSupplierService.findAll();
  }

  @Query(() => WholesaleSupplier, { name: 'wholesaleSupplier' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.wholesaleSupplierService.findOne(id);
  }

  @Mutation(() => WholesaleSupplier)
  updateWholesaleSupplier(@Args('updateWholesaleSupplierInput') updateWholesaleSupplierInput: UpdateWholesaleSupplierInput) {
    return this.wholesaleSupplierService.update(updateWholesaleSupplierInput.id, updateWholesaleSupplierInput);
  }

  @Mutation(() => WholesaleSupplier)
  removeWholesaleSupplier(@Args('id', { type: () => Int }) id: number) {
    return this.wholesaleSupplierService.remove(id);
  }
}
