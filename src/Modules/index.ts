import * as t from "@babel/types";
import { EsModule } from "./EsModule";
import { Node } from "../types/Node";
import { CommonJsModule } from "./CommonJsModule";

export const createNode = (statement: t.Statement): Node | null => {
  if (EsModule.is(statement)) {
    return new EsModule(statement);
  }
  if (CommonJsModule.is(statement)) {
    return new CommonJsModule(statement);
  }
  return null;
};

export const isModuleNode = (node: Node): boolean => {
  return node instanceof EsModule || node instanceof CommonJsModule;
};

export const isModuleStatement = (statement: t.Node): boolean => {
  return EsModule.is((statement as unknown) as t.Statement) || CommonJsModule.is((statement as unknown) as t.Statement);
};
