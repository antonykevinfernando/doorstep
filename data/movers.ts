export interface Mover {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  description: string;
  services: string[];
  phone: string;
}

export const movers: Mover[] = [
  {
    id: '1',
    name: 'SwiftMove Co.',
    rating: 4.8,
    reviewCount: 342,
    priceRange: '$80 - $120 / hr',
    description:
      'Full-service moving company specializing in local and long-distance residential moves. White-glove packing and unpacking available.',
    services: ['Local moves', 'Long distance', 'Packing & unpacking', 'Furniture assembly'],
    phone: '(555) 123-4567',
  },
  {
    id: '2',
    name: 'HomeHaul',
    rating: 4.6,
    reviewCount: 218,
    priceRange: '$60 - $90 / hr',
    description:
      'Affordable and reliable movers for apartments and small homes. Transparent pricing with no hidden fees.',
    services: ['Apartment moves', 'Loading & unloading', 'Short-distance', 'Storage solutions'],
    phone: '(555) 234-5678',
  },
  {
    id: '3',
    name: 'Gentle Giants Moving',
    rating: 4.9,
    reviewCount: 567,
    priceRange: '$100 - $150 / hr',
    description:
      'Premium moving service with trained professionals. Specializing in delicate items, antiques, and pianos.',
    services: ['Specialty items', 'Piano moving', 'Art & antiques', 'Climate-controlled storage'],
    phone: '(555) 345-6789',
  },
  {
    id: '4',
    name: 'QuickLift Movers',
    rating: 4.4,
    reviewCount: 156,
    priceRange: '$50 - $75 / hr',
    description:
      'Budget-friendly moving help for DIY moves. Hire muscle by the hour for loading, unloading, or rearranging.',
    services: ['Labor only', 'Loading help', 'Furniture rearranging', 'Junk removal'],
    phone: '(555) 456-7890',
  },
  {
    id: '5',
    name: 'Boxed & Done',
    rating: 4.7,
    reviewCount: 289,
    priceRange: '$70 - $110 / hr',
    description:
      'End-to-end moving experience from packing your first box to placing your last picture frame. We handle it all.',
    services: ['Full-service packing', 'Unpacking', 'Organizing', 'Donation pickup'],
    phone: '(555) 567-8901',
  },
];
