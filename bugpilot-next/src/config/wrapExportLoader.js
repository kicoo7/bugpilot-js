const babelParser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const generate = require("@babel/generator").default;

module.exports = function (source) {
  const ast = babelParser.parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  // we don't want to wrap client pages
  if (source.includes("__next_internal_client_entry_do_not_use__")) {
    return;
  }

  traverse(ast, {
    ExportDefaultDeclaration(path) {
      const { declaration } = path.node;

      //   path.traverse({
      //     visitor: {
      //       JSXElement(path) {
      //         console.log("JSXElement", "is jsx");
      //       },
      //     },
      //   });

      if (
        t.isFunctionDeclaration(declaration) ||
        t.isArrowFunctionExpression(declaration)
      ) {
        const wrapImportIdentifier = path.scope.generateUidIdentifier(
          "wrapServerComponent"
        );
        const wrapImportDeclaration = t.importDeclaration(
          [
            t.importSpecifier(
              wrapImportIdentifier,
              t.identifier("wrapServerComponent")
            ),
          ],
          t.stringLiteral("@bugpilot/next")
        );

        // adds import{ wrapServerComponent } from "@bugpilot/next"; to top of file
        path
          .findParent((path) => path.isProgram())
          .unshiftContainer("body", wrapImportDeclaration);

        const expression = t.functionExpression(
          null,
          declaration.params,
          declaration.body,
          declaration.generator,
          declaration.async
        );

        // Wrap the function with the wrapper function
        const wrappedExpression = t.callExpression(wrapImportIdentifier, [
          expression,
        ]);

        // Create a new export declaration with the wrapped expression
        const newExportDeclaration =
          t.exportDefaultDeclaration(wrappedExpression);

        // Replace the original export declaration with the new one
        path.replaceWith(newExportDeclaration);
      }
    },
  });

  const output = generate(ast);
  return output.code;
};
