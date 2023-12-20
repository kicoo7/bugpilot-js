const babelParser = require("@babel/parser");
const t = require("@babel/types");
const traverse = require("@babel/traverse").default;
const {
  getRelativePath,
  containsServerActions,
  isClientComponent,
  isReturningJSXElement,
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

  const relativePath = getRelativePath(this.resourcePath);
  console.log("server: " + relativePath);

  const ast = babelParser.parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  // set of bugpilot functions that we need to import
  const imports = new Set();

  // t.objectExpression([
  //   t.objectProperty(
  //     t.identifier("name"),
  //     t.stringLiteral(path.parentPath.node.id.name)
  //   ),
  //   t.objectProperty(
  //     t.identifier("filePath"),
  //     t.stringLiteral(resourcePath)
  //   ),
  //   t.objectProperty(
  //     t.identifier("kind"),
  //     t.stringLiteral("server-component")
  //   ),

  traverse(ast, {
    enter(path) {
      // .tsx files that return jsx are Pages, Layouts, Server Components, etc.
      if (/.tsx$/.test(relativePath) && isReactElement(path)) {
        if (
          /^app\/(?:.*\/)?page\.tsx/.test(relativePath) &&
          path.parentPath.isExportDefaultDeclaration()
        ) {
          imports.add("wrapPageComponent");
          wrap(path, "wrapPageComponent");
          path.skip();
        } else {
          imports.add("wrapServerComponent");
          wrap(path, "wrapServerComponent");
          path.skip();
        }
      }

      if (hasServerActions === true && isServerAction(path)) {
        imports.add("wrapServerAction");
        wrap(path, "wrapServerAction");
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
