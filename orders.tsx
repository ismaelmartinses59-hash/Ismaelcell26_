import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "./react-query";

import { OrderForm } from "./order-form";
import { OrderCard } from "./order-card";
import { FaturamentoModal } from "./faturamento-modal";
import { GarantiaModal } from "./garantia-modal";
import { CatalogoModal } from "./catalogo-modal";

import { Card, CardContent } from "./card";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

import { Button } from "./button";

import {
  Search,
  LogOut,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  X,
  Store,
  User,
  EyeOff,
  TrendingUp,
  Shield,
  Package,
  HandCoins,
} from "lucide-react";

type Order = {
  id: number;
  codigo: string;
  modelo: string;
  servico: string;
  status: string;
  valor: string;
};

enum OrderTipo {
  cliente = "cliente",
  lojista = "lojista",
}

const VISIBLE_SECONDS = 10;

export default function Orders() {
  const [, setLocation] = useLocation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);

  const [tipo, setTipo] = useState<OrderTipo>(OrderTipo.cliente);

  const [showFaturamento, setShowFaturamento] = useState(false);
  const [showGarantia, setShowGarantia] = useState(false);

  const [showCatalogo, setShowCatalogo] = useState(false);

  const [catalogoTab, setCatalogoTab] = useState<
    "pecas" | "garantias" | "historico" | "receber"
  >("pecas");

  const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

  interface ContaResumo {
    conta: {
      closedAt: string | null;
    };
    saldo: number;
  }

  const { data: contasReceber = [] } = useQuery<ContaResumo[]>({
    queryKey: ["contas-receber"],
    queryFn: () =>
      fetch(`${BASE_URL}/api/contas-receber`).then((r) =>
        r.ok ? r.json() : []
      ),
    refetchInterval: 30000,
  });

  const contasAbertas = contasReceber.filter(
    (c) => c.conta.closedAt === null && c.saldo > 0
  );

  const totalAReceber = contasAbertas.reduce((a, c) => a + c.saldo, 0);

  const [secondsLeft, setSecondsLeft] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ordersVisible =
    secondsLeft > 0 ||
    search.length > 0 ||
    statusFilter !== "all";

  const startCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    setSecondsLeft(VISIBLE_SECONDS);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
      setLocation("/");
    }
  }, [setLocation]);

  const handleTipoChange = (newTipo: OrderTipo) => {
    setTipo(newTipo);

    setSearch("");
    setStatusFilter("all");

    setShowForm(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setSecondsLeft(0);
  };

  const stats = {
    total: 0,
    aguardando: 0,
    emAndamento: 0,
    concluido: 0,
    problema: 0,
    comGarantia: 0,
  };

  const allOrders: Order[] = [];

  const orders: Order[] = [];

  const isLoading = false;

  const activeModels = allOrders
    .filter(
      (o) =>
        o.status !== "concluido" &&
        o.status !== "encerrado"
    )
    .map((o) => o.modelo);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");

    setLocation("/");
  };

  const isCliente = tipo === OrderTipo.cliente;

  const handleOrderCreated = () => {
    setShowForm(false);

    startCountdown();
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      <FaturamentoModal
        open={showFaturamento}
        onClose={() => setShowFaturamento(false)}
        tipo={tipo}
      />

      <GarantiaModal
        open={showGarantia}
        onClose={() => setShowGarantia(false)}
      />

      <CatalogoModal
        open={showCatalogo}
        onClose={() => setShowCatalogo(false)}
        setor={isCliente ? "cliente" : "lojista"}
        initialTab={catalogoTab}
        soloTab={catalogoTab === "receber"}
      />

      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowGarantia(true)}
              className="w-8 h-8 bg-primary rounded-md flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <Shield className="h-4 w-4 text-primary-foreground" />
            </button>

            <h1 className="font-bold text-lg tracking-tight hidden sm:block">
              Ismael Cell
            </h1>
          </div>

          <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
            <button
              onClick={() =>
                handleTipoChange(OrderTipo.cliente)
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isCliente
                  ? "bg-white shadow text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Cliente
            </button>

            <button
              onClick={() =>
                handleTipoChange(OrderTipo.lojista)
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                !isCliente
                  ? "bg-white shadow text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Lojista
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1 text-primary border-primary/30 hover:bg-primary/5"
              onClick={() => {
                setCatalogoTab("pecas");
                setShowCatalogo(true);
              }}
            >
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">
                Peças
              </span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1 text-green-700 border-green-300 hover:bg-green-50"
              onClick={() => setShowFaturamento(true)}
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">
                Faturamento
              </span>
            </Button>

            <Button
              size="sm"
              className="md:hidden flex items-center gap-1"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? (
                <X className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}

              {showForm ? "Fechar" : "Nova"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />

              <span className="hidden sm:inline ml-2">
                Sair
              </span>
            </Button>
          </div>
        </div>

        <div
          className={`h-0.5 transition-colors ${
            isCliente
              ? "bg-blue-500"
              : "bg-primary"
          }`}
        />
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-4 space-y-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <Card>
            <CardContent className="p-3 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold">
                {stats.total}
              </span>

              <span className="text-xs font-medium text-muted-foreground uppercase mt-1">
                Total
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 flex flex-col items-center justify-center text-center">
              <Clock className="h-4 w-4 text-amber-500 mb-1" />

              <span className="text-xl font-bold">
                {stats.aguardando}
              </span>

              <span className="text-xs font-medium text-muted-foreground uppercase">
                Aguardando
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 flex flex-col items-center justify-center text-center">
              <Activity className="h-4 w-4 text-blue-500 mb-1" />

              <span className="text-xl font-bold">
                {stats.emAndamento}
              </span>

              <span className="text-xs font-medium text-muted-foreground uppercase">
                Andamento
              </span>
            </CardContent>
          </Card>
        </div>

        <div className="md:hidden">
          <Card
            className={`shadow-md border-2 ${
              isCliente
                ? "border-blue-300"
                : "border-primary/30"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                {isCliente ? (
                  <User className="w-4 h-4 text-blue-500" />
                ) : (
                  <Store className="w-4 h-4 text-primary" />
                )}

                <h2 className="font-semibold text-base">
                  Nova OS —{" "}
                  {isCliente
                    ? "Cliente"
                    : "Lojista"}
                </h2>
              </div>

              <OrderForm
                activeModels={activeModels}
                tipo={tipo}
                onSuccess={handleOrderCreated}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <OrderFilters
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          <OrdersList
            orders={orders}
            isLoading={isLoading}
            visible={ordersVisible}
            secondsLeft={secondsLeft}
            isSearching={search.length > 0}
          />
        </div>
      </main>
    </div>
  );
}

function OrderFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
}: {
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

        <Input
          placeholder="Buscar por código, modelo, serviço..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Select
        value={statusFilter}
        onValueChange={setStatusFilter}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filtrar por status" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">
            Todos os status
          </SelectItem>

          <SelectItem value="aguardando">
            Aguardando
          </SelectItem>

          <SelectItem value="em andamento">
            Em Andamento
          </SelectItem>

          <SelectItem value="concluido">
            Concluído
          </SelectItem>

          <SelectItem value="problema">
            Com Problema
          </SelectItem>

          <SelectItem value="encerrado">
            Encerrado
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function OrdersList({
  orders,
  isLoading,
  visible,
  secondsLeft,
  isSearching,
}: {
  orders: Order[];
  isLoading: boolean;
  visible: boolean;
  secondsLeft: number;
  isSearching: boolean;
}) {
  if (!visible) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-10 flex flex-col items-center gap-3 text-center text-muted-foreground">
          <EyeOff className="h-8 w-8 opacity-30" />

          <p className="font-medium">
            Ordens ocultas
          </p>

          <p className="text-sm">
            Digite na busca ou selecione um status
            para ver as ordens
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Carregando ordens...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {secondsLeft > 0 && !isSearching && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700">
          <span className="flex items-center gap-2">
            <EyeOff className="h-4 w-4" />

            Ocultando automaticamente em{" "}
            <strong>{secondsLeft}s</strong>
          </span>
        </div>
      )}

      {orders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground">
            Nenhuma ordem encontrada.
          </CardContent>
        </Card>
      ) : (
        orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
          />
        ))
      )}
    </div>
  );
}
