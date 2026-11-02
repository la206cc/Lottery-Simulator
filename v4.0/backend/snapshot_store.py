"""Server-side persistence for named experiment parameter snapshots."""

from __future__ import annotations

import json
import threading
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from .rules import LOTTERIES


class SnapshotStore:
    def __init__(self, path: Path, per_lottery_limit: int = 5) -> None:
        self.path = path
        self.per_lottery_limit = per_lottery_limit
        self._lock = threading.RLock()
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def _read(self) -> list[dict[str, Any]]:
        if not self.path.exists():
            return []
        try:
            payload = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return []
        snapshots = payload.get("snapshots", []) if isinstance(payload, dict) else []
        return [snapshot for snapshot in snapshots if snapshot.get("lottery") in LOTTERIES]

    def _write(self, snapshots: list[dict[str, Any]]) -> None:
        payload = {
            "updated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
            "snapshots": snapshots,
        }
        temporary = self.path.with_suffix(".tmp")
        temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        temporary.replace(self.path)

    def _sanitize(self, snapshot: dict[str, Any]) -> dict[str, Any]:
        lottery = str(snapshot.get("lottery", ""))
        if lottery not in LOTTERIES:
            raise ValueError("参数记录包含不支持的彩种")
        portfolio = snapshot.get("portfolio", [])
        if not isinstance(portfolio, list):
            portfolio = []
        cleaned = {
            "id": str(snapshot.get("id") or uuid.uuid4()),
            "name": str(snapshot.get("name") or "参数记录")[:30],
            "createdAt": str(snapshot.get("createdAt") or datetime.now().astimezone().isoformat(timespec="seconds")),
            "lottery": lottery,
            "lotteryName": str(snapshot.get("lotteryName") or LOTTERIES[lottery].name),
            "strategy": str(snapshot.get("strategy") or "combined"),
            "strategyName": str(snapshot.get("strategyName") or "四模型综合"),
            "targetMin": int(snapshot.get("targetMin", 0)),
            "targetMax": int(snapshot.get("targetMax", 0)),
            "entriesMillion": float(snapshot.get("entriesMillion", 0)),
            "historyInfluence": float(snapshot.get("historyInfluence", 0)),
            "birthdayInfluence": float(snapshot.get("birthdayInfluence", 0)),
            "luckyInfluence": float(snapshot.get("luckyInfluence", 0)),
            "candidatePool": int(snapshot.get("candidatePool", 6000)),
            "ticketSample": int(snapshot.get("ticketSample", 30000)),
            "seed": int(snapshot.get("seed", 20261031)),
            "targetReturn": float(snapshot.get("targetReturn", 45)),
            "portfolio": [str(item) for item in portfolio][:10],
        }
        if cleaned["targetMin"] > cleaned["targetMax"]:
            cleaned["targetMin"], cleaned["targetMax"] = cleaned["targetMax"], cleaned["targetMin"]
        return cleaned

    def list(self, lottery_id: str | None = None) -> list[dict[str, Any]]:
        with self._lock:
            snapshots = self._read()
            if lottery_id:
                snapshots = [snapshot for snapshot in snapshots if snapshot["lottery"] == lottery_id]
            return sorted(snapshots, key=lambda snapshot: snapshot.get("createdAt", ""), reverse=True)

    def save(self, snapshot: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            cleaned = self._sanitize(snapshot)
            snapshots = self._read()
            snapshots = [item for item in snapshots if item.get("id") != cleaned["id"]]
            same_lottery = [item for item in snapshots if item["lottery"] == cleaned["lottery"]]
            if len(same_lottery) >= self.per_lottery_limit:
                raise ValueError(f"{LOTTERIES[cleaned['lottery']].name}最多保存 {self.per_lottery_limit} 份参数")
            snapshots.append(cleaned)
            self._write(snapshots)
            return cleaned

    def migrate(self, snapshots: list[dict[str, Any]]) -> dict[str, int]:
        migrated = 0
        skipped = 0
        for snapshot in snapshots[:100]:
            try:
                self.save(snapshot)
                migrated += 1
            except (ValueError, TypeError):
                skipped += 1
        return {"migrated": migrated, "skipped": skipped}

    def delete(self, snapshot_id: str) -> bool:
        with self._lock:
            snapshots = self._read()
            filtered = [snapshot for snapshot in snapshots if snapshot.get("id") != snapshot_id]
            if len(filtered) == len(snapshots):
                return False
            self._write(filtered)
            return True
