import * as t from "../statement.utils";

import { Node } from "../types/Node";

import { CommonJsModule } from "./CommonJsModule";
import { EsModule } from "./EsModule";

export const createNode = (statement: t.Statement): Node | null => {
  if (EsModule.is(statement)) {
    return new EsModule(statement);
  }
  if (CommonJsModule.is(statement)) {
    return new CommonJsModule(statement);
  }
  return null;
};

export const isModuleStatement = (statement: t.StatementNode): boolean => {
  return EsModule.is((statement as unknown) as t.Statement) || CommonJsModule.is((statement as unknown) as t.Statement);
};
