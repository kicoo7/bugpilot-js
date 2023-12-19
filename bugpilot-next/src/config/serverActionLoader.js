const babelParser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const generate = require("@babel/generator").default;

module.exports = function (source) {
  /**
   * Files that contain Server Actions contain this string.
   */
  if (!source.includes("__next_internal_action_entry_do_not_use__")) {
    console.log(
      this.resourcePath + " does not contain Server Actions. Skipping... \n"
    );
    return source;
  }

  const ast = babelParser.parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  // import { wrapServerAction } from "@bugpilot/next"; to the top of the file
  const wrapImportIdentifier = t.identifier("wrapServerAction");
  const wrapImportDeclaration = t.importDeclaration(
    [t.importSpecifier(wrapImportIdentifier, t.identifier("wrapServerAction"))],
    t.stringLiteral("@bugpilot/next")
  );
  ast.program.body.unshift(wrapImportDeclaration);

  let hasWrappedServerAction = false;

  console.log("server action source", source);

  // find all Server Action functions and wrap them with wrapServerAction
  traverse(ast, {
    enter(path) {
      if (
        path.node.async === true &&
        path.parentPath.isExportNamedDeclaration() &&
        path.isFunctionDeclaration()
      ) {
        hasWrappedServerAction = true;

        const expression = t.functionExpression(
          null,
          path.node.params,
          path.node.body,
          path.node.generator,
          path.node.async
        );

        const wrappedInlineServerAction = t.variableDeclaration("var", [
          t.variableDeclarator(
            t.identifier(path.node.id.name),
            t.callExpression(wrapImportIdentifier, [expression])
          ),
        ]);

        path.replaceWith(wrappedInlineServerAction);
        path.skip();
      } else if (
        path.node.async === true &&
        path.parentPath.isExportNamedDeclaration() &&
        path.isArrowFunctionExpression()
      ) {
        hasWrappedServerAction = true;
        path.replaceWith(t.callExpression(wrapImportIdentifier, [path.node]));
        path.skip();
      }
    },
  });

  // remove import { wrapServerAction } from @bugpilot/next since no Server Actions were found
  if (hasWrappedServerAction === false) {
    ast.program.body.shift();
  }

  const output = generate(ast);
  console.log("output", output.code);
  return output.code;
};
