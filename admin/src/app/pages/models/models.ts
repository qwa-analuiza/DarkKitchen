export interface ItemPedido {
  nome: string;
  quantidade: number;
  preco: number;
}

export interface Pedido {
  id: string;
  numero: string;
  cliente: string;
  telefone: string;
  endereco: string;
  itens: ItemPedido[];
  valorTotal: number;
  pagamento: string;
  status: 'recebido' | 'aguardando' | 'preparo' | 'pronto' | 'entrega' | 'entregue' | 'atrasado';
  tempoInicio: Date;
  motoboyId?: string;
  motoboyNome?: string;
}

// INTERFACE MOTOBOY AJUSTADA PARA BATER COM O TEU SERVIÇO
export interface Motoboy {
  id: string;
  nome: string;
  telefone: string;
  avaliacao: number;
  entregas: number;
  status: 'disponivel' | 'em_entrega';
  pedidoAtual?: string | null; // <-- CORREÇÃO: Mudado para string para aceitar '#005' ou o ID do pedido
}

export interface StatusPedidos {
  entregue: number;
  preparo: number;
  entrega: number;
  aguardando: number;
}

export interface VendasData {
  faturamentoHoje: number;
  totalPedidos: number;
  ticketMedio: number;
  pedidosAtraso: number;
  tempoMedio: number;
  vendasSemana: number[];
  statusPedidos: StatusPedidos;
}

export interface Prato {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  descricao: string;
  disponivel: boolean;
  imagemUrl?: string;
}
