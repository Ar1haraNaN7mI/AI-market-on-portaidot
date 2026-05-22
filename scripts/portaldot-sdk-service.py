#!/usr/bin/env python3
import json
import os
import ssl
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

try:
    from substrateinterface import Keypair, SubstrateInterface
except ImportError as exc:
    raise SystemExit(
        "substrateinterface is not installed. Install the Portaldot Python SDK dependency first."
    ) from exc

try:
    from substrateinterface.contracts import ContractInstance
except ImportError:
    ContractInstance = None


ROOT = Path(__file__).resolve().parent.parent
RPC_ENDPOINT = os.environ.get("PORTALDOT_RPC_ENDPOINT", "wss://mainnet.portaldot.io")
SS58_FORMAT = int(os.environ.get("PORTALDOT_SS58_FORMAT", "42"))
GENESIS_HASH = os.environ.get("PORTALDOT_GENESIS_HASH", "").strip()
QUERY_ACCOUNT = os.environ.get("PORTALDOT_QUERY_ACCOUNT", "").strip()
SIGNER_URI = os.environ.get("PORTALDOT_SIGNER_URI", "").strip()
CONTRACT_ADDRESS = os.environ.get("PORTALDOT_CONTRACT_ADDRESS", "").strip()
CONTRACT_METADATA = os.environ.get(
    "PORTALDOT_CONTRACT_METADATA",
    str(ROOT / "contracts" / "portalproof_escrow" / "target" / "ink" / "portalproof_escrow.json"),
).strip()
HOST = os.environ.get("PORTALDOT_SDK_HOST", "127.0.0.1")
PORT = int(os.environ.get("PORTALDOT_SDK_PORT", "8787"))
TYPE_REGISTRY_PRESET = os.environ.get("PORTALDOT_TYPE_REGISTRY_PRESET", "").strip()
ALLOW_INSECURE_RPC = os.environ.get("PORTALDOT_ALLOW_INSECURE_RPC", "1").strip() != "0"


def connect_substrate(verify_ssl=True):
    ws_options = {}
    if not verify_ssl:
        ws_options = {
            "sslopt": {
                "cert_reqs": ssl.CERT_NONE,
                "check_hostname": False,
            }
        }

    kwargs = {
        "url": RPC_ENDPOINT,
        "ss58_format": SS58_FORMAT,
        "ws_options": ws_options or None,
    }
    if TYPE_REGISTRY_PRESET:
        kwargs["type_registry_preset"] = TYPE_REGISTRY_PRESET

    return SubstrateInterface(**kwargs)


def get_genesis_hash():
    genesis_hash = getattr(substrate, "genesis_hash", None)
    if genesis_hash:
        return str(genesis_hash)

    try:
        block_hash = substrate.get_block_hash(0)
        if block_hash:
            return str(block_hash)
    except Exception:
        pass

    return "unknown"

try:
    substrate = connect_substrate(verify_ssl=True)
except Exception as exc:
    if not ALLOW_INSECURE_RPC or "CERTIFICATE_VERIFY_FAILED" not in str(exc):
        raise

    print(
        "Warning: RPC TLS certificate validation failed, retrying with verification disabled for demo use.",
        file=sys.stderr,
    )
    substrate = connect_substrate(verify_ssl=False)

    connected_genesis_hash = get_genesis_hash()
    if GENESIS_HASH and connected_genesis_hash.lower() != GENESIS_HASH.lower():
        raise SystemExit(
            f"Connected to unexpected genesis hash {connected_genesis_hash}, expected {GENESIS_HASH}"
        )

contract = None
if CONTRACT_ADDRESS and CONTRACT_METADATA and Path(CONTRACT_METADATA).exists() and ContractInstance:
    contract = ContractInstance.create_from_address(
        contract_address=CONTRACT_ADDRESS,
        metadata_file=CONTRACT_METADATA,
        substrate=substrate,
    )


def json_default(value):
    if hasattr(value, "to_dict"):
        return value.to_dict()
    if hasattr(value, "value"):
        return value.value
    if hasattr(value, "__dict__"):
        return value.__dict__
    return str(value)


def to_plain(value):
    if isinstance(value, dict):
        return {key: to_plain(item) for key, item in value.items()}
    if isinstance(value, list):
        return [to_plain(item) for item in value]
    if isinstance(value, tuple):
        return [to_plain(item) for item in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return json_default(value)


def query_account(address):
    result = substrate.query("System", "Account", [address])
    return {
        "address": address,
        "account": to_plain(result.value),
    }


def payment_preview(dest, value, signer_address):
    call = substrate.compose_call(
        call_module="Balances",
        call_function="transfer",
        call_params={
            "dest": dest,
            "value": value,
        },
    )
    keypair = Keypair(ss58_address=signer_address)
    payment_info = substrate.get_payment_info(call=call, keypair=keypair)
    return {
        "call": {
            "module": "Balances",
            "function": "transfer",
            "params": {
                "dest": dest,
                "value": value,
            },
        },
        "paymentInfo": to_plain(payment_info),
    }


def send_transfer(dest, value):
    if not SIGNER_URI:
        raise ValueError("PORTALDOT_SIGNER_URI is not configured")

    keypair = Keypair.create_from_uri(SIGNER_URI, ss58_format=SS58_FORMAT)
    call = substrate.compose_call(
        call_module="Balances",
        call_function="transfer",
        call_params={
            "dest": dest,
            "value": value,
        },
    )
    extrinsic = substrate.create_signed_extrinsic(call=call, keypair=keypair)
    receipt = substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)
    return {
        "extrinsicHash": getattr(receipt, "extrinsic_hash", None),
        "blockHash": getattr(receipt, "block_hash", None),
        "isSuccess": bool(getattr(receipt, "is_success", False)),
    }


def contract_read(method, args):
    if not contract:
        raise ValueError("Contract instance is not configured")

    read_address = QUERY_ACCOUNT or SIGNER_URI or ""
    if not read_address:
        raise ValueError("Set PORTALDOT_QUERY_ACCOUNT or PORTALDOT_SIGNER_URI for contract reads")

    if read_address.startswith("//"):
        keypair = Keypair.create_from_uri(read_address, ss58_format=SS58_FORMAT)
    else:
        keypair = Keypair(ss58_address=read_address)

    result = contract.read(keypair, method, args=args)
    return {
        "contractResultData": to_plain(getattr(result, "contract_result_data", None)),
        "value": to_plain(getattr(result, "value", None)),
        "gasConsumed": to_plain(getattr(result, "gas_consumed", None)),
    }


class Handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        body = json.dumps(payload, default=json_default).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)

        try:
            if parsed.path == "/health":
                account_info = None
                if QUERY_ACCOUNT:
                    account_info = query_account(QUERY_ACCOUNT)

                self._send(
                    200,
                    {
                        "ok": True,
                        "rpcEndpoint": RPC_ENDPOINT,
                        "chain": substrate.chain,
                        "genesisHash": get_genesis_hash(),
                        "ss58Format": substrate.ss58_format,
                        "queryAccount": QUERY_ACCOUNT or None,
                        "signerConfigured": bool(SIGNER_URI),
                        "contractConfigured": bool(contract),
                        "accountInfo": account_info,
                    },
                )
                return

            if parsed.path == "/account":
                address = (query.get("address", [QUERY_ACCOUNT])[0] or "").strip()
                if not address:
                    raise ValueError("address is required")
                self._send(200, query_account(address))
                return

            if parsed.path == "/sdk/fee-preview":
                dest = (query.get("dest", [""])[0] or "").strip()
                value = int(query.get("value", ["0"])[0] or "0")
                signer_address = (query.get("signer", [QUERY_ACCOUNT])[0] or "").strip()
                if not dest:
                    raise ValueError("dest is required")
                if not signer_address:
                    raise ValueError("signer address is required")
                self._send(200, payment_preview(dest, value, signer_address))
                return

            if parsed.path == "/contract/get_service":
                service_id = int(query.get("serviceId", query.get("service_id", ["0"]))[0] or "0")
                self._send(200, contract_read("get_service", {"service_id": service_id}))
                return

            if parsed.path == "/contract/get_order":
                order_id = int(query.get("orderId", query.get("order_id", ["0"]))[0] or "0")
                self._send(200, contract_read("get_order", {"order_id": order_id}))
                return

            if parsed.path == "/contract/get_owner":
                self._send(200, contract_read("get_owner", {}))
                return

            self._send(404, {"ok": False, "error": "Not found"})
        except Exception as exc:
            self._send(400, {"ok": False, "error": str(exc)})

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/sdk/transfer-send":
            self._send(404, {"ok": False, "error": "Not found"})
            return

        length = int(self.headers.get("Content-Length", "0") or "0")
        payload = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
        dest = str(payload.get("dest", "")).strip()
        value = int(payload.get("value", 0))

        try:
            if not dest:
                raise ValueError("dest is required")
            result = send_transfer(dest, value)
            self._send(200, result)
        except Exception as exc:
            self._send(400, {"ok": False, "error": str(exc)})


def main():
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Portaldot SDK service running at http://{HOST}:{PORT}")
    print(f"Connected chain: {substrate.chain} ({get_genesis_hash()})")
    if contract:
        print(f"Contract instance loaded: {CONTRACT_ADDRESS}")
    server.serve_forever()


if __name__ == "__main__":
    main()
