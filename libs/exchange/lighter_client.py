import os
from typing import Any, Dict, Optional

from dotenv import load_dotenv

load_dotenv()


def _import_lighter():
	try:
		import lighter  # type: ignore
		return lighter
	except Exception as exc:
		raise ImportError(
			"lighter-python SDK is not installed. Install via 'pip install git+https://github.com/elliottech/lighter-python.git'"
		) from exc


def _create_client():
	lighter = _import_lighter()
	base_url = os.getenv("LIGHTER_BASE_URL", "https://mainnet.zklighter.elliot.ai")
	# Generated clients usually accept Configuration(host=...)
	try:
		cfg = lighter.Configuration(host=base_url)  # type: ignore[attr-defined]
		return lighter.ApiClient(cfg)  # type: ignore[attr-defined]
	except Exception:
		# Fallback to default client if Configuration signature differs
		return lighter.ApiClient()  # type: ignore[attr-defined]


async def lighter_order_books(market: str, limit: Optional[int] = None) -> Any:
	"""
	Query order books for a market.
	"""
	lighter = _import_lighter()
	client = _create_client()
	try:
		api = lighter.OrderApi(client)  # type: ignore[attr-defined]
		if limit is None:
			return await api.order_books(market=market)  # type: ignore[func-returns-value]
		return await api.order_books(market=market, limit=limit)  # type: ignore[func-returns-value]
	finally:
		try:
			await client.close()
		except Exception:
			pass


async def lighter_recent_trades(market: str, limit: Optional[int] = None) -> Any:
	"""
	Query recent trades for a market.
	"""
	lighter = _import_lighter()
	client = _create_client()
	try:
		api = lighter.OrderApi(client)  # type: ignore[attr-defined]
		if limit is None:
			return await api.recent_trades(market=market)  # type: ignore[func-returns-value]
		return await api.recent_trades(market=market, limit=limit)  # type: ignore[func-returns-value]
	finally:
		try:
			await client.close()
		except Exception:
			pass


async def lighter_send_tx(payload: Dict[str, Any]) -> Any:
	"""
	Send a signed transaction payload to Lighter.
	"""
	lighter = _import_lighter()
	client = _create_client()
	try:
		api = lighter.TransactionApi(client)  # type: ignore[attr-defined]
		try:
			return await api.send_tx(payload)  # type: ignore[call-arg, func-returns-value]
		except TypeError:
			return await api.send_tx(body=payload)  # type: ignore[call-arg, func-returns-value]
	finally:
		try:
			await client.close()
		except Exception:
			pass


async def lighter_account_by_l1_address(address: str) -> Any:
	"""
	Fetch account(s) by L1 address.
	"""
	lighter = _import_lighter()
	client = _create_client()
	try:
		api = lighter.AccountApi(client)  # type: ignore[attr-defined]
		# Prefer explicit endpoint, fallback to generic account lookup if signature differs
		try:
			return await api.accounts_by_l1_address(address=address)  # type: ignore[func-returns-value]
		except Exception:
			return await api.account(by="l1Address", value=address)  # type: ignore[func-returns-value]
	finally:
		try:
			await client.close()
		except Exception:
			pass


