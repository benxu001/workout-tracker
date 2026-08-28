// The Vercel edge runtime exposes env vars on a Node-style process.env but is
// not Node, so declare just that surface instead of pulling in @types/node.
declare const process: { env: Record<string, string | undefined> }
