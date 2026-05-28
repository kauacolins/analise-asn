from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Mitigator(Base):
    # Cadastro de ASN reconhecidos como provedores de mitigação.
    __tablename__ = "mitigadores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    asn: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)


class MonitoredAsn(Base):
    # Lista de ASN que serão consultados periodicamente.
    __tablename__ = "monitorados"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    asn: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)


class BgpRoute(Base):
    # Snapshot de uma rota observada durante a coleta.
    __tablename__ = "bgp_routes"
    __table_args__ = (
        UniqueConstraint("prefixo", "source_id", "collected_at", name="uq_bgp_routes_snapshot"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    prefixo: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    asn_origem: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    as_path: Mapped[str] = mapped_column(Text, nullable=False)
    asn_mitigador: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    is_mitigated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    community: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    collected_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
