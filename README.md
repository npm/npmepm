# npme Post Mortem

[![Build Status][travis-image]][travis-url]
[![NPM version][npm-image]][npm-url]

Utilities for inspecting npme support bundles

# Dependencies
The usual suspects:
- Node.js 8+
- npm 5+

Install globally. May need to say please (sudo).
```
$ npm i -g npmepm
```

# Usage

List the available commands
```
$ npmepm
```

See usage of a command
```
$ npmepm <command> --help
```

Run a command
```
$ npmepm <command> <support-bundle>
```

[travis-url]: https://travis-ci.org/npm/npmepm
[travis-image]: https://img.shields.io/travis/npm/npmepm/master.svg
[npm-url]: https://www.npmjs.com/package/npmepm
[npm-image]: https://img.shields.io/npm/v/npmepm.svg
