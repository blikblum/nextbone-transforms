const getPath = (obj, path) => {
  let result = obj
  const keys = path.split('.')
  for (let i = 0; i < keys.length; i++) {
    result = result[keys[i]]
    if (!result) break
  }
  return result
}

function transformImport(config, root) {
  const { knownClasses, moduleName, newModuleName, j } = config
  let baseClasses = []
  let defaultIdentifier
  // search backbone cjs/require import
  root
    .find(j.CallExpression, {
      callee: { name: 'require', type: 'Identifier' },
      arguments: [{ type: 'StringLiteral', value: moduleName }]
    })
    .forEach(path => {
      if (path.parentPath.value.type === 'VariableDeclarator') {
        defaultIdentifier = path.parentPath.value.id.name
      }
      j(path)
        .find(j.StringLiteral, { value: moduleName })
        .replaceWith(j.stringLiteral(newModuleName))
    })

  // search backbone es import
  root
    .find(j.ImportDeclaration, {
      source: { value: moduleName }
    })
    .forEach(path => {
      path.value.specifiers.forEach(specifier => {
        if (specifier.type === 'ImportDefaultSpecifier') {
          defaultIdentifier = specifier.local.name
        } else {
          if (specifier.imported.name in knownClasses) {
            baseClasses.push({ identifier: specifier.local.name, name: specifier.imported.name })
          }
        }
      })
      j(path)
        .find(j.StringLiteral, { value: moduleName })
        .replaceWith(j.stringLiteral(newModuleName))
    })

  return [defaultIdentifier, baseClasses]
}

function createBaseClassName(config, baseClass) {
  const j = config.j
  if (baseClass.namespace) {
    return j.memberExpression(j.identifier(baseClass.namespace), j.identifier(baseClass.identifier))
  }
  return j.identifier(baseClass.identifier)
}

function buildClass(config, className, callExpression, baseClass, isExpression) {
  const { knownClasses, knownDecorators = [], newModuleName, j, addedImports } = config
  const decorators = []
  const body = []
  const classInfo = knownClasses[baseClass.name]
  const renameMap = (classInfo && classInfo.rename) || {}
  if (callExpression.arguments.length) {
    const options = callExpression.arguments[0]
    options.properties.forEach(property => {
      const propName = property.key.name
      if (property.value && property.value.type === 'ObjectExpression') {
        if (knownDecorators.indexOf(propName) !== -1) {
          decorators.push(j.decorator(j.callExpression(j.identifier(propName), [property.value])))
          if (!addedImports[propName]) {
            addedImports[propName] = j.importDeclaration([j.importSpecifier(j.identifier(propName))], j.stringLiteral(`${newModuleName}/${propName}`), 'value')
          }
          return
        }
      }

      if (property.type === 'ObjectProperty') {
        if (property.value.type === 'FunctionExpression') {
          body.push(j.classMethod('method', j.identifier(renameMap[propName] || propName), property.value.params, property.value.body))
        } else {
          body.push(j.classProperty(j.identifier(renameMap[propName] || propName), property.value, null, classInfo && classInfo.static.indexOf(propName) !== -1))
        }
      } else if (property.type === 'ObjectMethod') {
        body.push(j.classMethod('method', j.identifier(renameMap[propName] || propName), property.params, property.body))
      }
    })
  }
  let nameIdentifier
  let classType
  if (isExpression) {
    nameIdentifier = null
    classType = 'classExpression'
  } else {
    nameIdentifier = j.identifier(className)
    classType = 'classDeclaration'
  }
  const result = j[classType](nameIdentifier, j.classBody(body), createBaseClassName(config, baseClass))
  result.decorators = decorators
  return result
}

function transformCallExpression(config, path, baseClass) {
  const { j } = config
  let parent = path.parentPath
  switch (parent.value.type) {
    case 'VariableDeclarator':
      const className = parent.value.id.name;
      parent = parent.parentPath.parentPath
      if (parent.value.type === 'VariableDeclaration') {
        j(parent).replaceWith(buildClass(config, className, path.value, baseClass))
      }
      break;
    case 'AssignmentExpression':
    case 'ExportDefaultDeclaration':
      j(path).replaceWith(buildClass(config, null, path.value, baseClass, true))
      break;
  }
}


function transformModule(moduleConfig, root, j) {
  const addedImports = {}

  const config = Object.assign({}, moduleConfig, { j, addedImports })

  let [defaultIdentifier, baseClasses] = transformImport(config, root)

  if (!defaultIdentifier) {
    defaultIdentifier = config.globalIdentifier
  }

  // search scoped backbone classes
  root
    .find(j.CallExpression, {
      callee: { object: { object: { type: 'Identifier', name: defaultIdentifier } }, property: { name: 'extend' } }
    })
    .forEach(path => {
      const baseClassName = getPath(path.value, 'callee.object.property.name')
      transformCallExpression(config, path, { name: baseClassName, identifier: baseClassName, namespace: defaultIdentifier })
    })

  // search baseClasses 
  baseClasses.forEach(baseClass => {
    root
      .find(j.CallExpression, {
        callee: { object: { type: 'Identifier', name: baseClass.identifier }, property: { name: 'extend' } }
      })
      .forEach(path => {
        transformCallExpression(config, path, baseClass)
      })
  })

  // add imports
  if (Object.keys(addedImports).length) {
    root
      .find(j.Program)
      .forEach(path => {
        let importAddIndex = 0
        path.value.body.forEach((item, index) => {
          if (item.type === 'ImportDeclaration') {
            importAddIndex = index + 1
          }
        })
        Object.values(addedImports).forEach(value => {
          path.value.body.splice(importAddIndex, 0, value)
          importAddIndex++
        })
      })
  }
}

function transformRadio (root, j) {
  root
    .find(j.ImportDeclaration, {
      source: { value: 'backbone.radio' }
    })
    .forEach(path => {
      j(path)
        .replaceWith(j.importDeclaration([j.importSpecifier(j.identifier('Radio'))], j.stringLiteral('nextbone-radio')))
    })
}

const backboneConfig = {
  moduleName: 'backbone',
  globalIdentifier: 'Backbone',
  knownDecorators: ['validation', 'computed'],
  knownClasses: {
    Model: {
      static: ['cidPrefix', 'idAttribute', 'defaults']
    },
    Collection: {
      static: ['model']
    },
    Router: {
      static: ['routes']
    }
  },
  newModuleName: 'nextbone'
}

const marionetteRoutingConfig = {
  moduleName: 'marionette.routing',
  knownClasses: {
    Route: {
      static: ['viewClass', 'contextRequests', 'contextEvents'],
      rename: {
        viewClass: 'component'
      }
    }
  },  
  newModuleName: 'nextbone-routing'
}

module.exports = function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)

  transformRadio(root, j)

  transformModule(backboneConfig, root, j)
  transformModule(marionetteRoutingConfig, root, j)

  return root.toSource()
}

module.exports.parser = 'babylon'