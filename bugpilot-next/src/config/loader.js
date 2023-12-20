const babelParser = require("@babel/parser");
const t = require("@babel/types");
const traverse = require("@babel/traverse").default;
const {
  getRelativePath,
  containsServerActions,
  isClientComponent,
  isReactElement,
  isServerAction,
  wrap,
} = require("./utils");

const generate = require("@babel/generator").default;

module.exports = function (source) {
  // ignore client components as they are handled by BugpilotErrorPage
  if (isClientComponent(source)) {
    console.log("client component: " + this.resourcePath + ". Ignoring...");
    return source;
  }

  // checks if there are any Server Actions in the file
  const hasServerActions = containsServerActions(source);
  // set of bugpilot functions that we need to import
  const imports = new Set();
  const filePath = getRelativePath(this.resourcePath);

  const ast = babelParser.parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  traverse(ast, {
    enter(path) {
      // .tsx files that return jsx are Pages, Layouts, Server Components, etc.
      if (/.tsx$/.test(filePath) && isReactElement(path)) {
        if (
          /^app\/(?:.*\/)?page\.tsx/.test(filePath) &&
          path.parentPath.isExportDefaultDeclaration()
        ) {
          imports.add("wrapPageComponent");
          wrap(path, "wrapPageComponent", { filePath, kind: "page-component" });
          path.skip();
        } else {
          imports.add("wrapServerComponent");
          wrap(path, "wrapServerComponent", {
            filePath,
            kind: "server-component",
          });
          path.skip();
        }
      }

      if (hasServerActions === true && isServerAction(path)) {
        imports.add("wrapServerAction");
        wrap(path, "wrapServerAction", {
          filePath,
          kind: "server-action",
        });
        path.skip();
      }
    },
  });

  if (imports.size > 0) {
    const bugpilotImports = t.importDeclaration(
      [...imports].map((im) =>
        t.importSpecifier(t.identifier(im), t.identifier(im))
      ),
      t.stringLiteral("@bugpilot/next")
    );
    ast.program.body.unshift(bugpilotImports);
  }

  const output = generate(ast);
  console.log("output: \n", output.code);
  return output.code;
};
