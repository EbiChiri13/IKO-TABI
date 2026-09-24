"""WebSocket で「何が変わったか」だけを同じグループの全員に知らせる（F-13）。

中身（誰がどのタグを選んだか等）は送らない。受け取った画面が REST で取り直す【Q16】。
"""

import asyncio
import json
import logging

from fastapi import WebSocket

log = logging.getLogger("ikotabi.realtime")


class Hub:
    def __init__(self):
        self._rooms: dict[str, set[WebSocket]] = {}
        self._loop: asyncio.AbstractEventLoop | None = None

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    async def join(self, group_id: str, ws: WebSocket) -> None:
        self._rooms.setdefault(group_id, set()).add(ws)

    def leave(self, group_id: str, ws: WebSocket) -> None:
        room = self._rooms.get(group_id)
        if room:
            room.discard(ws)
            if not room:
                del self._rooms[group_id]

    async def _send(self, group_id: str, kinds: list[str]) -> None:
        msg = json.dumps({"changed": kinds})
        for ws in list(self._rooms.get(group_id, ())):
            try:
                await ws.send_text(msg)
            except Exception:  # noqa: BLE001  切れた接続は外すだけ
                self.leave(group_id, ws)

    def notify(self, group_id: str, kinds: list[str]) -> None:
        """同期のエンドポイント（スレッド）から呼ぶ。DB のコミット後に呼ぶこと。"""
        if kinds and self._loop is not None:
            asyncio.run_coroutine_threadsafe(self._send(group_id, sorted(set(kinds))), self._loop)


hub = Hub()
