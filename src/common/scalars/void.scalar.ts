import { Scalar, CustomScalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('Void')
export class VoidScalar implements CustomScalar<void, void> {
  description = 'Represents no value.';

  parseValue(value: void): void {
    return value;
  }

  serialize(value: void): void {
    return value;
  }

  parseLiteral(ast: ValueNode): void {
    if (ast.kind === Kind.NULL) {
      return null;
    }
    return null;
  }
}
