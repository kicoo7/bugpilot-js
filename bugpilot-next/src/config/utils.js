const path = require("path");
const t = require("@babel/types");

/**
 * Returns the relative path from the project root.
 * @param {string} fullPath
 * @returns
 */
module.exports.getRelativePath = function (fullPath) {
  const root = process.cwd();
  const relativePath = path.relative(root, fullPath);
  return relativePath;
};

/**
 * Returns true if the React "use client" directive is present.
 * @param {string} source
 * @returns
 */
module.exports.isClientComponent = function (source) {
  return Boolean(
    source.includes("__next_internal_client_entry_do_not_use__") ||
      source.includes("use client") ||
      source.includes("import { createProxy }")
  );
};

/**
 * Returns true if the React "use server" directive is present.
 * @param {string} source
 * @returns
 */
module.exports.containsServerActions = function (source) {
  return Boolean(source.includes("__next_internal_action_entry_do_not_use__"));
};

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

/**
 * IMPORTANT: We don't check for React class components.
 * Return true if node is a function declaration (function MyReactComponent) or arrow function (()=>{}) and returns jsx.
 * @param {Path} path
 * @returns {boolean}
 */
module.exports.isReactElement = function (path) {
  let isReactElement = false;
  if (path.isFunctionDeclaration() || path.isArrowFunctionExpression()) {
    isReactElement = isReturningJSXElement(path);
  }

  return isReactElement;
};

/**
 * Returns true if node is exported (named, not default), async, function or arrow function.
 * @param {*} path
 * @returns {boolean}
 */
module.exports.isServerAction = function (path) {
  return Boolean(
    path.node.async === true &&
      path?.parentPath?.isExportNamedDeclaration() &&
      (path.isFunctionDeclaration() ||
        (path.isArrowFunctionExpression() &&
          isReturningJSXElement(path) === false))
  );
};

function wrapArrowFunction(path, wrapFunctionName, optionsNode) {
  return path.replaceWith(
    t.callExpression(t.identifier(wrapFunctionName), [path.node, optionsNode])
  );
}

function wrapFunctionDeclaration(path, wrapFunctionName, optionsNode) {
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

module.exports.wrap = function (path, wrapFunctionName, options) {
  let optionsNode = t.nullLiteral();
  // transform object to objectExpression
  if (options && typeof options === "object") {
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
};
