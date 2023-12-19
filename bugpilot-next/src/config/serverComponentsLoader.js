const babelParser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const generate = require("@babel/generator").default;

/**
 * Helper function that checks if function is a React component and returns a JSX element.
 * IMPORTANT: We don't check for React class components.
 * @param {Path} path
 * @returns {boolean}
 */
function isReturningJSXElement(path) {
  let foundJSX = false;
  path.traverse({
    ReturnStatement(returnPath) {
      const argument = returnPath.get("argument");
      if (
        t.isCallExpression(argument.node) &&
        (argument.node.callee.name === "_jsx" ||
          argument.node.callee.name === "_jsxs")
      ) {
        foundJSX = true;
      }
    },
  });
  return foundJSX;
}

/**
 * Helper function that checks if code is a client component ("use client").
 * @param {string} source
 * @returns {boolean}
 */
function isClientComponent(source) {
  return Boolean(
    source.includes("__next_internal_client_entry_do_not_use__") ||
      source.includes("use client") ||
      source.includes("import { createProxy }")
  );
}

module.exports = function (source) {
  if (isClientComponent(source)) {
    console.log("client: " + this.resourcePath + ". Ignoring...");
    return source;
  }

  console.log("server: " + this.resourcePath);

  const ast = babelParser.parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  // imports { wrapServerComponent } from "@bugpilot/next";
  const wrapImportIdentifier = t.identifier("wrapServerComponent");
  const wrapImportDeclaration = t.importDeclaration(
    [
      t.importSpecifier(
        wrapImportIdentifier,
        t.identifier("wrapServerComponent")
      ),
    ],
    t.stringLiteral("@bugpilot/next")
  );
  ast.program.body.unshift(wrapImportDeclaration);

  traverse(ast, {
    enter(path) {
      // check if path is a function declaration and returns a JSX element
      if (t.isFunctionDeclaration(path.node) && isReturningJSXElement(path)) {
        const expression = t.functionExpression(
          null,
          path.node.params,
          path.node.body,
          path.node.generator,
          path.node.async
        );

        const wrappedFunctionComponent = t.variableDeclaration("var", [
          t.variableDeclarator(
            t.identifier(path.node.id.name),
            t.callExpression(wrapImportIdentifier, [expression])
          ),
        ]);

        // is the component exported as default?
        if (path.parentPath.isExportDefaultDeclaration()) {
          const newExportDefault = t.exportDefaultDeclaration(
            t.identifier(path.node.id.name)
          );
          path.parentPath.replaceWithMultiple([
            wrappedFunctionComponent,
            newExportDefault,
          ]);
        } else if (path.parentPath.isExportNamedDeclaration()) {
          const newNamedExport = t.exportNamedDeclaration(
            t.identifier(path.node.id.name)
          );
          path.parentPath.replaceWithMultiple([
            wrappedFunctionComponent,
            newNamedExport,
          ]);
        } else {
          path.replaceWith(wrappedFunctionComponent);
        }
        // after the transformations go to the next sibling
        path.skip();
      } else if (
        t.isArrowFunctionExpression(path.node) &&
        isReturningJSXElement(path)
      ) {
        path.replaceWith(t.callExpression(wrapImportIdentifier, [path.node]));
        path.skip();
      }
    },
  });

  const output = generate(ast);
  return output.code;
};
