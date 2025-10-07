module.exports = {
    env: {
        browser: true,
        node: true,
    },
    parser: "@typescript-eslint/parser",
    settings: {
        react: {
            version: "detect",
        },
        "import/resolver": {
            node: {
                paths: ["src"],
            },
        },
    },
    plugins: [
        "unused-imports",
        "@typescript-eslint",
        "prettier",
        "react",
        "react-hooks",
        "import",
        "jsx-a11y",
    ],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended",
        "plugin:react/recommended",
        "plugin:@next/next/recommended",
        "plugin:jsx-a11y/recommended",
        "prettier",
        "plugin:react/jsx-runtime",
    ],
    rules: {
        "no-undef": "off",
        "no-var": "off",
        "@typescript-eslint/no-namespace": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/prefer-interface": "off",
        "@typescript-eslint/explicit-member-accessibility": "off",
        "@typescript-eslint/no-parameter-properties": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/camelcase": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-unused-vars": [
            "error",
            {
                ignoreRestSiblings: true,
                varsIgnorePattern: "^_",
                argsIgnorePattern: "^_",
            },
        ],
        // "@typescript-eslint/consistent-type-imports": [
        //     "warn",
        //     {
        //         prefer: "type-imports",
        //         disallowTypeAnnotations: false,
        //         fixStyle: "inline-type-imports",
        //     },
        // ],
        // "import/consistent-type-specifier-style": ["warn", "prefer-inline"],
        // "import/no-duplicates": ["warn", { "prefer-inline": true }],
        "no-empty": "warn",
        "react/prop-types": "off",
        "react/display-name": "off",
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "error",
        "react/jsx-curly-brace-presence": [
            "error",
            {
                props: "never",
                children: "never",
            },
        ],
        "no-unused-vars": "off",
        "unused-imports/no-unused-imports": "warn",
        "unused-imports/no-unused-vars": [
            "warn",
            {
                vars: "all",
                varsIgnorePattern: "^_",
                args: "after-used",
                argsIgnorePattern: "^_",
                ignoreRestSiblings: true,
            },
        ],
        // Disable jsx-a11y rules that are problematic for UI components
        "jsx-a11y/heading-has-content": "off",
        "jsx-a11y/anchor-has-content": "off",
    },
};
