import os
from typing import Any, Tuple, Optional

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


def _create_signer():
	lighter = _import_lighter()
	base_url = os.getenv("LIGHTER_BASE_URL", "https://mainnet.zklighter.elliot.ai")
	api_key_private_key = os.getenv("LIGHTER_API_KEY_PRIVATE_KEY")
	account_index = os.getenv("LIGHTER_ACCOUNT_INDEX")
	api_key_index = os.getenv("LIGHTER_API_KEY_INDEX")

	if not api_key_private_key or account_index is None or api_key_index is None:
		raise ValueError("LIGHTER_API_KEY_PRIVATE_KEY, LIGHTER_ACCOUNT_INDEX, LIGHTER_API_KEY_INDEX must be set")

	client = lighter.SignerClient(  # type: ignore[attr-defined]
		url=base_url,
		private_key=api_key_private_key,
		account_index=int(account_index),
		api_key_index=int(api_key_index),
	)
	return lighter, client


async def signer_create_order(
	market_index: int,
	client_order_index: int,
	base_amount: int,
	price: int,
	is_ask: bool,
	order_type: Optional[int] = None,
	time_in_force: Optional[int] = None,
	reduce_only: bool = False,
	trigger_price: int = 0,
) -> Tuple[Any, Any]:
	"""
	Create order using SignerClient. Returns (tx, tx_hash).
	"""
	lighter, client = _create_signer()
	try:
		if order_type is None:
			order_type = lighter.SignerClient.ORDER_TYPE_LIMIT  # type: ignore[attr-defined]
		if time_in_force is None:
			time_in_force = lighter.SignerClient.ORDER_TIME_IN_FORCE_GOOD_TILL_TIME  # type: ignore[attr-defined]
		tx, tx_hash, err = await client.create_order(  # type: ignore[attr-defined]
			market_index=market_index,
			client_order_index=client_order_index,
			base_amount=base_amount,
			price=price,
			is_ask=is_ask,
			order_type=order_type,
			time_in_force=time_in_force,
			reduce_only=reduce_only,
			trigger_price=trigger_price,
		)
		if err is not None:
			raise Exception(err)
		return tx, tx_hash
	finally:
		try:
			await client.close()
		except Exception:
			pass


async def signer_cancel_order(market_index: int, order_index: int) -> Tuple[Any, Any]:
	"""
	Cancel order using SignerClient. order_index equals client_order_index per docs. Returns (tx, tx_hash).
	"""
	_, client = _create_signer()
	try:
		tx, tx_hash, err = await client.cancel_order(  # type: ignore[attr-defined]
			market_index=market_index,
			order_index=order_index,
		)
		if err is not None:
			raise Exception(err)
		return tx, tx_hash
	finally:
		try:
			await client.close()
		except Exception:
			pass


async def signer_cancel_all_orders(time_in_force: Optional[int] = None) -> Tuple[Any, Any]:
	"""
	Cancel all orders depending on time_in_force semantics. Returns (tx, tx_hash).
	"""
	lighter, client = _create_signer()
	try:
		if time_in_force is None:
			time_in_force = lighter.SignerClient.ORDER_TIME_IN_FORCE_IMMEDIATE_OR_CANCEL  # type: ignore[attr-defined]
		# Some SDKs expose explicit method; fallback to generic naming
		if hasattr(client, "cancel_all_orders"):
			tx, tx_hash, err = await client.cancel_all_orders(time_in_force=time_in_force)  # type: ignore[attr-defined]
		elif hasattr(client, "cancel_all"):
			tx, tx_hash, err = await client.cancel_all(time_in_force=time_in_force)  # type: ignore[attr-defined]
		else:
			raise NotImplementedError("SignerClient does not expose cancel_all_orders/cancel_all")
		if err is not None:
			raise Exception(err)
		return tx, tx_hash
	finally:
		try:
			await client.close()
		except Exception:
			pass


