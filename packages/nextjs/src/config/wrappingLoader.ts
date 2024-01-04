import { LoaderContext } from "webpack";

const babelParser = require("@babel/parser");
const t = require("@babel/types");
const traverse = require("@babel/traverse").default;
const {
  getRelativePath,
  containsServerActions,
  isClientComponent,
  isReactElement,
  isServerAction,
  isMiddleware,
  wrap,
} = require("./utils");

const generate = require("@babel/generator").default;

export default function wrappingLoader(
  this: LoaderContext<any>,
  source: string
) {
  // ignore client components as they are handled by BugpilotErrorPage
  if (isClientComponent(source)) {
    return source;
  }

  const options = this.getOptions();

  // checks if there are any Server Actions in the file
  const hasServerActions = containsServerActions(source);
  // set of bugpilot functions that we need to import
  const imports = new Set();

  const buildContext = {
    buildId: String(options?.buildId),
    dev: String(options?.dev),
    nextRuntime: String(options?.nextRuntime),
    filePath: getRelativePath(this.resourcePath),
    kind: String(options?.kind),
    workspaceId: String(options?.workspaceId),
  };

  const ast = babelParser.parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  traverse(ast, {
    enter(path) {
      if (
        buildContext?.kind === "page-component" &&
        isReactElement(path) &&
        path.parentPath.isExportDefaultDeclaration()
      ) {
        imports.add("wrapPageComponent");
        wrap(path, "wrapPageComponent", buildContext);
        path.skip();
      } else if (
        buildContext?.kind === "server-component" &&
        isReactElement(path)
      ) {
        imports.add("wrapServerComponent");
        wrap(path, "wrapServerComponent", buildContext);
        path.skip();
      } else if (
        buildContext?.kind === "server-action" &&
        hasServerActions &&
        isServerAction(path)
      ) {
        // TO IMPROVE: inline server actions have names like $$ACTION_0, $$ACTION_1, etc.
        imports.add("wrapServerAction");
        wrap(path, "wrapServerAction", buildContext);
        path.skip();
      } else if (buildContext?.kind === "middleware" && isMiddleware(path)) {
        imports.add("wrapMiddleware");
        wrap(path, "wrapMiddleware", buildContext);
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
  return output.code;
}
