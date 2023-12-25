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
    console.debug(
      "loader.js:" + this.resourcePath + " is client component. Ignoring..."
    );
    return source;
  }

  const options = this.getOptions();

  // checks if there are any Server Actions in the file
  const hasServerActions = containsServerActions(source);
  // set of bugpilot functions that we need to import
  const imports = new Set();
  const filePath = getRelativePath(this.resourcePath);
  const buildContext = {
    buildId: options?.buildId,
    dev: String(options?.dev),
    nextRuntime: options?.nextRuntime,
    filePath,
  };

  const ast = babelParser.parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  traverse(ast, {
    enter(path) {
      // add Bugpilot Error Page
      if (/error.tsx$/.test(filePath)) {
        console.log("error", source);
        path.skip();
      } else if (/layout.tsx$/.test(filePath) && isReactElement(path)) {
        const BugpilotComponent = t.callExpression(t.identifier("_jsx"), [
          t.identifier("Bugpilot"),
          t.objectExpression([
            t.objectProperty(
              t.stringLiteral("workspaceId"),
              // todo: add correct workspaceId
              t.stringLiteral("123")
            ),
          ]),
        ]);

        path.traverse({
          CallExpression(path) {
            if (path.node.arguments[0].value === "body") {
              imports.add("Bugpilot");
              const bodyChildrenProps = path.node.arguments[1].properties.find(
                (prop) => t.isIdentifier(prop.key, { name: "children" })
              );

              if (t.isArrayExpression(bodyChildrenProps.value)) {
                bodyChildrenProps.value.elements.push(BugpilotComponent);
              } else {
                bodyChildrenProps.value = t.arrayExpression([
                  bodyChildrenProps.value,
                  BugpilotComponent,
                ]);
              }

              path.skip();
            }
          },
        });

        // path.skip();
      }

      // .tsx files that return jsx are Pages, Layouts, Server Components, etc.
      else if (/.tsx$/.test(filePath) && isReactElement(path)) {
        if (
          /^app\/(?:.*\/)?page\.tsx/.test(filePath) &&
          path.parentPath.isExportDefaultDeclaration()
        ) {
          imports.add("wrapPageComponent");
          wrap(path, "wrapPageComponent", {
            ...buildContext,
            kind: "page-component",
          });
          path.skip();
        } else {
          imports.add("wrapServerComponent");
          wrap(path, "wrapServerComponent", {
            ...buildContext,
            kind: "server-component",
          });
          path.skip();
        }
      }

      if (hasServerActions === true && isServerAction(path)) {
        imports.add("wrapServerAction");
        wrap(path, "wrapServerAction", {
          ...buildContext,
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
      t.stringLiteral("@kicoo7/next-v2")
    );
    ast.program.body.unshift(bugpilotImports);
  }

  const output = generate(ast);
  console.log("output: \n", output.code);
  return output.code;
};
