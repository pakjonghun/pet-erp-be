import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryResolver } from './category.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import { Category, categorySchema } from './entities/category.entity';
import { CategoryRepository } from './category.repository';

@Module({
  imports: [
    // forwardRef(() => AppModule),
    DatabaseModule.forFeature([
      { name: Category.name, schema: categorySchema },
    ]),
  ],
  providers: [CategoryResolver, CategoryService, CategoryRepository],
})
export class CategoryModule {}
