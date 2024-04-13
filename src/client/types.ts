export type ColumnOption<T> = {
  fieldName: Partial<keyof T>;
  transform?: (value: unknown) => unknown;
};
