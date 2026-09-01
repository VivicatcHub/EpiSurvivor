export type Listing = {
  id: string;
  title: string;
  company: string;
  city: string;
  url: string;
  lat: number;
  lng: number;
};

export type BoundsBox = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};
