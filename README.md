# Clutter extension for VS Code 

Clutter `[#tag#]` syntax highlighting, auto-completion, and more.

## Development

Run `npm install` first.

### Running tests

```sh
npx jest
```

### Release

To create a new release, bump version number in package.json, then follow the [official instructions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

### Local installation

The extension can be run manually from VS Code (using the "Run" command), alternatively, the `vsix` package can be
installed locally.

To install the `vsix` locally:

1. Select Extensions `(Ctrl + Shift + X)`
2. Open `More Action` menu (ellipsis on the top) and click `Install from VSIX…`
3. Locate VSIX file and select.
4. Reload VSCode.