'use strict';

jest.autoMockOff();
const defineTest = require('jscodeshift/dist/testUtils').defineTest;

defineTest(__dirname, 'convert-base-classes', null, 'global');
defineTest(__dirname, 'convert-base-classes', null, 'require-default');
defineTest(__dirname, 'convert-base-classes', null, 'require-default-customname');
defineTest(__dirname, 'convert-base-classes', null, 'import-default');
defineTest(__dirname, 'convert-base-classes', null, 'import-named');
defineTest(__dirname, 'convert-base-classes', null, 'known-decorators');
defineTest(__dirname, 'convert-base-classes', null, 'known-decorators-noimport');
defineTest(__dirname, 'convert-base-classes', null, 'class-expression');
