export type KitContent = {
  main_source: string;
  overview: string;
  key_concepts: string;
  step_by_step: string;
  resources: string;
  faq: string;
  checklists: string;
  tips: string;
  system_instructions: string;
};

export type KitMetadata = {
  title: string;
  slug: string;
  description: string;
};

export type Payment = {
  id: string;
  userId: string;
  userEmail: string;
  kitId: string;
  kitTitle: string;
  amount: number;
  currency: string;
  gateway: 'stripe' | 'paypal';
  gatewayTransactionId: string;
  status: 'completed' | 'failed' | 'refunded';
  createdAt: any;
};
