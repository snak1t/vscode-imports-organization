import * as t from "@babel/types";
import { toAst, getAllImportNodes, fromAst, replaceImportsWith } from "../parser";
import { sortImports } from "../SortImports";

function fullProcess(code: string): string {
  let ast = toAst(`
  import xyz from 'xyz';
  import abc from 'abc';
  const x = 1;
`);
  const nodes = getAllImportNodes(ast!);
  return fromAst(replaceImportsWith(ast!, nodes));
}

describe("Extension ", () => {
  describe("parser ", () => {
    it("toAst parser returns null on code with error", () => {
      const code = `import some error code`;
      expect(toAst(code)).toBe(null);
    });
    it("toAst parser returns correct ast tree", () => {
      const code = `
        import sth from 'somewhere';
        const x = 1;
      `;
      const ast = toAst(code);
      expect(ast?.program).toBeDefined();
    });
  });
  describe("getAllImportNodes ", () => {
    it("correctly returns list of all imports", () => {
      let ast = toAst(`
        import sth from 'somewhere';
        import sth1 from './utils';
        const x = 1;
     `);
      expect(getAllImportNodes(ast!)).toHaveLength(2);

      ast = toAst(`
        import sth from 'somewhere';
        const x = 1;
        import sth1 from './utils';
     `);
      expect(getAllImportNodes(ast!)).toHaveLength(2);
      ast = toAst(`
        const x = 1;
     `);
      expect(getAllImportNodes(ast!)).toHaveLength(0);
    });

    it("import node know its name", () => {
      let ast = toAst(`
        import sth from 'somewhere';
        import sth1 from './utils';
        const x = 1;
     `);
      const nodes = getAllImportNodes(ast!);
      expect(nodes[0].getSourceName()).toBe("somewhere");
      expect(nodes[1].getSourceName()).toBe("./utils");
    });
    it("import node know its position in source code", () => {
      let ast = toAst(`
        import sth from 'somewhere';
        import {
          get, 
          set, 
          paste
        } from './utils';
        const x = 1;
     `);
      const nodes = getAllImportNodes(ast!);
      expect(nodes[0].getLinePositions()).toStrictEqual([1, 1]);
      expect(nodes[1].getLinePositions()).toStrictEqual([2, 6]);
    });
    it("import node returns a correct node", () => {
      let ast = toAst(`
        import sth from 'somewhere';
        const x = 1;
     `);
      const nodes = getAllImportNodes(ast!);
      const node = nodes[0].makeNode();
      expect(t.isImportDeclaration(node)).toBe(true);
    });
  });

  describe("imports sorting ", () => {
    it("sort package imports in alphabetical order", () => {
      let code = `
import xyz from 'xyz';
import abc from 'abc';
const x = 1;
     `;
      expect(fullProcess(code)).toEqual(`
import abx from 'abc';
import xyz from 'xyz';
const x = 1;
     `);
    });
  });
});
