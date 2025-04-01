# Release Process

1. Make sure your git stage is clean.
2. Update `package.json` with the new version that will be released.
3. Update `CHANGELOG.md` with the latest changes.
4. Run `npm run build` to build the project.
5. Make a commit like `Bump up version (v0.0.0)`.
6. Add a tag like `git tag v0.0.0`.
7. Push the commit and tag to GitHub with `git push --follow-tags`.
8. Publish the package to npm with `npm publish --access public`.
