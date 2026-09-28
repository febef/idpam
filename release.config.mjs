/** Immutable source and image releases from the protected main branch. */
export default {
  branches: ['main'],
  tagFormat: 'v${version}',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    ['@semantic-release/gitlab', { useJobToken: true }],
  ],
};
