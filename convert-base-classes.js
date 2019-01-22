const getPath = require('lodash/get')
const each = require('lodash/each')

const knownDecorators = ['validation', 'computed']
const knownClasses = {
  Model: {
    static: ['cidPrefix', 'idAttribute']
  },
  Collection: {
    static: ['model']
  }
}  

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;

  const root = j(file.source)

  let bbIdentifier = 'Backbone'
  const classIdentifiers = []
  const addImports = {}

  function createBaseClassName(baseClass) {
    if (baseClass.namespace) {
      return j.memberExpression(j.identifier(baseClass.namespace), j.identifier(baseClass.identifier))
    }
    return j.identifier(baseClass.identifier)
  }

  function buildClass(className, callExpression, baseClass, isExpression) {    
    const decorators = []
    const body = []
    const classInfo = knownClasses[baseClass.name]
    if (callExpression.arguments.length) {
      const options = callExpression.arguments[0]
      options.properties.forEach(property => {
        const propName = property.key.name
        if (property.value && property.value.type === 'ObjectExpression') {
          if (knownDecorators.indexOf(propName) !== -1) {
            decorators.push(j.decorator(j.callExpression(j.identifier(propName), [property.value])))
            if (!addImports[propName]) {
              addImports[propName] = j.importDeclaration([j.importSpecifier(j.identifier(propName))], j.stringLiteral(`nextbone/${propName}`), 'value')
            }
            return            
          }
        }

        if (property.type === 'ObjectProperty') {
          if (property.value.type === 'FunctionExpression') {
            body.push(j.classMethod('method', j.identifier(propName), property.value.params, property.value.body))
          } else {
            body.push(j.classProperty(j.identifier(propName), property.value, null, classInfo && classInfo.static.indexOf(propName) !== -1))
          }          
        } else if (property.type === 'ObjectMethod') {
          body.push(j.classMethod('method', j.identifier(propName), property.params, property.body))
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
    const result = j[classType](nameIdentifier, j.classBody(body), createBaseClassName(baseClass))
    result.decorators = decorators
    return result
  }

  function parseCallExpression(path, baseClass) {
    let parent = path.parentPath
    switch (parent.value.type) {
      case 'VariableDeclarator': 
        const className = parent.value.id.name;
        parent = parent.parentPath.parentPath
        if (parent.value.type === 'VariableDeclaration') {
          j(parent).replaceWith(buildClass(className, path.value, baseClass))
        }
        break;
      case 'AssignmentExpression':
      case 'ExportDefaultDeclaration':
        j(path).replaceWith(buildClass(null, path.value, baseClass, true))
        break;
    }
  }
  
  // search backbone cjs/require import
  root
    .find(j.CallExpression, {
      callee: { name: 'require',  type: 'Identifier' },
      arguments: [{ type: 'StringLiteral', value: 'backbone' }]
    })
    .forEach(path => {
      if (path.parentPath.value.type === 'VariableDeclarator') {
        bbIdentifier = path.parentPath.value.id.name
      }
      j(path)
        .find(j.StringLiteral, { value: 'backbone' })
        .replaceWith(j.stringLiteral('nextbone')) 
    })
  
  // search backbone es import
  root
    .find(j.ImportDeclaration, {    
      source: { value: 'backbone' }
    })
    .forEach(path => {
      path.value.specifiers.forEach(specifier => {
        if (specifier.type === 'ImportDefaultSpecifier') {
          bbIdentifier = specifier.local.name
        } else {
          if (specifier.imported.name in knownClasses) {
            classIdentifiers.push({identifier: specifier.local.name, name: specifier.imported.name})
          }
        }
      })        
      j(path)
        .find(j.StringLiteral, { value: 'backbone' })
        .replaceWith(j.stringLiteral('nextbone')) 
    })


  // search scoped backbone classes
  root
    .find(j.CallExpression, {
      callee: { object: { object: { type: 'Identifier', name: bbIdentifier } }, property: { name: 'extend' }  }
    })
    .forEach(path => {
      const baseClassName = getPath(path.value, 'callee.object.property.name')
      parseCallExpression(path, {name: baseClassName, identifier: baseClassName, namespace: bbIdentifier})
    })

  classIdentifiers.forEach(baseClass => {
    root
    .find(j.CallExpression, {
      callee: { object: { type: 'Identifier', name: baseClass.identifier }, property: { name: 'extend' }  }
    })
    .forEach(path => {
      parseCallExpression(path, baseClass)
    })
  })  
  
  // add imports
  if (Object.keys(addImports).length) {    
    root
      .find(j.Program)
      .forEach(path => {
        let importAddIndex = 0
        path.value.body.forEach((item, index) => {
          if (item.type === 'ImportDeclaration') {
            importAddIndex = index + 1
          }
        })
        each(addImports, (value) => {
          path.value.body.splice(importAddIndex, 0, value)
          importAddIndex++
        })
      })
  }

  return root.toSource();
}

module.exports.parser = 'babylon'