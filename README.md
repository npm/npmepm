# npme Post Mortem
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
$ npmepm <command> <support-bundle-directory>
```

# Wish List
- Assume CWD is the root of the support bundle.
- Handling of support bundles without extraction.

