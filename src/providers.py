from __future__ import annotations
from typing import Any, Protocol

class DataProvider(Protocol):
    """Minimal provider contract for future feed integrations."""
    name: str
    source_url: str
    async def fetch(self) -> list[dict[str, Any]] | dict[str, Any]: ...
    def parse(self, raw: Any) -> list[dict[str, Any]] | dict[str, Any]: ...
