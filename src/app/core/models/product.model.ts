export interface Product {
  id: string;
  name: string;
  brandId: string;
  groupIds: string[];
  imageUrl: string;
  featured?: boolean;
}
