export const portalproofConfig = {
  appName: "PortalProof Market",
  networkName: "Portaldot",
  rpcEndpoint: "wss://mainnet.portaldot.io",
  explorerUrl: "https://www.portaldot.io/#/explorer",
  tokenSymbol: "POT",
  tokenDecimals: 14,
  ss58Format: 42,

  // Fill these after `cargo contract build` and deployment.
  contractAddress: "",
  contractMetadataUrl: "./contracts/portalproof_escrow/target/ink/portalproof_escrow.json",
  queryAccount: "",

  // Keep enabled until the deployed contract address and metadata are available.
  mockFallback: true,
};
