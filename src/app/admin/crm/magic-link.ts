type AdminSession = { authenticated: boolean; email?: string };
type BootstrapDependencies = {
  location: { hash: string; pathname: string; search: string };
  replaceUrl: (url: string) => void;
  exchange: (accessToken: string) => Promise<unknown>;
  readSession: () => Promise<AdminSession>;
};

// One bootstrap promise per mounted screen, including React StrictMode effect
// replay. Tokens remain in memory only until their server-side exchange.
export function createSessionBootstrap(dependencies: BootstrapDependencies) {
  let pending: Promise<AdminSession> | undefined;
  return () => {
    if (pending) return pending;
    const parameters = new URLSearchParams(dependencies.location.hash.slice(1));
    const accessToken = parameters.get("access_token");
    const hasError = parameters.has("error") || parameters.has("error_description");
    if (dependencies.location.hash) {
      dependencies.replaceUrl(dependencies.location.pathname + dependencies.location.search);
    }
    pending = (async () => {
      // Provider error descriptions are untrusted URL content. Never render them.
      if (hasError || (accessToken !== null && (!accessToken || accessToken.length > 16384))) {
        throw new Error("로그인 링크가 만료되었거나 올바르지 않아요. 새 링크를 요청해 주세요.");
      }
      if (accessToken) await dependencies.exchange(accessToken);
      const session = await dependencies.readSession();
      if (accessToken && !session.authenticated) {
        throw new Error("로그인을 확인하지 못했어요. 새 로그인 링크를 요청해 주세요.");
      }
      return session;
    })();
    return pending;
  };
}
