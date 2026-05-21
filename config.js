export const portalproofConfig = {
  appName: "PortalProof Market",
  networkName: "Portaldot",
  rpcEndpoint: "wss://mainnet.portaldot.io",
  explorerUrl: "https://www.portaldot.io/#/explorer",
  genesisHash: "0x83b5212c69f85f3996f8696bb35bf913af51b176a5f53d0a74fd3a83dc0b8a54",
  tokenSymbol: "POT",
  tokenDecimals: 14,
  ss58Format: 42,

  // Fill these after `cargo contract build` and deployment.
  contractAddress: "",
  contractMetadataUrl: "./contracts/portalproof_escrow/target/ink/portalproof_escrow.json",
  queryAccount: "5CHvEZNsgxvbVMCKXYwC4dLw9to35EEFhvYZF4FdfCNZGrvQ",

  // Keep enabled until the deployed contract address and metadata are available.
  mockFallback: true,
};
