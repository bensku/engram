module.exports = {
    'env': {
        'browser': true,
        'es2022': true
    },
    'extends': [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:prettier/recommended'
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaFeatures': {
            'jsx': true
        },
        'ecmaVersion': 13,
        'sourceType': 'module',
        'project': './frontend/tsconfig.json'
    },
    'settings': {
        'react': {
            'version': 'detect'
        }
    },
    'rules': {
        'react/react-in-jsx-scope': 'off',
        'react/no-unknown-property': 'off', // TypeScript handles this
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                'args': 'all',
                'argsIgnorePattern': '^_',
                'caughtErrors': 'all',
                'caughtErrorsIgnorePattern': '^_',
                'destructuredArrayIgnorePattern': '^_',
                'varsIgnorePattern': '^_',
                'ignoreRestSiblings': true
            }
        ]
    }
};
