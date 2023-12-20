module.exports = function () {
  return {
    gitBranchName: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF,
    gitCommitMessage: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE,
    gitCommitSHA: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    gitRepoId: NEXT_PUBLIC_VERCEL_GIT_REPO_ID,
    gitRepoSlug: process.env.VERCEL_GIT_REPO_SLUG,
  };
};
