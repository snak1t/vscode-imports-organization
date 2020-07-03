import * as t from "@babel/types";

import { ConfigEntry, ModulesMixType } from "../Config";
import { toAst, getAllImportNodes, fromAst, replaceImportsWith } from "../parser";
import { sortImports } from "../SortImports";

const config: ConfigEntry[] = [
  {
    order: 1,
    test: source => /^[\@a-zA-Z]+/.test(source),
    internalOrder: [source => source === "react"],
  },
  {
    order: 4,
    test: source => /^\.[a-zA-Z]+$/.test(source),
  },
  {
    order: 2,
    test: source => /^(\.\.\/)/.test(source),
  },
  {
    order: 3,
    test: source => /^(\.\/)/.test(source),
  },
  {
    order: 5,
    test: source => /.*/.test(source),
  },
];

function fullProcess(code: string, sortMixType: ModulesMixType = "es_to_top"): string {
  let ast = toAst(code);
  const nodes = sortImports(getAllImportNodes(ast!), config, sortMixType);
  return fromAst(replaceImportsWith(ast!, nodes), code);
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
        const sth = require('somewhere')
        require('./utils')
        require('pkg-a').method();
        require('pkg-b').member.method();
        require('pkg-c').member.member;
        if(true){const a = require('./pkg-d')}
        const x = 1;
     `);
      expect(getAllImportNodes(ast!)).toHaveLength(5);

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
const x = 1;`;
      const result = fullProcess(code).split("\n");
      expect(result).toEqual([`import abc from 'abc';`, `import xyz from 'xyz';`, ``]);
    });

    it("sort package imports in alphabetical order case 2", () => {
      let code = `
import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Col, FormGroup, Row } from 'react-bootstrap'
import { FormattedMessage, injectIntl } from 'react-intl'
import CustomerContactsForm from './CustomerContactsFormContainer'
import { CA, CB } from '../../../components/ComponentA'
import InfoMessage from '../../Messages/InfoMessage'
import Field from '../../../components/ComponentA/Field'
import { Link } from 'react-router'`;
      const result = fullProcess(code).split("\n");
      expect(result).toStrictEqual([
        `import React from 'react';`,
        `import PropTypes from 'prop-types';`,
        `import * as R from 'ramda';`,
        `import { Col, FormGroup, Row } from 'react-bootstrap';`,
        `import { FormattedMessage, injectIntl } from 'react-intl';`,
        `import { Link } from 'react-router';`,
        ``,
        `import { CA, CB } from '../../../components/ComponentA';`,
        `import Field from '../../../components/ComponentA/Field';`,
        `import InfoMessage from '../../Messages/InfoMessage';`,
        ``,
        `import CustomerContactsForm from './CustomerContactsFormContainer';`,
        ``,
      ]);
    });

    it("moves important statement above require by default", () => {
      let code = `
import React from 'react'
const b = require('./image.png')
const _ = require('lodash')
import { MyComponent } from './MyComponent'
const x = 1;`;
      const result = fullProcess(code).split("\n");
      expect(result).toStrictEqual([
        `import React from 'react';`,
        ``,
        `import { MyComponent } from './MyComponent';`,
        ``,
        `const _ = require('lodash');`,
        ``,
        `const b = require('./image.png');`,
        ``,
      ]);
    });

    it("keep modules statement mixed with if option is provided", () => {
      let code = `
import React from 'react'
const b = require('./image.png')
const _ = require('lodash')
import { MyComponent } from './MyComponent'
const x = 1;`;
      const result = fullProcess(code, "mixed").split("\n");
      expect(result).toStrictEqual([
        `import React from 'react';`,
        `const _ = require('lodash');`,
        ``,
        `const b = require('./image.png');`,
        `import { MyComponent } from './MyComponent';`,
        ``,
      ]);
    });
  });
});
