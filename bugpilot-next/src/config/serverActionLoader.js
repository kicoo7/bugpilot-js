const babelParser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const generate = require("@babel/generator").default;

module.exports = function (source) {
  if (!source.includes("__next_internal_action_entry_do_not_use__")) {
    console.log(
      "\n" +
        this.resourcePath +
        " does not contain Server Actions. Skipping... \n"
    );
    return source;
  }

  const ast = babelParser.parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx", "tsx", "jsxs"],
  });

  // import { withErrors } from "@bugpilot/next";
  const wrapImportIdentifier = t.identifier("withErrors");
  const wrapImportDeclaration = t.importDeclaration(
    [t.importSpecifier(wrapImportIdentifier, t.identifier("withErrors"))],
    t.stringLiteral("@bugpilot/next")
  );
  ast.program.body.unshift(wrapImportDeclaration);

  // find all Server Action functions
  traverse(ast, {
    FunctionDeclaration(path) {
      // we only wrap exported server-actions
      if (
        !path.parentPath.isExportDefaultDeclaration() &&
        !path.parentPath.isExportNamedDeclaration()
      ) {
        console.log("path", path.node.id.name);
        return;
      }

      // check if the function returns a JSX element and is async
      if (path.node.async) {
        // creates a copy of the original ServerAction (i.e. updateProfile will become _updateProfile)
        const copyFunctionIdentifier = t.identifier("_" + path.node.id.name);
        const copyFunctionDeclaration = t.functionDeclaration(
          copyFunctionIdentifier,
          path.node.params,
          path.node.body,
          path.node.generator,
          path.node.async
        );

        // wraps it with withErrors
        const wrappedExpression = t.callExpression(wrapImportIdentifier, [
          copyFunctionIdentifier,
        ]);

        // const serverAction = withErrors(_serverAction);
        const variable = t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier(path.node.id.name),
            wrappedExpression
          ),
        ]);

        path.parentPath.insertBefore(copyFunctionDeclaration);
        // path.parentPath.insertBefore(variable);

        const newNamedExport = t.exportNamedDeclaration(variable);
        path.parentPath.insertBefore(newNamedExport);
        path.parentPath.remove();

        // inserts the copy Server Action in the file
        // path.parentPath.insertBefore(copyFunctionDeclaration);

        // creates a nameless function copy of the Server Action
        // const expression = t.functionExpression(
        //   null,
        //   path.node.params,
        //   path.node.body,
        //   path.node.generator,
        //   path.node.async
        // );

        // wrap the copy Server Action with the wrapper function
        // const wrappedExpression = t.callExpression(wrapImportIdentifier, [
        //   copyFunctionIdentifier,
        // ]);

        if (path.parentPath.isExportDefaultDeclaration()) {
          //   const newDefaultExport =
          //     t.exportDefaultDeclaration(wrappedExpression);
          //   const newDefaultExport = t.exportDefaultDeclaration(variable);
          //   ast.program.body.push(newDefaultExport);
          //   path.replaceWith(newDefaultExport);
        } else if (path.parentPath.isExportNamedDeclaration()) {
          //   const variable = t.variableDeclaration("const", [
          //     t.variableDeclarator(
          //       t.identifier(path.node.id.name),
          //       wrappedExpression
          //     ),
          //   ]);
          //   const newNamedExport = t.exportNamedDeclaration(variable);
          //   path.replaceWith(wrappedFunction);
          //   ast.program.body.push(newNamedExport);
        }

        // path.parentPath.remove();
      }
    },
    // ArrowFunctionExpression(path) {
    //   // check if the function returns a JSX element
    //   if (isReturningJSXElement(path)) {
    //     // check if it's default export and page.tsx w
    //     console.log(
    //       `The function ${
    //         path.node.id?.name || "(anonymous)"
    //       } returns a JSX element. Wrapping with wrapServerComponent.`
    //     );
    //   }
    // },
  });

  const output = generate(ast);
  console.log("output", output.code);
  return output.code;
};
