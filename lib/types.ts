export type Kit = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  status: 'published' | 'draft';
  category?: string;
  categories?: string[];
  createdAt: Date;
  metadata?: {
    createdAt: string;
  };
  assets?: {
    iconSvgName: string;
  };
};

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
  partnerId?: string;
  createdAt: Date;
};

export type UserRole = 'user' | 'partner' | 'admin';

export type UserProfile = {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  lastLogin?: Date;
};

export type MarketingAsset = {
  id: string;
  name: string;
  type: 'banner' | 'swipe';
  url: string;
  createdAt: Date;
};

export type PartnerRequest = {
  id: string;
  userId: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
};
