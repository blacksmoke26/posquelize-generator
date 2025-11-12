
# ChangeLog

## v0.0.1 - 2025-11-12

### feat

* Add `--no-repositories` CLI flag to skip repository file generation and update config import path. Fixes issue with repository generation logic in filtering workflows. ([26c152d](http://github.com/blacksmoke26/posquelize-generator/commit/26c152d))
* Add generator options typings for migrations, diagrams, and repositories ([b4f7fbc](http://github.com/blacksmoke26/posquelize-generator/commit/b4f7fbc))
* Add disabling repo files generation support, remove path import, add property doc comment ([ea603a9](http://github.com/blacksmoke26/posquelize-generator/commit/ea603a9))
* Add no-diagram and no-migrations options ([8d8c919](http://github.com/blacksmoke26/posquelize-generator/commit/8d8c919))
* Add schema/table filtering for migrations ([7fbaf17](http://github.com/blacksmoke26/posquelize-generator/commit/7fbaf17))
* Add generate options to migration generator and conditional execution for migration components ([3153d77](http://github.com/blacksmoke26/posquelize-generator/commit/3153d77))
* Add schemas parameter to migration functions to enable schema-based filtering ([b677509](http://github.com/blacksmoke26/posquelize-generator/commit/b677509))
* Add `GenerateRelationFilters` interface and support filtering relationships by schema/table names. ([0a7c81e](http://github.com/blacksmoke26/posquelize-generator/commit/0a7c81e))
* Add configuration options for migration and diagram generation, refactor code structure to separate these functionalities into dedicated methods ([032ffe1](http://github.com/blacksmoke26/posquelize-generator/commit/032ffe1))
* Add Babel config and REPL script ([0363a6b](http://github.com/blacksmoke26/posquelize-generator/commit/0363a6b))
* 842d0f1 Merge pull request #1 from blacksmoke26/feat/json-to-ts ([842d0f1](http://github.com/blacksmoke26/posquelize-generator/commit/842d0f1))
* Convert JSON to TypeScript interface asynchronously using new converter ([460c06b](http://github.com/blacksmoke26/posquelize-generator/commit/460c06b))
* Add a utility class to convert JSON objects into TypeScript interfaces with support for nested structures, arrays, and circular references ([27b71e5](http://github.com/blacksmoke26/posquelize-generator/commit/27b71e5))
* Add JSON to flattened TypeScript converter ([fbc174d](http://github.com/blacksmoke26/posquelize-generator/commit/fbc174d))


### fix

* Change migrations option to object Update `migrations` configuration from boolean to object to support advanced migration settings. ([3c02a78](http://github.com/blacksmoke26/posquelize-generator/commit/3c02a78))
* 5a870b7 (origin/develop) Merge pull request #3 from blacksmoke26/fix/broken-filtering ([5a870b7](http://github.com/blacksmoke26/posquelize-generator/commit/5a870b7))
* Update migrations type to use direct reference ([e15060b](http://github.com/blacksmoke26/posquelize-generator/commit/e15060b))
* Use tables instead of schemas in filter ([2f04858](http://github.com/blacksmoke26/posquelize-generator/commit/2f04858))
* Remove await from jsonToInterface call ([ec1a529](http://github.com/blacksmoke26/posquelize-generator/commit/ec1a529))
* Return default interfaces on invalid input instead of errors ([0be83a8](http://github.com/blacksmoke26/posquelize-generator/commit/0be83a8))


### docs

* Add documentation for the Posquelize programmatic API, including basic usage, advanced configuration options, and error handling examples. This enables developers to integrate database generation into their applications with fine-grained control over output and configuration. ([a6f8de9](http://github.com/blacksmoke26/posquelize-generator/commit/a6f8de9))


### style

* Add space before asterisks in comments ([00d0e7f](http://github.com/blacksmoke26/posquelize-generator/commit/00d0e7f))


### refactor

* Import GeneratorOptions as type ([d1b935c](http://github.com/blacksmoke26/posquelize-generator/commit/d1b935c))
* Add option to configure RepoBase generation in TemplateWriter ([5307ed2](http://github.com/blacksmoke26/posquelize-generator/commit/5307ed2))
* Rename schemaName to allowedSchemas and add filterSchemas helper, improve schema filtering logic ([805cf6f](http://github.com/blacksmoke26/posquelize-generator/commit/805cf6f))
* Update schema filtering logic to exclude system schemas correctly ([92968f3](http://github.com/blacksmoke26/posquelize-generator/commit/92968f3))
* Update reference due to directory rename ([c4f3388](http://github.com/blacksmoke26/posquelize-generator/commit/c4f3388))
* Move `scripts` to `core` directory ([7b09541](http://github.com/blacksmoke26/posquelize-generator/commit/7b09541))
* Remove dotenv import ([68f3898](http://github.com/blacksmoke26/posquelize-generator/commit/68f3898))
* Add error handling when cleaning root directory ([5d61826](http://github.com/blacksmoke26/posquelize-generator/commit/5d61826))
* Make jsonToInterface synchronous and adjust return type ([457af3a](http://github.com/blacksmoke26/posquelize-generator/commit/457af3a))
* Fix indentation issues and remove prettier formatting from json to ts converters ([7192980](http://github.com/blacksmoke26/posquelize-generator/commit/7192980))
* Make JSON to TypeScript conversion asynchronous ([9eb2a11](http://github.com/blacksmoke26/posquelize-generator/commit/9eb2a11))


### ci

* Update dependencies (remove json-ts, add prettier) ([bad671f](http://github.com/blacksmoke26/posquelize-generator/commit/bad671f))

