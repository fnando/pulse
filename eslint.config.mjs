import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default defineConfig([
  { ignores: ["dist/**/*", "**/prettier.config.js"] },
  { files: ["src/**/*.ts"] },
  { files: ["src/**/*.js"], languageOptions: { sourceType: "script" } },
  {
    files: ["src/**/*.ts"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["src/**/*.ts"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  tseslint.configs.recommended,
]);
