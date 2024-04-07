import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Date', () => Date)
export class DateScalar implements CustomScalar<string, Date> {
  description = 'Date custom scalar type';

  parseValue(value: number | string): Date {
    return new Date(value); // value from the client
  }

  serialize(value: Date): string {
    if (typeof value === 'string') {
      return value;
    }
    return new Date(value).toISOString();
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    return null;
  }
}
