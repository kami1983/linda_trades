import os
import asyncio
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()

# In-memory caches guarded by asyncio primitives
_ws_started: bool = False
_ws_task: Optional[asyncio.Task] = None
_subscribed_ids: set[int] = set()
_lock = asyncio.Lock()
_account_payloads: Dict[int, Any] = {}
_account_open_orders: Dict[int, List[Dict[str, Any]]] = {}


def _import_lighter():
	try:
		import lighter  # type: ignore
		return lighter
	except Exception as exc:
		raise ImportError(
			"lighter-python SDK is not installed. Install via 'pip install git+https://github.com/elliottech/lighter-python.git'"
		) from exc


def _is_active_status(status: Optional[str]) -> bool:
	if not status:
		return False
	st = str(status).lower()
	return st in ("open", "new", "working", "pending", "partially-filled", "partially_filled")


def _to_jsonable(obj: Any) -> Any:
	try:
		if hasattr(obj, "model_dump"):
			return obj.model_dump()
		if hasattr(obj, "to_dict"):
			return obj.to_dict()
	except Exception:
		pass
	if isinstance(obj, list):
		return [_to_jsonable(x) for x in obj]
	if isinstance(obj, dict):
		return {k: _to_jsonable(v) for k, v in obj.items()}
	return obj


def _extract_open_orders(account_payload: Any) -> List[Dict[str, Any]]:
	"""
	Try to extract user's currently active orders from a Ws account payload.
	Structure may vary; we attempt best-effort extraction.
	"""
	if not account_payload:
		return []
	# Common shapes to probe:
	candidates: List[Any] = []
	if isinstance(account_payload, dict):
		# direct keys
		for key in ("open_orders", "openOrders", "orders", "active_orders", "activeOrders"):
			val = account_payload.get(key)
			if val:
				candidates.append(val)
		# nested 'data' or 'account'
		for parent in ("data", "account"):
			sub = account_payload.get(parent)
			if isinstance(sub, dict):
				for key in ("open_orders", "openOrders", "orders", "active_orders", "activeOrders"):
					val = sub.get(key)
					if val:
						candidates.append(val)
	else:
		# model-like objects
		for key in ("open_orders", "openOrders", "orders", "active_orders", "activeOrders"):
			if hasattr(account_payload, key):
				val = getattr(account_payload, key)
				if val:
					candidates.append(val)
		# nested attributes
		for parent in ("data", "account"):
			if hasattr(account_payload, parent):
				sub = getattr(account_payload, parent)
				for key in ("open_orders", "openOrders", "orders", "active_orders", "activeOrders"):
					if hasattr(sub, key):
						val = getattr(sub, key)
						if val:
							candidates.append(val)

	# Flatten lists and filter active-like
	flat: List[Dict[str, Any]] = []
	for val in candidates:
		if isinstance(val, list):
			for item in val:
				try:
					# Normalize to dict
					if hasattr(item, "model_dump"):
						d = item.model_dump()  # pydantic v2
					elif hasattr(item, "to_dict"):
						d = item.to_dict()
					elif isinstance(item, dict):
						d = item
					else:
						d = {"raw": str(item)}
					status = d.get("status") or d.get("state")
					if _is_active_status(status):
						flat.append(d)
				except Exception:
					continue
	return flat


async def _run_ws(account_ids: List[int]):
	lighter = _import_lighter()

	def on_account_update(account_id, account):
		# Called from ws thread; store minimally processed data
		try:
			acc_id = int(account_id)
		except Exception:
			return
		orders = _extract_open_orders(account)
		# Best-effort cache update; no await inside sync callback
		_account_payloads[acc_id] = account
		_account_open_orders[acc_id] = orders

	# Try to attach auth token for private account streams
	auth_token = None
	try:
		from libs.exchange.lighter_signer import get_auth_token  # local import to avoid cycles
		# Use asyncio loop to create token
		auth_token = await get_auth_token()
	except Exception:
		auth_token = None

	# Construct WS client with or without auth depending on SDK support
	try:
		if auth_token:
			client = lighter.WsClient(  # type: ignore[attr-defined]
				order_book_ids=[],
				account_ids=account_ids,
				on_order_book_update=None,
				on_account_update=on_account_update,
				auth=auth_token,  # type: ignore[call-arg]
			)
		else:
			client = lighter.WsClient(  # type: ignore[attr-defined]
				order_book_ids=[],
				account_ids=account_ids,
				on_order_book_update=None,
				on_account_update=on_account_update,
			)
	except TypeError:
		# Older SDKs might not accept auth kw
		client = lighter.WsClient(  # type: ignore[attr-defined]
			order_book_ids=[],
			account_ids=account_ids,
			on_order_book_update=None,
			on_account_update=on_account_update,
		)
	# Prefer async runner if available
	if hasattr(client, "run_async"):
		await client.run_async()  # type: ignore[attr-defined]
	else:
		# Fallback to sync run in a thread
		loop = asyncio.get_running_loop()
		await loop.run_in_executor(None, client.run)  # type: ignore[attr-defined]


async def ensure_ws_started():
	global _ws_started, _ws_task
	async with _lock:
		if _ws_started and _ws_task and not _ws_task.done():
			return
		base_idx = os.getenv("LIGHTER_ACCOUNT_INDEX")
		account_ids: List[int] = []
		if base_idx:
			try:
				account_ids.append(int(base_idx))
				_subscribed_ids.add(int(base_idx))
			except Exception:
				pass
		# Start only if we have at least one account id configured
		if not account_ids:
			_ws_started = True  # do not loop attempting
			return
		_ws_task = asyncio.create_task(_run_ws(account_ids))
		_ws_started = True


async def ensure_ws_for_account(account_index: int):
	"""
	Ensure WS is running and subscribed for given account. If already running but not subscribed, restart with extended list.
	"""
	global _ws_started, _ws_task
	async with _lock:
		targets = set(_subscribed_ids)
		if account_index not in targets:
			targets.add(account_index)
			# Cancel current task (best-effort) and start a new one
			if _ws_task and not _ws_task.done():
				_ws_task.cancel()
			_ws_task = asyncio.create_task(_run_ws(sorted(list(targets))))
			_ws_started = True
			_subscribed_ids.clear()
			_subscribed_ids.update(targets)
		elif not _ws_started or not _ws_task or _ws_task.done():
			# Start fresh with existing subscriptions
			_ws_task = asyncio.create_task(_run_ws(sorted(list(targets)) or [account_index]))
			_ws_started = True
			_subscribed_ids.add(account_index)


async def get_open_orders_cached(account_index: int) -> List[Dict[str, Any]]:
	await ensure_ws_started()
	return list(_account_open_orders.get(account_index, []))


async def get_account_snapshot(account_index: int) -> Any:
	await ensure_ws_started()
	payload = _account_payloads.get(account_index)
	return _to_jsonable(payload)

