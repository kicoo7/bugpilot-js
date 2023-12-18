const babelParser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const generate = require("@babel/generator").default;

// Helper function to check if a node is a JSX element
const isReturningJSXElement = (path) => {
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
};

module.exports = function (source) {
  // we don't want to wrap client-side components
  if (
    source.includes("__next_internal_client_entry_do_not_use__") ||
    source.includes("use client") ||
    source.includes("import { createProxy }")
  ) {
    console.log("\n" + this.resourcePath + " is a client component \n");
    return source;
  }

  console.log("server " + this.resourcePath);

  const ast = babelParser.parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx", "tsx", "jsxs"],
  });

  // import wrapServerComponent from "@bugpilot/next";
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

  // find all functions and arrow functions that return a JSX element (they are React components) and wrap them
  traverse(ast, {
    FunctionDeclaration(path) {
      // check if the function returns a JSX element and is async
      if (isReturningJSXElement(path) && path.node.async) {
        // check if it's default export and page.tsx w
        console.log(
          `The function ${
            path.node.id?.name || "(anonymous)"
          } returns a JSX element and is async. Wrapping with wrapServerComponent.`
        );

        // creates a copy of the original component (i.e. Stats will become _Stats)
        const copyFunctionIdentifier = t.identifier("_" + path.node.id.name);
        const copyFunctionDeclaration = t.functionDeclaration(
          copyFunctionIdentifier,
          path.node.params,
          path.node.body,
          path.node.generator,
          path.node.async
        );

        // inserts the copy component in the file
        ast.program.body.push(copyFunctionDeclaration);

        // wrap the copy function with the wrapper function
        const wrappedExpression = t.callExpression(wrapImportIdentifier, [
          copyFunctionIdentifier,
        ]);

        // check if parent is export default
        if (path.parentPath.isExportDefaultDeclaration()) {
          // replace the original function with the wrapped expression
          // i.e. export default function Stats()... will become export default wrapServerComponent(_Stats)
          path.replaceWith(wrappedExpression);
        } else if (path.parentPath.isExportNamedDeclaration()) {
          const variable = t.variableDeclaration("const", [
            t.variableDeclarator(
              t.identifier(path.node.id.name),
              wrappedExpression
            ),
          ]);
          ast.program.body.push(variable);
          path.replaceWith(variable);
        } else {
          const variable = t.variableDeclaration("const", [
            t.variableDeclarator(
              t.identifier(path.node.id.name),
              wrappedExpression
            ),
          ]);
          ast.program.body.push(variable);
          path.remove();
        }
        // create a const with the same name that points to the wrapped expression

        // const newFunctionBody = t.blockStatement([
        //   t.returnStatement(wrappedExpression),
        // ]);

        // // // // remove the async keyword from the original function
        // path.node.async = false;
        // // // // replace the body of the original function with the wrapped expression
        // path.get("body").replaceWith(newFunctionBody);

        // // exported functions will be handled differently
        // if (
        //   path.parentPath.isExportDefaultDeclaration() ||
        //   path.parentPath.isExportNamedDeclaration()
        // ) {
        //   return;
        // }

        // let originalName = path.node.id.name;
        // let newName = `_${originalName}`;
        // path.node.id.name = newName;

        // const newFunction = t.functionDeclaration(
        //   t.identifier(originalName),
        //   path.node.params,
        //   t.blockStatement([
        //     t.returnStatement(
        //       t.callExpression(wrapImportIdentifier, [path.node])
        //     ),
        //   ]),
        //   path.node.generator, // Generator
        //   path.node.async // Async
        // );

        // path.insertAfter(newFunction);

        // const declaration = path.node;
        // const expression = t.functionDeclaration(
        //   null,
        //   declaration.params,
        //   declaration.body,
        //   declaration.generator,
        //   declaration.async
        // );
        // Wrap the function with the wrapper function
        // const wrappedExpression = t.callExpression(wrapImportIdentifier, [
        //   expression,
        // ]);

        // Create a new function declaration with the wrapped expression
        // const newFunctionDeclaration = t.FunctionDeclaration(wrappedExpression);
        // Replace the original function declaration with the new one
        // path.replaceWith(wrappedExpression);
      }
    },
    ArrowFunctionExpression(path) {
      // check if the function returns a JSX element
      if (isReturningJSXElement(path)) {
        // check if it's default export and page.tsx w
        console.log(
          `The function ${
            path.node.id?.name || "(anonymous)"
          } returns a JSX element. Wrapping with wrapServerComponent.`
        );
      }
    },
  });

  const output = generate(ast);
  console.log("output", output.code);
  return output.code;
};
