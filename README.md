# nextbone-transforms

[jscodeshift](https://github.com/facebook/jscodeshift) transforms to convert from Backbone to Nextbone

### Features

 - Converts from Backbone `extend` class system to ES classes
 - Move computed/validation definitions to decorator syntax
 - Converts Marionette View to a `Component` descendant class
 - Supports 'backbone', 'marionette.routing', 'backbone.radio' classes


### Usage

> Highly recommended to backup or commit all changes before running the transform

Install jscodeshift

    $ npm install -g jscodeshift


Run transform

    $ jscodeshift -t  https://raw.githubusercontent.com/blikblum/nextbone-transforms/master/convert-base-classes.js <path>