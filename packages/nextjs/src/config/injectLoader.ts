import { LoaderContext } from "webpack";
import babelParser from "@babel/parser";
import t from "@babel/types";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import { isReactElement } from "./utils";

export default function injectLoader(this: LoaderContext<any>, source: string) {
  const options = this.getOptions();

  // set of bugpilot functions that we need to import
  const imports: Set<string> = new Set();

  const ast = babelParser.parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  traverse(ast, {
    enter(path) {
      if (options?.injectKind === "bugpilot" && isReactElement(path)) {
        const BugpilotComponent = t.callExpression(t.identifier("_jsx"), [
          t.identifier("Bugpilot"),
          t.objectExpression([
            t.objectProperty(
              t.stringLiteral("workspaceId"),
              t.stringLiteral(options?.workspaceId)
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
