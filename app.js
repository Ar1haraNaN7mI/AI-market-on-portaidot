import { createPortalproofClient, portalproofConfig, toHash32, toLocalIdNumber } from "./portalproof-contract.js";

const walletButton = document.getElementById("walletButton");
const walletModal = document.getElementById("walletModal");
const walletForm = document.getElementById("walletForm");
const walletAddressInput = document.getElementById("walletAddressInput");
const walletLabelInput = document.getElementById("walletLabelInput");
const walletModalClose = document.getElementById("walletModalClose");
const walletCancelButton = document.getElementById("walletCancelButton");
const disconnectModal = document.getElementById("disconnectModal");
const disconnectCancelButton = document.getElementById("disconnectCancelButton");
const disconnectConfirmButton = document.getElementById("disconnectConfirmButton");
const openExplorerButton = document.getElementById("openExplorerButton");
const globalSearch = document.getElementById("globalSearch");
const categoryFilter = document.getElementById("categoryFilter");
const deliveryFilter = document.getElementById("deliveryFilter");
const paymentFilter = document.getElementById("paymentFilter");
const verificationFilter = document.getElementById("verificationFilter");
const sellerFilter = document.getElementById("sellerFilter");
const serviceGrid = document.getElementById("serviceGrid");
const agentGrid = document.getElementById("agentGrid");
const statsGrid = document.getElementById("statsGrid");
const orderForm = document.getElementById("orderForm");
const orderServiceSelect = document.getElementById("orderServiceSelect");
const explorerSearch = document.getElementById("explorerSearch");
const syncChainButton = document.getElementById("syncChainButton");
const openEventsApiButton = document.getElementById("openEventsApiButton");
const resetDemoButton = document.getElementById("resetDemoButton");
const explorerBody = document.getElementById("explorerBody");
const explorerSummary = document.getElementById("explorerSummary");
const serviceForm = document.getElementById("serviceForm");
const incomingOrders = document.getElementById("incomingOrders");
const buyerOrders = document.getElementById("buyerOrders");
const pendingDeliveries = document.getElementById("pendingDeliveries");
const orderAmountInput = document.getElementById("orderAmount");
const escrowBalance = document.getElementById("escrowBalance");
const sampleStatus = document.getElementById("sampleStatus");
const sampleServiceTitle = document.getElementById("sampleServiceTitle");
const sampleAmount = document.getElementById("sampleAmount");
const sampleProof = document.getElementById("sampleProof");
const progressFill = document.getElementById("progressFill");
const acceptOrderBtn = document.getElementById("acceptOrderBtn");
const submitProofBtn = document.getElementById("submitProofBtn");
const acceptDeliveryBtn = document.getElementById("acceptDeliveryBtn");
const releaseBtn = document.getElementById("releaseBtn");
const networkName = document.getElementById("networkName");
const chainMode = document.getElementById("chainMode");
const portalproofClient = createPortalproofClient(portalproofConfig);
let liveSyncInFlight = false;
const DEFAULT_WALLET_ADDRESS = "0xB7C2...8811";
let connectedWalletAddress = DEFAULT_WALLET_ADDRESS;
const STORAGE_KEY = "portalproof-market-state-v1";
const WALLET_CACHE_KEY = "portalproof-manual-wallet";

const categories = [
  "Agent",
  "Skill",
  "MCP Server",
  "Cybersecurity",
  "Smart Contract Audit",
  "DevOps",
  "Enterprise Delivery",
  "RWA",
  "DAO Tool",
];

const defaultServices = [
  {
    id: "SVC-001",
    title: "Portaldot Smart Contract Security Review",
    category: "Cybersecurity",
    deliveryType: "Report",
    paymentType: "Milestone",
    verification: "Hash Proof",
    sellerStatus: "Verified Seller",
    price: 50,
    deliveryDays: 3,
    completedOrders: 18,
    rating: "4.9",
    seller: "0x9A2C...F1D3",
    summary: "Authorized review of ink! contracts with report hash and remediation notes.",
    deliverables: "PDF audit report, remediation checklist, verification hash",
    allowedUse: "Authorized security testing only",
  },
  {
    id: "SVC-002",
    title: "Enterprise Agent Workflow Pack",
    category: "Agent",
    deliveryType: "Code Repository",
    paymentType: "Fixed Price",
    verification: "Git Commit",
    sellerStatus: "Enterprise Ready",
    price: 80,
    deliveryDays: 5,
    completedOrders: 12,
    rating: "4.8",
    seller: "0x12AB...7E41",
    summary: "Reusable agent workflow for internal ops, support, and repetitive enterprise tasks.",
    deliverables: "Repo link, deployment notes, workflow manifest",
    allowedUse: "Internal automation and workflow orchestration",
  },
  {
    id: "SVC-003",
    title: "MCP Delivery Tracking Server",
    category: "MCP Server",
    deliveryType: "Private Deployment",
    paymentType: "Fixed Price",
    verification: "Metadata JSON",
    sellerStatus: "Verified Seller",
    price: 35,
    deliveryDays: 2,
    completedOrders: 9,
    rating: "4.7",
    seller: "0xA441...5BB2",
    summary: "Private MCP server for service tracking, proof submission, and delivery logging.",
    deliverables: "Deployment package, config file, onboarding hash",
    allowedUse: "Trusted internal tooling and integrations",
  },
  {
    id: "SVC-004",
    title: "Supply Chain Scan and SBOM Pack",
    category: "Cybersecurity",
    deliveryType: "Security Rule Pack",
    paymentType: "Bounty",
    verification: "Signed Report",
    sellerStatus: "Verified Seller",
    price: 30,
    deliveryDays: 2,
    completedOrders: 15,
    rating: "4.9",
    seller: "0xC31E...9D07",
    summary: "SBOM generation, dependency scan, and remediation guidance for release pipelines.",
    deliverables: "SBOM, scan output, signed summary",
    allowedUse: "Defensive security and supply chain validation only",
  },
  {
    id: "SVC-005",
    title: "DAO Ops Automation Bundle",
    category: "DAO Tool",
    deliveryType: "API",
    paymentType: "Fixed Price",
    verification: "Hash Proof",
    sellerStatus: "New Seller",
    price: 22,
    deliveryDays: 1,
    completedOrders: 4,
    rating: "4.5",
    seller: "0x77BB...08FF",
    summary: "Templates and scripts for proposals, voting reports, and treasury visibility.",
    deliverables: "API bundle, templates, usage notes",
    allowedUse: "Governance workflow automation",
  },
  {
    id: "SVC-006",
    title: "RWA Data Verification Adapter",
    category: "RWA",
    deliveryType: "API",
    paymentType: "Milestone",
    verification: "Contract Address",
    sellerStatus: "Enterprise Ready",
    price: 95,
    deliveryDays: 6,
    completedOrders: 11,
    rating: "4.8",
    seller: "0x4FE1...C2AB",
    summary: "Verification adapter for real-world asset records and signed operational data.",
    deliverables: "Adapter package, config, signed deployment notes",
    allowedUse: "RWA verification and reporting",
  },
  {
    id: "SVC-007",
    title: "DevOps Deployment Runbook",
    category: "DevOps",
    deliveryType: "File",
    paymentType: "Fixed Price",
    verification: "Metadata JSON",
    sellerStatus: "Verified Seller",
    price: 18,
    deliveryDays: 1,
    completedOrders: 20,
    rating: "4.9",
    seller: "0x19FE...3C2D",
    summary: "Production deployment instructions, rollback checklist, and release gates.",
    deliverables: "Runbook, shell scripts, verification hash",
    allowedUse: "Operational deployment and release management",
  },
  {
    id: "SVC-008",
    title: "Private Compliance Reporting Skill",
    category: "Skill",
    deliveryType: "File",
    paymentType: "Fixed Price",
    verification: "Hash Proof",
    sellerStatus: "New Seller",
    price: 26,
    deliveryDays: 2,
    completedOrders: 6,
    rating: "4.6",
    seller: "0xB132...F08A",
    summary: "Reusable skill for compliance summaries, policy checks, and evidence packaging.",
    deliverables: "Skill pack, sample prompts, delivery hash",
    allowedUse: "Compliance and documentation workflows",
  },
];

let services = structuredClone(defaultServices);

const defaultBuyerOrderState = [
  {
    id: "ORD-001",
    serviceId: "SVC-001",
    serviceTitle: "Portaldot Smart Contract Security Review",
    status: "Funded",
    amount: 50,
    proof: "0x2a3f...b91c",
    buyer: "0xB7C2...8811",
    seller: "0x9A2C...F1D3",
    updated: "2026-05-20 10:22",
  },
  {
    id: "ORD-002",
    serviceId: "SVC-002",
    serviceTitle: "Enterprise Agent Workflow Pack",
    status: "Delivered",
    amount: 80,
    proof: "0x4d91...a11e",
    buyer: "0xB7C2...8811",
    seller: "0x12AB...7E41",
    updated: "2026-05-20 10:41",
  },
  {
    id: "ORD-003",
    serviceId: "SVC-004",
    serviceTitle: "Supply Chain Scan and SBOM Pack",
    status: "Accepted",
    amount: 30,
    proof: "0x7c00...fa54",
    buyer: "0xB7C2...8811",
    seller: "0xC31E...9D07",
    updated: "2026-05-20 10:53",
  },
];

let buyerOrderState = structuredClone(defaultBuyerOrderState);

const defaultIncomingOrderState = [
  {
    id: "ORD-011",
    serviceTitle: "Portaldot Smart Contract Security Review",
    buyer: "0xD1C2...4A19",
    amount: 50,
    status: "Funded",
  },
  {
    id: "ORD-012",
    serviceTitle: "Supply Chain Scan and SBOM Pack",
    buyer: "0x7F22...EE12",
    amount: 30,
    status: "Delivered",
  },
  {
    id: "ORD-013",
    serviceTitle: "Private Compliance Reporting Skill",
    buyer: "0xA811...F0CC",
    amount: 26,
    status: "Created",
  },
];

let incomingOrderState = structuredClone(defaultIncomingOrderState);

const defaultExplorerRows = [
  {
    time: "10:22",
    type: "EscrowFunded",
    order: "ORD-001",
    from: "0xB7C2...8811",
    to: "0x9A2C...F1D3",
    amount: 50,
    status: "Funded",
    tx: "0x8d91...c3aa",
    serviceId: "SVC-001",
    hash: "0x2a3f...b91c",
  },
  {
    time: "10:35",
    type: "DeliverySubmitted",
    order: "ORD-002",
    from: "0x12AB...7E41",
    to: "0xB7C2...8811",
    amount: 80,
    status: "Delivered",
    tx: "0x9e21...aa19",
    serviceId: "SVC-002",
    hash: "0x4d91...a11e",
  },
  {
    time: "10:41",
    type: "DeliveryAccepted",
    order: "ORD-002",
    from: "0xB7C2...8811",
    to: "0x12AB...7E41",
    amount: 80,
    status: "Accepted",
    tx: "0x3c18...8d22",
    serviceId: "SVC-002",
    hash: "0x4d91...a11e",
  },
  {
    time: "10:53",
    type: "OrderCreated",
    order: "ORD-003",
    from: "0xB7C2...8811",
    to: "0xC31E...9D07",
    amount: 30,
    status: "Created",
    tx: "0x2b72...ae1f",
    serviceId: "SVC-004",
    hash: "0x7c00...fa54",
  },
];

let explorerRows = structuredClone(defaultExplorerRows);

const defaultSampleOrder = {
  id: "ORD-001",
  serviceId: "SVC-001",
  status: "Funded",
  amount: 50,
  proof: "0x2a3f...b91c",
};

const sampleOrder = structuredClone(defaultSampleOrder);

const filters = {
  query: "",
  category: "All",
  deliveryType: "All",
  paymentType: "All",
  verification: "All",
  sellerStatus: "All",
  explorerQuery: "",
  connected: false,
};

networkName.textContent = portalproofConfig.networkName;
chainMode.textContent = portalproofClient.mode === "live" ? "Live contract" : "Mock mode";
chainMode.classList.toggle("status-success", portalproofClient.mode === "live");
if (openExplorerButton) {
  openExplorerButton.href = portalproofConfig.explorerUrl;
}

async function saveLocalState() {
  const payload = {
    services,
    buyerOrderState,
    incomingOrderState,
    explorerRows,
    sampleOrder,
  };

  try {
    const response = await fetch("/api/state", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return;
    }
  } catch {
    // fall through to localStorage
  }

  if (typeof localStorage === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

async function loadLocalState() {
  try {
    const response = await fetch("/api/state");
    if (response.ok) {
      const payload = await response.json();
      if (payload?.exists && payload?.state) {
        const parsed = payload.state;
        services = Array.isArray(parsed.services) ? parsed.services : services;
        buyerOrderState = Array.isArray(parsed.buyerOrderState) ? parsed.buyerOrderState : buyerOrderState;
        incomingOrderState = Array.isArray(parsed.incomingOrderState) ? parsed.incomingOrderState : incomingOrderState;
        explorerRows = Array.isArray(parsed.explorerRows) ? parsed.explorerRows : explorerRows;
        Object.assign(sampleOrder, parsed.sampleOrder || {});
        return true;
      }
    }
  } catch {
    // fall through to localStorage
  }

  if (typeof localStorage === "undefined") return false;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw);
    services = Array.isArray(parsed.services) ? parsed.services : services;
    buyerOrderState = Array.isArray(parsed.buyerOrderState) ? parsed.buyerOrderState : buyerOrderState;
    incomingOrderState = Array.isArray(parsed.incomingOrderState) ? parsed.incomingOrderState : incomingOrderState;
    explorerRows = Array.isArray(parsed.explorerRows) ? parsed.explorerRows : explorerRows;
    Object.assign(sampleOrder, parsed.sampleOrder || {});
    return true;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return false;
  }
}

async function resetLocalState() {
  try {
    await fetch("/api/reset", { method: "POST" });
  } catch {
    // ignore
  }

  services = structuredClone(defaultServices);
  buyerOrderState = structuredClone(defaultBuyerOrderState);
  incomingOrderState = structuredClone(defaultIncomingOrderState);
  explorerRows = structuredClone(defaultExplorerRows);
  Object.assign(sampleOrder, structuredClone(defaultSampleOrder));
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  refreshAll();
  chainMode.textContent = portalproofClient.mode === "live" ? "Live contract" : "Mock mode";
}

function shortAddress(value) {
  return value.length > 11 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
}

function readCachedManualWallet() {
  if (typeof localStorage === "undefined") return null;
  try {
    const cached = JSON.parse(localStorage.getItem(WALLET_CACHE_KEY) || "null");
    return cached?.address ? cached : null;
  } catch {
    return null;
  }
}

function cacheManualWallet(account) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(WALLET_CACHE_KEY, JSON.stringify(account));
}

function openModal(modal, focusTarget) {
  modal.hidden = false;
  requestAnimationFrame(() => focusTarget?.focus());
}

function closeModal(modal) {
  modal.hidden = true;
}

function requestManualWallet() {
  return new Promise((resolve) => {
    const cached = readCachedManualWallet();
    const currentAddress = connectedWalletAddress === DEFAULT_WALLET_ADDRESS ? "" : connectedWalletAddress;
    walletAddressInput.value = cached?.address || currentAddress;
    walletLabelInput.value = cached?.name || "Manual wallet";

    const cleanup = () => {
      walletForm.removeEventListener("submit", onSubmit);
      walletModalClose.removeEventListener("click", onCancel);
      walletCancelButton.removeEventListener("click", onCancel);
      walletModal.removeEventListener("mousedown", onBackdrop);
      document.removeEventListener("keydown", onKeydown);
    };

    const finish = (account) => {
      cleanup();
      closeModal(walletModal);
      resolve(account);
    };

    const onSubmit = (event) => {
      event.preventDefault();
      const trimmedAddress = walletAddressInput.value.trim();
      if (!trimmedAddress) {
        walletAddressInput.focus();
        return;
      }

      const account = {
        address: trimmedAddress,
        name: walletLabelInput.value.trim() || "Manual wallet",
      };
      cacheManualWallet(account);
      finish(account);
    };

    const onCancel = () => finish(null);
    const onBackdrop = (event) => {
      if (event.target === walletModal) onCancel();
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") onCancel();
    };

    walletForm.addEventListener("submit", onSubmit);
    walletModalClose.addEventListener("click", onCancel);
    walletCancelButton.addEventListener("click", onCancel);
    walletModal.addEventListener("mousedown", onBackdrop);
    document.addEventListener("keydown", onKeydown);
    openModal(walletModal, walletAddressInput);
  });
}

function requestDisconnectConfirmation() {
  return new Promise((resolve) => {
    const cleanup = () => {
      disconnectCancelButton.removeEventListener("click", onCancel);
      disconnectConfirmButton.removeEventListener("click", onConfirm);
      disconnectModal.removeEventListener("mousedown", onBackdrop);
      document.removeEventListener("keydown", onKeydown);
    };

    const finish = (confirmed) => {
      cleanup();
      closeModal(disconnectModal);
      resolve(confirmed);
    };

    const onCancel = () => finish(false);
    const onConfirm = () => finish(true);
    const onBackdrop = (event) => {
      if (event.target === disconnectModal) onCancel();
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") onCancel();
    };

    disconnectCancelButton.addEventListener("click", onCancel);
    disconnectConfirmButton.addEventListener("click", onConfirm);
    disconnectModal.addEventListener("mousedown", onBackdrop);
    document.addEventListener("keydown", onKeydown);
    openModal(disconnectModal, disconnectCancelButton);
  });
}

function applyConnectedWalletState(account) {
  connectedWalletAddress = account.address;
  filters.connected = true;
  walletButton.textContent = account.address.length > 14 ? shortAddress(account.address) : account.address;
  walletButton.classList.add("button-primary");
  walletButton.classList.remove("button-secondary");
  chainMode.textContent = portalproofClient.mode === "live" ? "Live wallet" : "Mock wallet";

  const buyerField = orderForm.querySelector('[name="buyerAddress"]');
  if (buyerField) {
    buyerField.value = connectedWalletAddress;
  }
}

function applyDisconnectedWalletState(message = "Wallet disconnected") {
  portalproofClient.disconnectWallet?.();
  connectedWalletAddress = DEFAULT_WALLET_ADDRESS;
  filters.connected = false;
  walletButton.textContent = "Connect Wallet";
  walletButton.classList.remove("button-primary");
  walletButton.classList.add("button-secondary");
  chainMode.textContent = message;
}

function shortText(value, limit = 48) {
  const text = String(value || "");
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function formatStatus(value) {
  if (value === "Released") return "status-success";
  if (value === "Delivered" || value === "Funded") return "status-warning";
  if (value === "Disputed") return "status-danger";
  return "status-outline";
}

function progressForStatus(status) {
  const map = {
    Created: 10,
    Funded: 25,
    Accepted: 45,
    Delivered: 70,
    AcceptedByBuyer: 85,
    Released: 100,
  };
  return map[status] || 0;
}

function updateStats() {
  const activeOrders = buyerOrderState.filter((order) => order.status !== "Released").length;
  const verifiedDeliveries = buyerOrderState.filter((order) =>
    ["Delivered", "Accepted", "Released"].includes(order.status),
  ).length;
  const escrowedPOT = buyerOrderState
    .filter((order) => ["Funded", "Delivered", "Accepted"].includes(order.status))
    .reduce((sum, order) => sum + order.amount, 0);
  const sellers = new Set(services.map((service) => service.seller)).size;

  const cards = [
    ["Active Orders", activeOrders],
    ["Verified Deliveries", verifiedDeliveries],
    ["POT Escrowed", `${escrowedPOT} POT`],
    ["Active Sellers", sellers],
  ];

  statsGrid.innerHTML = cards
    .map(
      ([label, value]) => `
        <article class="stat-card">
          <span class="detail-label">${label}</span>
          <strong>${value}</strong>
        </article>
      `,
    )
    .join("");

  escrowBalance.textContent = `${escrowedPOT} POT`;
}

function serviceMatches(service) {
  const query = filters.query.toLowerCase();
  const haystack = [
    service.title,
    service.category,
    service.deliveryType,
    service.paymentType,
    service.verification,
    service.sellerStatus,
    service.summary,
    service.allowedUse,
  ]
    .join(" ")
    .toLowerCase();

  return (
    (!query || haystack.includes(query)) &&
    (filters.category === "All" || service.category === filters.category) &&
    (filters.deliveryType === "All" || service.deliveryType === filters.deliveryType) &&
    (filters.paymentType === "All" || service.paymentType === filters.paymentType) &&
    (filters.verification === "All" || service.verification === filters.verification) &&
    (filters.sellerStatus === "All" || service.sellerStatus === filters.sellerStatus)
  );
}

function serviceCardTemplate(service) {
  return `
    <article class="service-card">
      <div class="service-top">
        <div>
          <span class="tag accent">${service.category}</span>
          <h3>${service.title}</h3>
        </div>
        <span class="status ${formatStatus(service.sellerStatus)}">${service.sellerStatus}</span>
      </div>
      <p>${service.summary}</p>
      <div class="meta-row">
        <span class="meta-chip">${service.deliveryType}</span>
        <span class="meta-chip">${service.paymentType}</span>
        <span class="meta-chip">${service.verification}</span>
      </div>
      <div class="tag-row">
        <span class="tag blue">${service.price} POT</span>
        <span class="tag">${service.deliveryDays} day delivery</span>
        <span class="tag">${service.completedOrders} orders</span>
        <span class="tag">${service.rating} rating</span>
      </div>
      <div class="tag-row">
        <span class="tag warn">${service.allowedUse}</span>
      </div>
      <div class="tag-row">
        <button class="button button-secondary" type="button" data-order-service="${service.id}">
          Use in order
        </button>
      </div>
    </article>
  `;
}

function renderServices() {
  const visibleServices = services.filter(serviceMatches);
  serviceGrid.innerHTML = visibleServices.map(serviceCardTemplate).join("");

  const featuredAgents = services
    .filter((service) => ["Agent", "Skill", "MCP Server", "DevOps", "Enterprise Delivery"].includes(service.category))
    .slice(0, 4);

  agentGrid.innerHTML = featuredAgents.map(serviceCardTemplate).join("");

  const serviceOptions = services
    .map((service) => `<option value="${service.id}">${service.title}</option>`)
    .join("");
  orderServiceSelect.innerHTML = serviceOptions;

  serviceGrid.querySelectorAll("[data-order-service]").forEach((button) => {
    button.addEventListener("click", () => {
      orderServiceSelect.value = button.dataset.orderService;
      document.querySelector("#delivery").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderExplorer() {
  const query = filters.explorerQuery.toLowerCase();
  const visibleRows = explorerRows.filter((row) =>
    [row.time, row.type, row.order, row.from, row.to, String(row.amount), row.status, row.tx, row.serviceId, row.hash]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );

  explorerBody.innerHTML = visibleRows
    .map(
      (row) => `
        <tr>
          <td>${row.time}</td>
          <td>${row.type}</td>
          <td>${row.order}</td>
          <td>${row.from}</td>
          <td>${row.to}</td>
          <td>${row.amount} POT</td>
          <td><span class="status ${formatStatus(row.status)}">${row.status}</span></td>
          <td class="hash">${row.tx}</td>
        </tr>
      `,
    )
    .join("");

  const summary = [
    ["Recent rows", visibleRows.length],
    ["Contracts", 1],
    ["Verified", buyerOrderState.filter((order) => order.status === "Released").length],
  ];

  explorerSummary.innerHTML = summary
    .map(
      ([label, value]) => `
        <div class="summary-card">
          <span class="detail-label">${label}</span>
          <strong>${value}</strong>
        </div>
      `,
    )
    .join("");
}

function renderIncomingOrders() {
  incomingOrders.innerHTML = incomingOrderState
    .map(
      (order) => `
        <article class="list-card">
          <div class="order-top">
            <div>
              <strong>${order.id}</strong>
              <p>${order.serviceTitle}</p>
            </div>
            <span class="status ${formatStatus(order.status)}">${order.status}</span>
          </div>
          <div class="meta-row">
            <span class="meta-chip">${order.buyer}</span>
            <span class="meta-chip">${order.amount} POT</span>
            ${order.seller ? `<span class="meta-chip">${order.seller}</span>` : ""}
            ${order.requirements ? `<span class="meta-chip">${shortText(order.requirements)}</span>` : ""}
          </div>
        </article>
      `,
    )
    .join("");
}

function renderBuyerDashboard() {
  buyerOrders.innerHTML = buyerOrderState
    .map(
      (order) => `
        <article class="list-card">
          <div class="order-top">
            <div>
              <strong>${order.id}</strong>
              <p>${order.serviceTitle}</p>
            </div>
            <span class="status ${formatStatus(order.status)}">${order.status}</span>
          </div>
          <div class="meta-row">
            <span class="meta-chip">${order.amount} POT</span>
            <span class="meta-chip">${order.proof}</span>
            ${order.requirements ? `<span class="meta-chip">${shortText(order.requirements)}</span>` : ""}
            ${order.dueDate ? `<span class="meta-chip">Due ${order.dueDate}</span>` : ""}
            <span class="meta-chip">Updated ${order.updated}</span>
          </div>
        </article>
      `,
    )
    .join("");

  pendingDeliveries.innerHTML = buyerOrderState
    .filter((order) => ["Funded", "Delivered", "Accepted"].includes(order.status))
    .map(
      (order) => `
        <article class="list-card">
          <div class="order-top">
            <div>
              <strong>${order.serviceTitle}</strong>
              <p>${order.id}</p>
            </div>
            <span class="status ${formatStatus(order.status)}">${order.status}</span>
          </div>
          <div class="meta-row">
            <span class="meta-chip">${order.amount} POT</span>
            <span class="meta-chip">${order.seller}</span>
            ${order.requirements ? `<span class="meta-chip">${shortText(order.requirements)}</span>` : ""}
          </div>
        </article>
      `,
    )
    .join("");
}

function normalizeChainStatus(status) {
  if (!status) return status;
  if (status === "SellerAccepted") return "Accepted";
  if (status === "BuyerAccepted") return "AcceptedByBuyer";
  return status;
}

function applyChainServiceSnapshot(snapshot) {
  if (!snapshot) return;

  const localId = `SVC-${String(snapshot.serviceId).padStart(3, "0")}`;
  const index = services.findIndex((service) => service.id === localId);

  if (index >= 0) {
    services[index] = {
      ...services[index],
      seller: snapshot.seller || services[index].seller,
      price: snapshot.price || services[index].price,
      category: snapshot.category || services[index].category,
      sellerStatus: snapshot.active ? "Verified Seller" : "New Seller",
    };
  }
}

function applyChainOrderSnapshot(snapshot) {
  if (!snapshot) return;

  const orderId = `ORD-${String(snapshot.orderId).padStart(3, "0")}`;
  const status = normalizeChainStatus(snapshot.status);
  const amount = snapshot.amount || sampleOrder.amount;
  const proof = snapshot.deliveryHash || sampleOrder.proof;

  if (orderId === sampleOrder.id) {
    sampleOrder.status = status || sampleOrder.status;
    sampleOrder.amount = amount;
    sampleOrder.proof = proof || sampleOrder.proof;
  }

  const buyerOrder = buyerOrderState.find((order) => order.id === orderId);
  if (buyerOrder) {
    buyerOrder.status = status || buyerOrder.status;
    buyerOrder.amount = amount;
    buyerOrder.proof = proof || buyerOrder.proof;
    buyerOrder.updated = "Live chain";
  }

  const incomingOrder = incomingOrderState.find((order) => order.id === orderId);
  if (incomingOrder) {
    incomingOrder.status = status || incomingOrder.status;
    incomingOrder.amount = amount;
  }

  const explorerRow = explorerRows.find((row) => row.order === orderId);
  if (explorerRow) {
    explorerRow.status = status || explorerRow.status;
    explorerRow.amount = amount;
    explorerRow.hash = proof || explorerRow.hash;
  }
}

async function hydrateLiveState() {
  if (portalproofClient.mode !== "live" || liveSyncInFlight) {
    if (portalproofClient.mode !== "live") {
      chainMode.textContent = "Mock mode";
    }
    return;
  }

  liveSyncInFlight = true;
  chainMode.textContent = "Reading chain state...";

  try {
    const [serviceSnapshot, orderSnapshot, ownerSnapshot] = await Promise.all([
      portalproofClient.getService(toLocalIdNumber(sampleOrder.serviceId)).catch(() => null),
      portalproofClient.getOrder(toLocalIdNumber(sampleOrder.id)).catch(() => null),
      portalproofClient.getOwner().catch(() => null),
    ]);

    applyChainServiceSnapshot(serviceSnapshot);
    applyChainOrderSnapshot(orderSnapshot);

    if (ownerSnapshot) {
      explorerSummary.dataset.chainOwner = ownerSnapshot;
    }

    refreshAll();
    saveLocalState();
    chainMode.textContent = "Live contract synced";
    chainMode.classList.add("status-success");
  } catch (error) {
    chainMode.textContent = error.message || "Chain read failed";
  } finally {
    liveSyncInFlight = false;
  }
}

function syncSampleOrder() {
  const service = services.find((item) => item.id === sampleOrder.serviceId);
  sampleServiceTitle.textContent = service ? service.title : sampleOrder.serviceId;
  sampleAmount.textContent = `${sampleOrder.amount} POT`;
  sampleProof.textContent = sampleOrder.proof;
  sampleStatus.textContent = sampleOrder.status;
  sampleStatus.className = `status ${formatStatus(sampleOrder.status)}`;
  progressFill.style.width = `${progressForStatus(sampleOrder.status)}%`;
}

function syncOrderDraftFromService() {
  const service = services.find((item) => item.id === orderServiceSelect.value) || services[0];
  if (!service) return;

  if (orderAmountInput && !orderAmountInput.value) {
    orderAmountInput.value = service.price;
  }

  const buyerField = orderForm.querySelector('[name="buyerAddress"]');
  const sellerField = orderForm.querySelector('[name="sellerAddress"]');
  const requirementsField = orderForm.querySelector('[name="deliveryRequirements"]');

  if (buyerField && (!buyerField.value || buyerField.value === "0x...")) {
    buyerField.value = connectedWalletAddress;
  }

  if (sellerField && (!sellerField.value || sellerField.value === "0x...")) {
    sellerField.value = service.seller;
  }

  if (requirementsField && !requirementsField.value) {
    requirementsField.value = service.deliverables || service.summary || "";
  }
}

function pushExplorerRow(type, status) {
  const service = services.find((item) => item.id === sampleOrder.serviceId);
  explorerRows.unshift({
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    type,
    order: sampleOrder.id,
    from: connectedWalletAddress,
    to: service?.seller ?? "0x0000...0000",
    amount: sampleOrder.amount,
    status,
    tx: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
    serviceId: sampleOrder.serviceId,
    hash: sampleOrder.proof,
  });
}

function pushAdapterResult(type, orderId, result, status = "Submitted") {
  if (!result?.txHash) return;

  explorerRows.unshift({
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    type,
    order: orderId,
    from: filters.connected ? "Wallet" : "Local",
    to: portalproofConfig.contractAddress || "PortalProof escrow",
    amount: 0,
    status,
    tx: result.txHash,
    serviceId: "",
    hash: result.blockHash || result.status || result.mode,
  });

  if (Array.isArray(result.contractEvents) && result.contractEvents.length > 0) {
    result.contractEvents.forEach((event) => {
      explorerRows.unshift({
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: event.name || type,
        order: orderId,
        from: filters.connected ? "Wallet" : "Local",
        to: portalproofConfig.contractAddress || "PortalProof escrow",
        amount: 0,
        status,
        tx: result.txHash,
        serviceId: "",
        hash: (event.args || []).join(" | ") || result.blockHash || result.status,
      });
    });
  }
}

async function runChainAction(label, action, onSuccess) {
  try {
    chainMode.textContent = label;
    const result = await action();
    if (onSuccess) onSuccess(result);
    saveLocalState();
    const phaseLabel = portalproofClient.mode === "live" && result?.status ? ` • ${result.status}` : "";
    chainMode.textContent = portalproofClient.mode === "live" ? `Live contract${phaseLabel}` : "Mock mode";
    refreshAll();
  } catch (error) {
    chainMode.textContent = error.message || "Chain action failed";
  }
}

function pushBuyerOrder(status) {
  const service = services.find((item) => item.id === sampleOrder.serviceId);
  const existing = buyerOrderState.find((order) => order.id === sampleOrder.id);
  const base = {
    id: sampleOrder.id,
    serviceId: sampleOrder.serviceId,
    serviceTitle: service?.title ?? sampleOrder.serviceId,
    amount: sampleOrder.amount,
    proof: sampleOrder.proof,
    buyer: connectedWalletAddress,
    seller: service?.seller ?? "0x0000...0000",
  };

  if (existing) {
    existing.status = status;
    existing.proof = sampleOrder.proof;
    existing.serviceTitle = base.serviceTitle;
    existing.amount = base.amount;
    existing.updated = new Date().toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      day: "2-digit",
    });
  } else {
    buyerOrderState.unshift({
      ...base,
      status,
      updated: new Date().toLocaleString([], {
        hour: "2-digit",
        minute: "2-digit",
        month: "2-digit",
        day: "2-digit",
      }),
    });
  }

  const incoming = incomingOrderState.find((order) => order.id === sampleOrder.id);
  if (incoming) incoming.status = status === "Accepted" ? "Accepted" : status;
  else {
    incomingOrderState.unshift({
      id: sampleOrder.id,
      serviceTitle: base.serviceTitle,
      buyer: base.buyer,
      amount: base.amount,
      status,
    });
  }
}

function refreshAll() {
  updateStats();
  renderServices();
  renderExplorer();
  renderIncomingOrders();
  renderBuyerDashboard();
  syncSampleOrder();
  syncOrderDraftFromService();
}

categoryFilter.innerHTML = ["All", ...categories].map((value) => `<option>${value}</option>`).join("");
deliveryFilter.innerHTML = [
  "All",
  "File",
  "Report",
  "API",
  "Private Deployment",
  "Code Repository",
  "On-chain Contract",
  "Security Rule Pack",
]
  .map((value) => `<option>${value}</option>`)
  .join("");
paymentFilter.innerHTML = ["All", "Fixed Price", "Milestone", "Bounty"]
  .map((value) => `<option>${value}</option>`)
  .join("");
verificationFilter.innerHTML = ["All", "Hash Proof", "Contract Address", "Git Commit", "Signed Report", "Metadata JSON"]
  .map((value) => `<option>${value}</option>`)
  .join("");
sellerFilter.innerHTML = ["All", "New Seller", "Verified Seller", "Enterprise Ready"]
  .map((value) => `<option>${value}</option>`)
  .join("");

walletButton.addEventListener("click", async () => {
  try {
    if (filters.connected) {
      const confirmed = await requestDisconnectConfirmation();
      if (!confirmed) {
        return;
      }
      applyDisconnectedWalletState();
      return;
    }

    const manualAccount = await requestManualWallet();
    if (!manualAccount) return;

    const account = await portalproofClient.connectWallet(manualAccount);
    applyConnectedWalletState(account);

    if (portalproofClient.mode === "live") {
      await hydrateLiveState();
    }
  } catch (error) {
    applyDisconnectedWalletState(error.message);
  }
});

globalSearch.addEventListener("input", (event) => {
  filters.query = event.target.value;
  renderServices();
});

orderServiceSelect.addEventListener("change", () => {
  const service = services.find((item) => item.id === orderServiceSelect.value);
  if (service) {
    orderAmountInput.value = service.price;
    const sellerField = orderForm.querySelector('[name="sellerAddress"]');
    const requirementsField = orderForm.querySelector('[name="deliveryRequirements"]');
    const buyerField = orderForm.querySelector('[name="buyerAddress"]');

    if (sellerField) sellerField.value = service.seller;
    if (requirementsField) requirementsField.value = service.deliverables || service.summary || "";
    if (buyerField && (!buyerField.value || buyerField.value === "0x...")) {
      buyerField.value = connectedWalletAddress;
    }
  }
});

categoryFilter.addEventListener("change", (event) => {
  filters.category = event.target.value;
  renderServices();
});

deliveryFilter.addEventListener("change", (event) => {
  filters.deliveryType = event.target.value;
  renderServices();
});

paymentFilter.addEventListener("change", (event) => {
  filters.paymentType = event.target.value;
  renderServices();
});

verificationFilter.addEventListener("change", (event) => {
  filters.verification = event.target.value;
  renderServices();
});

sellerFilter.addEventListener("change", (event) => {
  filters.sellerStatus = event.target.value;
  renderServices();
});

explorerSearch.addEventListener("input", (event) => {
  filters.explorerQuery = event.target.value;
  renderExplorer();
});

syncChainButton.addEventListener("click", async () => {
  await hydrateLiveState();
});

openEventsApiButton.addEventListener("click", () => {
  const params = new URLSearchParams();
  if (filters.explorerQuery) {
    params.set("q", filters.explorerQuery);
  } else {
    params.set("order", sampleOrder.id);
  }

  const url = `/api/events?${params.toString()}`;
  window.open(url, "_blank", "noopener");
});

resetDemoButton.addEventListener("click", () => {
  void resetLocalState();
});

serviceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(serviceForm);
  const newService = {
    id: `SVC-${String(services.length + 1).padStart(3, "0")}`,
    title: String(formData.get("title") || "New service"),
    category: String(formData.get("category") || "Agent"),
    deliveryType: String(formData.get("deliveryType") || "File"),
    paymentType: "Fixed Price",
    verification: String(formData.get("verification") || "Hash Proof"),
    sellerStatus: filters.connected ? "Verified Seller" : "New Seller",
    price: Number(formData.get("price") || 1),
    deliveryDays: Number(formData.get("deliveryDays") || 1),
    completedOrders: 0,
    rating: "0.0",
    seller: filters.connected ? connectedWalletAddress : "0x0000...0000",
    summary: String(formData.get("description") || ""),
    deliverables: String(formData.get("deliverables") || ""),
    allowedUse: String(formData.get("allowedUse") || "Authorized use only"),
  };

  await runChainAction("Publishing service...", () => portalproofClient.createService({
      ...newService,
      metadataHash: `${newService.title}:${newService.deliverables}:${newService.allowedUse}`,
    }), (result) => {
      services.unshift(newService);
      pushAdapterResult("ServiceCreated", newService.id, result, "Created");
      serviceForm.reset();
      serviceForm.querySelector('[name="price"]').value = 25;
      serviceForm.querySelector('[name="deliveryDays"]').value = 3;
  });
});

orderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(orderForm);
  const serviceId = String(formData.get("serviceId"));
  const service = services.find((item) => item.id === serviceId);
  const amount = Number(formData.get("amount") || service?.price || 1);
  const proofType = String(formData.get("proofType") || "Hash Proof");
  const buyerAddress = String(formData.get("buyerAddress") || connectedWalletAddress);
  const sellerAddress = String(formData.get("sellerAddress") || service?.seller || "0x0000...0000");
  const deliveryRequirements = String(
    formData.get("deliveryRequirements") || service?.deliverables || service?.summary || "",
  );
  const acceptTerms = formData.get("acceptTerms") === "on";
  const fundNow = formData.get("fundNow") === "on";
  const status = fundNow ? "Funded" : "Created";
  const orderId = `ORD-${String(buyerOrderState.length + 1).padStart(3, "0")}`;
  const proof = `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`;

  if (!acceptTerms) {
    chainMode.textContent = "Accept the delivery terms first";
    return;
  }

  await runChainAction("Creating order...", async () => {
    const createResult = await portalproofClient.createOrder({
      id: orderId,
      serviceId,
      amount,
      requirementHash: `${serviceId}:${proofType}:${amount}:${deliveryRequirements}`,
    });

    let fundResult = null;
    if (fundNow) {
      chainMode.textContent = "Funding escrow...";
      fundResult = await portalproofClient.fundEscrow({
        id: orderId,
        chainOrderId: createResult.orderId,
        amount,
      });
    }

    return { createResult, fundResult };
  }, ({ createResult, fundResult }) => {
    buyerOrderState.unshift({
      id: orderId,
      serviceId,
      serviceTitle: service?.title ?? serviceId,
      status,
      amount,
      proof,
      buyer: buyerAddress,
      seller: sellerAddress,
      requirements: deliveryRequirements,
      dueDate: String(formData.get("dueDate") || ""),
      updated: new Date().toLocaleString([], { hour: "2-digit", minute: "2-digit", month: "2-digit", day: "2-digit" }),
    });

    pushAdapterResult("OrderCreated", orderId, createResult, "Created");
    if (fundResult) {
      pushAdapterResult("EscrowFunded", orderId, fundResult, "Funded");
    }

    incomingOrderState.unshift({
      id: orderId,
      serviceTitle: service?.title ?? serviceId,
      buyer: buyerAddress,
      amount,
      status,
      seller: sellerAddress,
      requirements: deliveryRequirements,
    });

    explorerRows.unshift({
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: fundNow ? "EscrowFunded" : "OrderCreated",
      order: orderId,
      from: buyerAddress,
      to: sellerAddress,
      amount,
      status,
      tx: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
      serviceId,
      hash: proof,
    });

    orderForm.reset();
    syncOrderDraftFromService();
    orderForm.querySelector('[name="fundNow"]').checked = true;
  });
});

acceptOrderBtn.addEventListener("click", async () => {
  await runChainAction("Accepting order...", () => portalproofClient.acceptOrder(sampleOrder.id), (result) => {
    sampleOrder.status = "Accepted";
    pushBuyerOrder("Accepted");
    pushExplorerRow("OrderAcceptedBySeller", "Accepted");
    pushAdapterResult("OrderAcceptedBySeller", sampleOrder.id, result, "Accepted");
  });
});

submitProofBtn.addEventListener("click", async () => {
  const nextProof = `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`;
  const metadataHash = toHash32(`metadata:${sampleOrder.id}:${nextProof}`).join("");
  await runChainAction(
    "Submitting proof...",
    () => portalproofClient.submitDelivery(sampleOrder.id, nextProof, metadataHash),
    (result) => {
      sampleOrder.status = "Delivered";
      sampleOrder.proof = nextProof;
      pushBuyerOrder("Delivered");
      pushExplorerRow("DeliverySubmitted", "Delivered");
      pushAdapterResult("DeliverySubmitted", sampleOrder.id, result, "Delivered");
    },
  );
});

acceptDeliveryBtn.addEventListener("click", async () => {
  await runChainAction("Accepting delivery...", () => portalproofClient.acceptDelivery(sampleOrder.id), (result) => {
    sampleOrder.status = "AcceptedByBuyer";
    pushBuyerOrder("Accepted");
    pushExplorerRow("DeliveryAccepted", "Accepted");
    pushAdapterResult("DeliveryAccepted", sampleOrder.id, result, "Accepted");
  });
});

releaseBtn.addEventListener("click", async () => {
  await runChainAction("Releasing payment...", () => portalproofClient.releasePayment(sampleOrder.id), (result) => {
    sampleOrder.status = "Released";
    pushBuyerOrder("Released");
    pushExplorerRow("PaymentReleased", "Released");
    pushAdapterResult("PaymentReleased", sampleOrder.id, result, "Released");
  });
});

async function initApp() {
  const restored = await loadLocalState();
  refreshAll();
  if (!restored) {
    await saveLocalState();
  }

  if (portalproofClient.mode === "live" && portalproofConfig.contractAddress) {
    void hydrateLiveState();
  }
}

void initApp();
