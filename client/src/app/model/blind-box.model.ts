export type CardEffectType = 'STANDARD' | 'FOIL' | 'HOLOGRAPHIC' | 'RAINBOW_SHIMMER' | 'LIGHTNING';

export interface BlindBoxRarity {
  id?: number;
  name: string;
  borderColor: string;
  badgeColor: string;
  effectType: CardEffectType;
  defaultDropRate: number;
  displayOrder: number;
}

export interface BlindBoxCollection {
  id?: number;
  name: string;
  description?: string;
  bannerUrl?: string;
  active?: boolean;
  displayOrder?: number;
  items?: BlindBoxItem[];
  boxes?: BlindBox[];
}

export interface BlindBoxItem {
  id?: number;
  collectionId?: number;
  rarity: BlindBoxRarity;
  itemNumber: number;
  name: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
}

export interface BlindBox {
  id?: number;
  name: string;
  description?: string;
  imageUrl?: string;
  collectionId?: number;
  collection?: BlindBoxCollection;
}

export interface BlindBoxKey {
  id?: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  blindBox: BlindBox;
}

export interface UserKeyInventory {
  key: BlindBoxKey;
  quantity: number;
}

export interface PokedexCard {
  id: number;
  itemNumber: number;
  name: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  rarity: BlindBoxRarity;
  unlocked: boolean;
  count: number;
  firstObtainedDate?: string;
}

export interface UnboxResult {
  item: BlindBoxItem;
  isNew: boolean;
  count: number;
  remainingKeys: number;
}

export interface CollectionProgress {
  id: number;
  name: string;
  description: string;
  bannerUrl: string;
  ownedItemsCount: number;
  totalItemsCount: number;
}