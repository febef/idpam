/** Create one semantic GitLab release and expose its tag to image promotion. */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import semanticRelease from 'semantic-release';

if (process.env.CI_COMMIT_BRANCH !== 'main') throw new Error('Releases may run only on main');

const result = await semanticRelease();
let releaseTag = result?.nextRelease?.gitTag ?? '';

// A retried job must reuse the tag already attached to this exact commit.
if (!releaseTag) {
  const tags = execFileSync('git', ['tag', '--points-at', 'HEAD', '--list', 'v*'], { encoding: 'utf8' })
    .trim().split('\n').filter((tag) => /^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/u.test(tag));
  if (tags.length > 1) throw new Error('Multiple semantic versions point at this commit');
  releaseTag = tags[0] ?? '';
}

if (releaseTag && !/^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/u.test(releaseTag)) {
  throw new Error(`Unexpected release tag: ${releaseTag}`);
}

writeFileSync('release.env', `RELEASE_TAG=${releaseTag}\n`);
process.stdout.write(releaseTag ? `Release ${releaseTag} ready for image tagging.\n` : 'No semantic release.\n');
