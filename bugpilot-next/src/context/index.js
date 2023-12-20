async function getContext() {
  const sessionContext = await getSessionContext();
  const vercelContext = {
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
  };

  return { ...sessionContext, ...vercelContext };
}
