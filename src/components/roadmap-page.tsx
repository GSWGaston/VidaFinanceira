import Link from "next/link";
import { ArrowRight, Construction } from "lucide-react";
const copy: Record<
  string,
  { title: string; phase: string; description: string }
> = {
  planning: {
    title: "Planejamento",
    phase: "Fase 3",
    description:
      "Em breve: cenários futuros e valores mensais necessários para seus planos.",
  },
  reports: {
    title: "Relatórios",
    phase: "Fase 4",
    description:
      "Em breve: gráficos e comparativos detalhados da sua vida financeira.",
  },
  cards: {
    title: "Cartões",
    phase: "Fase 2",
    description: "Em breve: faturas, limites e compras parceladas.",
  },
  budgets: {
    title: "Orçamentos",
    phase: "Fase 3",
    description: "Em breve: limites mensais por categoria e alertas.",
  },
  goals: {
    title: "Metas",
    phase: "Fase 3",
    description: "Em breve: acompanhe objetivos e contribuições.",
  },
  assets: {
    title: "Patrimônio",
    phase: "Fase 4",
    description: "Em breve: ativos, passivos e patrimônio líquido.",
  },
  vehicles: {
    title: "Veículos",
    phase: "Fase 6",
    description: "Em breve: combustível, manutenção e custos automotivos.",
  },
  subscriptions: {
    title: "Assinaturas",
    phase: "Fase 2",
    description: "Em breve: despesas recorrentes e próximos vencimentos.",
  },
  imports: {
    title: "Importar dados",
    phase: "Fase 5",
    description: "Em breve: importação de extratos com prévia e revisão.",
  },
  settings: {
    title: "Configurações",
    phase: "Próxima etapa",
    description:
      "Em breve: preferências, perfil e gerenciamento dos seus dados.",
  },
};
export function RoadmapPage({ name }: { name: keyof typeof copy }) {
  const item = copy[name];
  return (
    <div>
      <p className="eyebrow mb-2">{item.phase.toUpperCase()}</p>
      <h1 className="page-title">{item.title}</h1>
      <div className="card mt-7 max-w-2xl p-8 sm:p-10">
        <span className="grid size-12 place-items-center rounded-2xl bg-soft text-primary">
          <Construction size={24} />
        </span>
        <h2 className="mt-5 text-xl font-extrabold">
          Esta área está a caminho
        </h2>
        <p className="muted mt-2 text-sm leading-relaxed">{item.description}</p>
        <p className="muted mt-3 text-sm">
          A primeira versão funcional já inclui contas, benefícios, transações e
          o painel inicial.
        </p>
        <Link href="/" className="btn btn-primary mt-6">
          Voltar ao início <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
