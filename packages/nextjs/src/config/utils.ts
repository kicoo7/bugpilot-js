const path = require("path");
const t = require("@babel/types");

/**
 * Returns the relative path from the project root.
 * @param {string} fullPath
 * @returns
 */
export function getRelativePath(fullPath: string) {
  const root = process.cwd();
  const relativePath = path.relative(root, fullPath);
  return relativePath;
}

/**
 * Returns true if the React "use client" directive is present.
 * @param {string} source
 * @returns
 */
export function isClientComponent(source: string) {
  return Boolean(
    source.includes("__next_internal_client_entry_do_not_use__") ||
      source.includes("use client") ||
      source.includes("import { createProxy }")
  );
}

/**
 * Returns true if the React "use server" directive is present.
 * @param {string} source
 * @returns
 */
export function containsServerActions(source) {
  return Boolean(source.includes("createActionProxy"));
}

/**
 * IMPORTANT: We don't check for React class components.
 * Return true if node is a function declaration (function MyReactComponent) or arrow function (()=>{}) and returns jsx.
 * @param {Path} path
 * @returns {boolean}
 */
export function isReactElement(path) {
  let isReactElement = false;
  if (path.isFunctionDeclaration() || path.isArrowFunctionExpression()) {
    isReactElement = isReturningJSXElement(path);
  }

  return isReactElement;
}

/**
 * Returns true if node is exported (named, not default), async, function or arrow function.
 * Important: Additionally we check if the "use server" directive is used.
 * i.e export async function myServerAction() {} or export const myServerAction = async () => {}
 * @param {*} path
 * @returns {boolean}
 */
export function isServerAction(path) {
  return Boolean(
    path.node.async === true &&
      ((path.isFunctionDeclaration() &&
        path?.parentPath?.isExportNamedDeclaration()) ||
        (path.isArrowFunctionExpression() &&
          path?.parentPath?.isVariableDeclarator() &&
          path?.parentPath?.parentPath?.isVariableDeclaration() &&
          path?.parentPath?.parentPath?.parentPath?.isExportNamedDeclaration())) &&
      isReturningJSXElement(path) === false
  );
}

/**
 * Returns true if node is exported (named, not default), function declaration and has the name "middleware".
 * @param {*} path
 * @returns {boolean}
 */
export function isMiddleware(path) {
  return Boolean(
    path.isFunctionDeclaration() &&
      path?.parentPath?.isExportNamedDeclaration() &&
      path?.node.id?.name === "middleware"
  );
}

/**
 * Wraps FunctionDeclaration or ArrowFunctionExpression with a function call with context.
 * @param {*} path - path to FunctionDeclaration or ArrowFunctionExpression
 * @param {string} wrapFunctionName - name of the wrapping function. Needs to be imported in the file.
 * @param {object} options - options that are passed to the wrapping function
 * @returns
 */
export function wrap(path, wrapFunctionName: string, options: {}) {
  let optionsNode = t.nullLiteral();
  // transform object to objectExpression
  if (options && typeof options === "object") {
    options = {
      ...options,
      // add the name of the function or the variable in case it's an arrow function
      functionName:
        path?.node?.id?.name || path?.parentPath?.node?.id?.name || "unknown",
    };

    // create a node from the options object
    optionsNode = t.objectExpression(
      Object.entries(options).map(([key, value]) =>
        t.objectProperty(t.identifier(key), t.stringLiteral(value))
      )
    );
  }

  if (path.isArrowFunctionExpression()) {
    return wrapArrowFunction(path, wrapFunctionName, optionsNode);
  } else if (path.isFunctionDeclaration()) {
    return wrapFunctionDeclaration(path, wrapFunctionName, optionsNode);
  } else {
    throw new Error(
      "Wrapping failed. Unsupported node type. Only arrow functions and function declarations are supported."
    );
  }
}

/**
 * Helper function that returns true if node returns a JSX element.
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

function wrapArrowFunction(path, wrapFunctionName: string, optionsNode) {
  return path.replaceWith(
    t.callExpression(t.identifier(wrapFunctionName), [path.node, optionsNode])
  );
}

function wrapFunctionDeclaration(path, wrapFunctionName: string, optionsNode) {
  const expression = t.functionExpression(
    null,
    path.node.params,
    path.node.body,
    path.node.generator,
    path.node.async
  );

  const originalFunctionIdentifier = t.identifier(path.node.id.name);
  const wrappedFunction = t.variableDeclaration("var", [
    t.variableDeclarator(
      originalFunctionIdentifier,
      t.callExpression(t.identifier(wrapFunctionName), [
        expression,
        optionsNode,
      ])
    ),
  ]);

  if (path?.parentPath?.isExportDefaultDeclaration()) {
    path.parentPath.replaceWithMultiple([
      wrappedFunction,
      t.exportDefaultDeclaration(originalFunctionIdentifier),
    ]);
  } else {
    path.replaceWith(wrappedFunction);
  }
}
