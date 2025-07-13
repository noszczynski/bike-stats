/**
 * @type{import("prettier").Options}
 **/
module.exports = {
    singleQuote: false,
    tabWidth: 4,
    useTabs: false,
    printWidth: 100,
    arrowParens: "avoid",
    trailingComma: "all",
    overrides: [
        {
            files: ["**/*.json", "**/*.yml", "**/*.yaml"],
            options: {
                tabWidth: 2,
            },
        },
        {
            files: ["**/*.md"],
            options: {
                requirePragma: true,
            },
        },
    ],
    importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
    importOrderTypeScriptVersion: "5.0.0",
    importOrder: [
        "^(react)$",
        "<THIRD_PARTY_MODULES>",
        "",
        "^components(/.*|$)",
        "",
        "^ui(/.*|$)",
        "",
        "^actions(?:/.*)?$",
        "^assets(?:/.*)?$",
        "^constants(?:/.*)?$",
        "^epics(?:/.*)?$",
        "^helpers(?:/.*)?$",
        "^hooks(?:/.*)?$",
        "^mocks(?:/.*)?$",
        "^models(?:/.*)?$",
        "^pages(?:/.*)?$",
        "^reducers(?:/.*)?$",
        "^selectors(?:/.*)?$",
        "^services(?:/.*)?$",
        "^store(?:/.*)?$",
        "^styles(?:/.*)?$",
        "^tests(?:/.*)?$",
        "^translations(?:/.*)?$",
        "^types(?:/.*)?$",
        "^utils(?:/.*)?$",
        "^[./]",
        "",
    ],
    plugins: ["@ianvs/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],
};
