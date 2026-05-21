import { portalproofConfig } from "./config.js";

const POLKADOT_API_URL = "https://cdn.jsdelivr.net/npm/@polkadot/api@latest/+esm";
const POLKADOT_API_CONTRACT_URL = "https://cdn.jsdelivr.net/npm/@polkadot/api-contract@latest/+esm";
const POLKADOT_EXTENSION_URL = "https://cdn.jsdelivr.net/npm/@polkadot/extension-dapp@latest/+esm";

function toHash32(input) {
  const text = String(input ?? "");
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  const out = new Uint8Array(32);

  for (let i = 0; i < bytes.length; i += 1) {
    out[i % 32] = (out[i % 32] + bytes[i] + i) % 256;
  }

  return Array.from(out);
}

function toLocalIdNumber(id) {
  const text = String(id ?? "0");
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : Number(text || 0);
}

function codecToHex(value) {
  if (value == null) {
    return "";
  }

  if (typeof value.toHex === "function") {
    return value.toHex();
  }

  if (typeof value.toU8a === "function") {
    return `0x${Array.from(value.toU8a())
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")}`;
  }

  if (Array.isArray(value)) {
    return `0x${value.map((byte) => Number(byte).toString(16).padStart(2, "0")).join("")}`;
  }

  return String(value);
}

function normalizeOrder(order) {
  if (!order) {
    return null;
  }

  return {
    orderId: Number(order.orderId?.toString?.() ?? order.order_id?.toString?.() ?? order.orderId ?? order.order_id ?? 0),
    serviceId: Number(order.serviceId?.toString?.() ?? order.service_id?.toString?.() ?? order.serviceId ?? order.service_id ?? 0),
    buyer: order.buyer?.toString?.() ?? String(order.buyer ?? ""),
    seller: order.seller?.toString?.() ?? String(order.seller ?? ""),
    amount: Number(order.amount?.toString?.() ?? order.amount ?? 0),
    status: order.status?.toString?.() ?? String(order.status ?? ""),
    requirementHash: codecToHex(order.requirementHash ?? order.requirement_hash),
    deliveryHash: codecToHex(order.deliveryHash ?? order.delivery_hash),
    metadataUriHash: codecToHex(order.metadataUriHash ?? order.metadata_uri_hash),
    createdAt: Number(order.createdAt?.toString?.() ?? order.created_at?.toString?.() ?? order.createdAt ?? order.created_at ?? 0),
    fundedAt: Number(order.fundedAt?.toString?.() ?? order.funded_at?.toString?.() ?? order.fundedAt ?? order.funded_at ?? 0),
    deliveredAt: Number(order.deliveredAt?.toString?.() ?? order.delivered_at?.toString?.() ?? order.deliveredAt ?? order.delivered_at ?? 0),
    acceptedAt: Number(order.acceptedAt?.toString?.() ?? order.accepted_at?.toString?.() ?? order.acceptedAt ?? order.accepted_at ?? 0),
    releasedAt: Number(order.releasedAt?.toString?.() ?? order.released_at?.toString?.() ?? order.releasedAt ?? order.released_at ?? 0),
  };
}

function normalizeService(service) {
  if (!service) {
    return null;
  }

  return {
    serviceId: Number(service.serviceId?.toString?.() ?? service.service_id?.toString?.() ?? service.serviceId ?? service.service_id ?? 0),
    seller: service.seller?.toString?.() ?? String(service.seller ?? ""),
    metadataHash: codecToHex(service.metadataHash ?? service.metadata_hash),
    price: Number(service.price?.toString?.() ?? service.price ?? 0),
    category: service.category?.toString?.() ?? String(service.category ?? ""),
    active: Boolean(service.active?.toString?.() === "true" ? true : service.active ?? false),
  };
}

function toPlanck(amount) {
  const [whole, fraction = ""] = String(amount).split(".");
  const decimals = portalproofConfig.tokenDecimals;
  const paddedFraction = `${fraction}${"0".repeat(decimals)}`.slice(0, decimals);
  return `${whole || "0"}${paddedFraction}`.replace(/^0+(?=\d)/, "");
}

function toInkCategory(category) {
  const map = {
    Agent: { agent: null },
    Skill: { skill: null },
    "MCP Server": { mcpServer: null },
    Cybersecurity: { cybersecurity: null },
    "Smart Contract Audit": { smartContractAudit: null },
    DevOps: { devOps: null },
    "Enterprise Delivery": { enterpriseDelivery: null },
    RWA: { rwa: null },
    "DAO Tool": { daoTool: null },
  };

  return map[category] ?? map.Agent;
}

async function loadPolkadotModules() {
  const [{ ApiPromise, WsProvider }, { web3Accounts, web3Enable, web3FromAddress }, { ContractPromise }] =
    await Promise.all([
      import(POLKADOT_API_URL),
      import(POLKADOT_EXTENSION_URL),
      import(POLKADOT_API_CONTRACT_URL),
    ]);

  return {
    ApiPromise,
    WsProvider,
    ContractPromise,
    web3Accounts,
    web3Enable,
    web3FromAddress,
  };
}

function decodeOptionValue(output) {
  if (!output) {
    return null;
  }

  if (typeof output.isNone === "boolean") {
    if (output.isNone) {
      return null;
    }

    return decodeOptionValue(output.unwrap());
  }

  if (typeof output.unwrap === "function" && typeof output.isSome === "boolean") {
    if (!output.isSome) {
      return null;
    }

    return decodeOptionValue(output.unwrap());
  }

  return output;
}

async function signAndSend(tx, account, injector) {
  return new Promise((resolve, reject) => {
    let unsubscribe = null;

    tx.signAndSend(account.address, { signer: injector.signer }, (result) => {
      if (result.status.isInBlock || result.status.isFinalized) {
        const failed = result.dispatchError;
        if (unsubscribe) unsubscribe();

        if (failed) {
          reject(new Error(failed.toString()));
          return;
        }

        resolve({
          status: result.status.type,
          txHash: tx.hash.toHex(),
          blockHash: result.status.asInBlock?.toHex?.() ?? result.status.asFinalized?.toHex?.(),
          events: result.events.map(({ event }) => ({
            section: event.section,
            method: event.method,
            data: event.data.map((item) => item.toString()),
          })),
          contractEvents: result.contractEvents?.map((event) => ({
            name: event.name,
            args: event.args?.map((item) => item?.toString?.() ?? String(item)),
          })) ?? [],
        });
      }
    })
      .then((unsub) => {
        unsubscribe = unsub;
      })
      .catch(reject);
  });
}

class MockPortalproofContractClient {
  constructor() {
    this.mode = "mock";
    this.account = null;
  }

  async connectWallet() {
    this.account = {
      address: "0xB7C2...8811",
      name: "Mock buyer",
    };
    return this.account;
  }

  async createService(service) {
    return {
      mode: this.mode,
      serviceId: service.id,
      txHash: `mock-service-${Date.now()}`,
    };
  }

  async createOrder(order) {
    return {
      mode: this.mode,
      orderId: order.id,
      txHash: `mock-order-${Date.now()}`,
    };
  }

  async fundEscrow(order) {
    return {
      mode: this.mode,
      txHash: `mock-fund-${order.id}-${Date.now()}`,
    };
  }

  async acceptOrder(orderId) {
    return { mode: this.mode, txHash: `mock-accept-order-${orderId}-${Date.now()}` };
  }

  async submitDelivery(orderId, proofHash, metadataHash) {
    return {
      mode: this.mode,
      txHash: `mock-submit-${orderId}-${proofHash}-${metadataHash}-${Date.now()}`,
    };
  }

  async acceptDelivery(orderId) {
    return { mode: this.mode, txHash: `mock-accept-delivery-${orderId}-${Date.now()}` };
  }

  async releasePayment(orderId) {
    return { mode: this.mode, txHash: `mock-release-${orderId}-${Date.now()}` };
  }
}

class LivePortalproofContractClient {
  constructor(config) {
    this.mode = "live";
    this.config = config;
    this.api = null;
    this.contract = null;
    this.account = null;
    this.injector = null;
    this.modules = null;
  }

  async init() {
    if (!this.config.contractAddress) {
      throw new Error("Missing PortalProof contract address in config.js");
    }

    this.modules = await loadPolkadotModules();
    const { ApiPromise, WsProvider, ContractPromise } = this.modules;
    const provider = new WsProvider(this.config.rpcEndpoint);
    this.api = await ApiPromise.create({ provider });

    const metadata = await fetch(this.config.contractMetadataUrl).then((response) => {
      if (!response.ok) {
        throw new Error(`Cannot load contract metadata: ${response.status}`);
      }
      return response.json();
    });

    this.contract = new ContractPromise(this.api, metadata, this.config.contractAddress);
  }

  async connectWallet() {
    if (!this.modules) {
      await this.init();
    }

    const extensions = await this.modules.web3Enable(this.config.appName);
    if (!extensions.length) {
      throw new Error("No Polkadot wallet extension approved");
    }

    const accounts = await this.modules.web3Accounts();
    if (!accounts.length) {
      throw new Error("No wallet accounts available");
    }

    this.account = accounts[0];
    this.injector = await this.modules.web3FromAddress(this.account.address);
    return this.account;
  }

  async ensureReady() {
    if (!this.contract || !this.api) {
      await this.init();
    }
    if (!this.account || !this.injector) {
      await this.connectWallet();
    }
  }

  async tx(method, args = [], options = {}) {
    await this.ensureReady();
    const gasLimit = this.api.registry.createType("WeightV2", {
      refTime: options.refTime ?? "10000000000",
      proofSize: options.proofSize ?? "1000000",
    });

    const tx = this.contract.tx[method](
      {
        gasLimit,
        storageDepositLimit: null,
        value: options.value ?? 0,
      },
      ...args,
    );

    return signAndSend(tx, this.account, this.injector);
  }

  async createService(service) {
    return this.tx("create_service", [
      toHash32(service.metadataHash ?? service.title),
      String(service.price),
      toInkCategory(service.category),
    ]);
  }

  async createOrder(order) {
    return this.tx("create_order", [
      order.chainServiceId ?? toLocalIdNumber(order.serviceId),
      toHash32(order.requirementHash ?? order.id),
    ]);
  }

  async fundEscrow(order) {
    return this.tx("fund_escrow", [order.chainOrderId ?? toLocalIdNumber(order.id)], {
      value: toPlanck(order.amount),
    });
  }

  async acceptOrder(orderId) {
    return this.tx("accept_order", [toLocalIdNumber(orderId)]);
  }

  async submitDelivery(orderId, proofHash, metadataHash = proofHash) {
    return this.tx("submit_delivery", [toLocalIdNumber(orderId), toHash32(proofHash), toHash32(metadataHash)]);
  }

  async acceptDelivery(orderId) {
    return this.tx("accept_delivery", [toLocalIdNumber(orderId)]);
  }

  async releasePayment(orderId) {
    return this.tx("release_payment", [toLocalIdNumber(orderId)]);
  }

  async getService(serviceId) {
    await this.ensureReady();
    const caller = this.account?.address ?? this.config.queryAccount;
    if (!caller) {
      throw new Error("Connect a wallet or set queryAccount in config.js to read live state");
    }

    const gasLimit = this.api.registry.createType("WeightV2", {
      refTime: "10000000000",
      proofSize: "1000000",
    });

    const { output, result } = await this.contract.query.get_service(
      caller,
      { gasLimit, storageDepositLimit: null, value: 0 },
      toLocalIdNumber(serviceId),
    );

    if (result?.isErr) {
      throw new Error(result.asErr.toString());
    }

    return normalizeService(decodeOptionValue(output));
  }

  async getOrder(orderId) {
    await this.ensureReady();
    const caller = this.account?.address ?? this.config.queryAccount;
    if (!caller) {
      throw new Error("Connect a wallet or set queryAccount in config.js to read live state");
    }

    const gasLimit = this.api.registry.createType("WeightV2", {
      refTime: "10000000000",
      proofSize: "1000000",
    });

    const { output, result } = await this.contract.query.get_order(
      caller,
      { gasLimit, storageDepositLimit: null, value: 0 },
      toLocalIdNumber(orderId),
    );

    if (result?.isErr) {
      throw new Error(result.asErr.toString());
    }

    return normalizeOrder(decodeOptionValue(output));
  }

  async getOwner() {
    await this.ensureReady();
    const caller = this.account?.address ?? this.config.queryAccount;
    if (!caller) {
      throw new Error("Connect a wallet or set queryAccount in config.js to read live state");
    }

    const gasLimit = this.api.registry.createType("WeightV2", {
      refTime: "10000000000",
      proofSize: "1000000",
    });

    const { output, result } = await this.contract.query.get_owner(
      caller,
      { gasLimit, storageDepositLimit: null, value: 0 },
    );

    if (result?.isErr) {
      throw new Error(result.asErr.toString());
    }

    return output?.toString?.() ?? String(output ?? "");
  }
}

export function createPortalproofClient(config = portalproofConfig) {
  if (!config.contractAddress || config.mockFallback) {
    return new MockPortalproofContractClient();
  }

  return new LivePortalproofContractClient(config);
}

export { portalproofConfig, toHash32, toInkCategory, toLocalIdNumber, toPlanck };
