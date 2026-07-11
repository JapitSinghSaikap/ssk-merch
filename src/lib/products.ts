export type ProductCategory =
  | "tshirt"
  | "tracksuit"
  | "sweatshirt"
  | "cap"
  | "accessories";

export type ProductImage = {
  src: string;
  label: string;
};

export type Product = {
  slug: string;
  sku: string;
  name: string;
  color?: string;
  category: ProductCategory;
  categoryLabel: string;
  price: number;
  sizes: string[];
  fabric: string;
  description: string;
  images: ProductImage[];
};

const CLOTHING_DIR = "/images/shop/clothing";
const ACCESSORIES_DIR = "/images/shop/accessories";

const CLOTHING_SIZES = ["S", "M", "L", "XL", "XXL"];
const ONE_SIZE = ["One Size"];

// NOTE: Prices and fabric/material details below are placeholders for the
// initial build — swap in real values here once available.
export const products: Product[] = [
  {
    slug: "black-tshirt",
    sku: "TSH-BLK",
    name: "Black T-Shirt",
    color: "Black",
    category: "tshirt",
    categoryLabel: "T-Shirts",
    price: 900,
    sizes: CLOTHING_SIZES,
    fabric: "Premium cotton-polyester pique knit, breathable and durable.",
    description:
      "Classic polo tee in black with tipped collar and cuffs, 'SAIKAPIAN' embroidered across the back and the Sainik School Kapurthala crest on the chest.",
    images: [
      { src: `${CLOTHING_DIR}/Black Tshirt Front.png`, label: "Front" },
      { src: `${CLOTHING_DIR}/Black Tshirt Back.png`, label: "Back" },
      { src: `${CLOTHING_DIR}/Black Tshirt Side.png`, label: "Side" },
      { src: `${CLOTHING_DIR}/Black Tshirt Side1.png`, label: "Side 2" },
    ],
  },
  {
    slug: "blue-tshirt",
    sku: "TSH-BLU",
    name: "Blue T-Shirt",
    color: "Blue",
    category: "tshirt",
    categoryLabel: "T-Shirts",
    price: 900,
    sizes: CLOTHING_SIZES,
    fabric: "Premium cotton-polyester pique knit, breathable and durable.",
    description:
      "Classic polo tee in navy blue with tipped collar and cuffs, 'SAIKAPIAN' embroidered across the back and the Sainik School Kapurthala crest on the chest.",
    images: [
      { src: `${CLOTHING_DIR}/Blue Tshirt Front.png`, label: "Front" },
      { src: `${CLOTHING_DIR}/Blue Tshirt Back.png`, label: "Back" },
      { src: `${CLOTHING_DIR}/Blue Tshirt Side1.png`, label: "Side" },
      { src: `${CLOTHING_DIR}/Blue Tshirt Side2.png`, label: "Side 2" },
    ],
  },
  {
    slug: "maroon-tshirt",
    sku: "TSH-MAR",
    name: "Maroon T-Shirt",
    color: "Maroon",
    category: "tshirt",
    categoryLabel: "T-Shirts",
    price: 900,
    sizes: CLOTHING_SIZES,
    fabric: "Premium cotton-polyester pique knit, breathable and durable.",
    description:
      "Classic polo tee in the school's signature maroon with tipped collar and cuffs, 'SAIKAPIAN' embroidered across the back and the Sainik School Kapurthala crest on the chest.",
    images: [
      { src: `${CLOTHING_DIR}/Maroon Tshirt Front.png`, label: "Front" },
      { src: `${CLOTHING_DIR}/Maroon Tshirt Back.png`, label: "Back" },
      { src: `${CLOTHING_DIR}/Maroon Tshirt Side.png`, label: "Side" },
      { src: `${CLOTHING_DIR}/Maroon Tshirt Side1.png`, label: "Side 2" },
    ],
  },
  {
    slug: "white-tshirt",
    sku: "TSH-WHT",
    name: "White T-Shirt",
    color: "White",
    category: "tshirt",
    categoryLabel: "T-Shirts",
    price: 900,
    sizes: CLOTHING_SIZES,
    fabric: "Premium cotton-polyester pique knit, breathable and durable.",
    description:
      "Classic polo tee in clean white with tipped collar and cuffs, 'SAIKAPIAN' embroidered across the back and the Sainik School Kapurthala crest on the chest.",
    images: [
      { src: `${CLOTHING_DIR}/White Tshirt Front.png`, label: "Front" },
      { src: `${CLOTHING_DIR}/White Tshirt Back.png`, label: "Back" },
      { src: `${CLOTHING_DIR}/White Tshirt Side1.png`, label: "Side" },
      { src: `${CLOTHING_DIR}/White Tshirt Side2.png`, label: "Side 2" },
    ],
  },
  {
    slug: "black-halfsleeve-tshirt",
    sku: "TSH-HS-BLK",
    name: "Black Half-Sleeve T-Shirt",
    color: "Black",
    category: "tshirt",
    categoryLabel: "T-Shirts",
    price: 900,
    sizes: CLOTHING_SIZES,
    fabric: "Premium cotton-polyester pique knit, breathable and durable.",
    description:
      "Short-sleeve quarter-zip pullover in black, embroidered with the Sainik School Kapurthala crest — a lighter layer for warmer days.",
    images: [
      { src: `${CLOTHING_DIR}/Black HalfSleeve Front.png`, label: "Front" },
      { src: `${CLOTHING_DIR}/Black HalfSleeve Back.png`, label: "Back" },
      { src: `${CLOTHING_DIR}/Black HalfSleeve Side.png`, label: "Side" },
      { src: `${CLOTHING_DIR}/Black HalfSleeve Side2.png`, label: "Side 2" },
    ],
  },
  {
    slug: "black-tracksuit",
    sku: "TRK-BLK",
    name: "Black Tracksuit",
    color: "Black",
    category: "tracksuit",
    categoryLabel: "Tracksuits",
    price: 2000,
    sizes: CLOTHING_SIZES,
    fabric: "Brushed polyester tracksuit fabric with a soft inner lining.",
    description:
      "Full-zip tracksuit jacket and trousers in black, trimmed in gold-and-maroon racing stripes, with 'SAIKAPIAN' embroidered across the back and the school crest on the chest.",
    images: [
      { src: `${CLOTHING_DIR}/TrackSuit Black Front.png`, label: "Front" },
      { src: `${CLOTHING_DIR}/Tracksuit Balck Back.png`, label: "Back" },
      { src: `${CLOTHING_DIR}/Tracksuit Black Side1.png`, label: "Side" },
      { src: `${CLOTHING_DIR}/Tracksuit Black Side2.png`, label: "Side 2" },
    ],
  },
  {
    slug: "maroon-tracksuit",
    sku: "TRK-MAR",
    name: "Maroon Tracksuit",
    color: "Maroon",
    category: "tracksuit",
    categoryLabel: "Tracksuits",
    price: 2000,
    sizes: CLOTHING_SIZES,
    fabric: "Brushed polyester tracksuit fabric with a soft inner lining.",
    description:
      "Full-zip tracksuit jacket and trousers in maroon, trimmed in gold-and-orange racing stripes, with 'SAIKAPIAN' embroidered across the back and the school crest on the chest.",
    images: [
      { src: `${CLOTHING_DIR}/Tracksuit Maroon  Front.png`, label: "Front" },
      { src: `${CLOTHING_DIR}/Tracksuit Maroon Back.png`, label: "Back" },
      { src: `${CLOTHING_DIR}/Tracksuit Maroon Side1.png`, label: "Side" },
      { src: `${CLOTHING_DIR}/Tracksuit Maroon Side2.png`, label: "Side 2" },
    ],
  },
  {
    slug: "offwhite-sweatshirt",
    sku: "SWT-OFF",
    name: "Off-White Sweatshirt",
    color: "Off-White",
    category: "sweatshirt",
    categoryLabel: "Sweatshirts",
    price: 800,
    sizes: CLOTHING_SIZES,
    fabric: "Brushed fleece interior with a ribbed quarter-zip collar and cuffs.",
    description:
      "Quarter-zip fleece pullover in off-white with maroon trim, embroidered with the Sainik School Kapurthala crest.",
    images: [
      { src: `${CLOTHING_DIR}/Offwhite Sweatshirt front.png`, label: "Front" },
      { src: `${CLOTHING_DIR}/offwhite Sweatshirt Back.png`, label: "Back" },
      { src: `${CLOTHING_DIR}/Offwhite Sweatshirt Side.png`, label: "Side" },
    ],
  },
  {
    slug: "maroon-sweatshirt",
    sku: "SWT-MAR",
    name: "Maroon Sweatshirt",
    color: "Maroon",
    category: "sweatshirt",
    categoryLabel: "Sweatshirts",
    price: 800,
    sizes: CLOTHING_SIZES,
    fabric: "Brushed fleece interior with a ribbed quarter-zip collar and cuffs.",
    description:
      "Quarter-zip fleece pullover in maroon with grey trim, embroidered with the Sainik School Kapurthala crest.",
    images: [
      { src: `${CLOTHING_DIR}/Sweatshirt Maroon Front.png`, label: "Front" },
      { src: `${CLOTHING_DIR}/Sweatshirt Maroon Back.png`, label: "Back" },
      { src: `${CLOTHING_DIR}/Swweatshirt Maroon Side.png`, label: "Side" },
    ],
  },
  {
    slug: "black-cap",
    sku: "CAP-BLK",
    name: "Black Cap",
    color: "Black",
    category: "cap",
    categoryLabel: "Caps",
    price: 399,
    sizes: ONE_SIZE,
    fabric: "Cotton twill, adjustable strap with metal buckle closure.",
    description:
      "Embroidered baseball cap in black with the Sainik School Kapurthala crest, personalised with roll number and batch.",
    images: [
      { src: `${CLOTHING_DIR}/Black Cap Fronyt.jpg`, label: "Front" },
      { src: `${CLOTHING_DIR}/Black Cap Back.jpg`, label: "Back" },
      { src: `${CLOTHING_DIR}/Black Cap Side.jpg`, label: "Left Side" },
      { src: `${CLOTHING_DIR}/Black Cap Side1.jpg`, label: "Right Side" },
    ],
  },
  {
    slug: "blue-cap",
    sku: "CAP-BLU",
    name: "Blue Cap",
    color: "Blue",
    category: "cap",
    categoryLabel: "Caps",
    price: 399,
    sizes: ONE_SIZE,
    fabric: "Cotton twill, adjustable strap with metal buckle closure.",
    description:
      "Embroidered baseball cap in navy blue with the Sainik School Kapurthala crest, personalised with roll number and batch.",
    images: [
      { src: `${CLOTHING_DIR}/Blue Cap Front.jpg`, label: "Front" },
      { src: `${CLOTHING_DIR}/Blue Cap Back.jpg`, label: "Back" },
      { src: `${CLOTHING_DIR}/Blue Cap Side.jpg`, label: "Left Side" },
      { src: `${CLOTHING_DIR}/Blue Cap side1.jpg`, label: "Right Side" },
    ],
  },
  {
    slug: "maroon-cap",
    sku: "CAP-MAR",
    name: "Maroon Cap",
    color: "Maroon",
    category: "cap",
    categoryLabel: "Caps",
    price: 399,
    sizes: ONE_SIZE,
    fabric: "Cotton twill, adjustable strap with metal buckle closure.",
    description:
      "Embroidered baseball cap in maroon with the Sainik School Kapurthala crest, personalised with roll number and batch.",
    images: [
      { src: `${CLOTHING_DIR}/Maroon Cap Front.jpg`, label: "Front" },
      { src: `${CLOTHING_DIR}/Maroon Cap Back.png`, label: "Back" },
      { src: `${CLOTHING_DIR}/Maroon Cap Side.jpg`, label: "Left Side" },
      { src: `${CLOTHING_DIR}/Maroon Cap Side1.jpg`, label: "Right Side" },
    ],
  },
  {
    slug: "white-cap",
    sku: "CAP-WHT",
    name: "White Cap",
    color: "White",
    category: "cap",
    categoryLabel: "Caps",
    price: 399,
    sizes: ONE_SIZE,
    fabric: "Cotton twill, adjustable strap with metal buckle closure.",
    description:
      "Embroidered baseball cap in white with the Sainik School Kapurthala crest, personalised with roll number and batch.",
    images: [
      { src: `${CLOTHING_DIR}/White Cap Front.jpg`, label: "Front" },
      { src: `${CLOTHING_DIR}/White cap Back.jpg`, label: "Back" },
      { src: `${CLOTHING_DIR}/White Cap Side.jpg`, label: "Left Side" },
      { src: `${CLOTHING_DIR}/White Cap Side1.jpg`, label: "Right Side" },
    ],
  },
  {
    slug: "white-ceramic-mug",
    sku: "MUG-CER-WHT",
    name: "White Ceramic Mug",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 350,
    sizes: ONE_SIZE,
    fabric: "Premium ceramic, dishwasher and microwave safe.",
    description:
      "Classic white ceramic mug printed with the Sainik School Kapurthala crest.",
    images: [
      { src: `${ACCESSORIES_DIR}/White Mug Front.jpg`, label: "Front" },
      { src: `${ACCESSORIES_DIR}/White Mug Back.jpg`, label: "Back" },
      { src: `${ACCESSORIES_DIR}/White Mug Side.jpg`, label: "Side" },
    ],
  },
  {
    slug: "black-mug",
    sku: "MUG-CER-BLK",
    name: "Black Mug",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 350,
    sizes: ONE_SIZE,
    fabric: "Premium ceramic with a glossy black finish, dishwasher and microwave safe.",
    description:
      "Glossy black ceramic mug printed with the Sainik School Kapurthala crest.",
    images: [
      { src: `${ACCESSORIES_DIR}/Black Mug Front.jpg`, label: "Front" },
      { src: `${ACCESSORIES_DIR}/Black Mug Back.jpg`, label: "Back" },
      { src: `${ACCESSORIES_DIR}/Black Mug Side.jpg`, label: "Side" },
    ],
  },
  {
    slug: "frosted-beer-mug",
    sku: "MUG-BEER",
    name: "Frosted Beer Mug",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 350,
    sizes: ONE_SIZE,
    fabric: "Frosted glass, ideal for cold beverages.",
    description:
      "Frosted glass beer mug etched with the Sainik School Kapurthala crest — a toast to the old days.",
    images: [
      { src: `${ACCESSORIES_DIR}/Beer mug Front.jpg`, label: "Front" },
      { src: `${ACCESSORIES_DIR}/Beer Mug Back.jpg`, label: "Back" },
      { src: `${ACCESSORIES_DIR}/Beer Mug Side.jpg`, label: "Side" },
    ],
  },
  {
    slug: "metal-mug",
    sku: "MUG-METAL",
    name: "Metal Mug",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 350,
    sizes: ONE_SIZE,
    fabric: "Stainless steel with double-walled insulation.",
    description:
      "Double-walled stainless steel mug printed with the Sainik School Kapurthala crest, keeps drinks hot or cold for longer.",
    images: [
      { src: `${ACCESSORIES_DIR}/Metal Mug Front.jpg`, label: "Front" },
      { src: `${ACCESSORIES_DIR}/Metal Mug Back.jpg`, label: "Back" },
      { src: `${ACCESSORIES_DIR}/Metal Mug Side.jpg`, label: "Side" },
    ],
  },
  {
    slug: "heritage-building-magnet",
    sku: "MAG-001",
    name: "Heritage Building Magnet",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 200,
    sizes: ONE_SIZE,
    fabric: "Printed acrylic fridge magnet.",
    description:
      "Fridge magnet featuring an illustration of the Sainik School Kapurthala campus building.",
    images: [{ src: `${ACCESSORIES_DIR}/Fridge Magnet 1.png`, label: "Front" }],
  },
  {
    slug: "school-crest-magnet",
    sku: "MAG-001",
    name: "School Crest Magnet",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 200,
    sizes: ONE_SIZE,
    fabric: "Printed acrylic fridge magnet.",
    description:
      "Circular fridge magnet featuring the Sainik School Kapurthala crest.",
    images: [{ src: `${ACCESSORIES_DIR}/Fridge Magnet2.png`, label: "Front" }],
  },
  {
    slug: "jitna-ragda-utna-tagda-magnet",
    sku: "MAG-001",
    name: "Jitna Ragda Utna Tagda Magnet",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 200,
    sizes: ONE_SIZE,
    fabric: "Printed acrylic fridge magnet.",
    description:
      "A nostalgic nod to push-up punishments — every Saikapian's favourite inside joke, on a fridge magnet.",
    images: [{ src: `${ACCESSORIES_DIR}/Fridge Magnet3.png`, label: "Front" }],
  },
  {
    slug: "project-lao-magnet",
    sku: "MAG-001",
    name: "Project Lao Magnet",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 200,
    sizes: ONE_SIZE,
    fabric: "Printed acrylic fridge magnet.",
    description:
      "Die-cut fridge magnet celebrating 'Project Lao' — the unforgettable cadet cooking sessions.",
    images: [{ src: `${ACCESSORIES_DIR}/Fridge Magnet 4.png`, label: "Front" }],
  },
  {
    slug: "chaman-dhaba-magnet",
    sku: "MAG-001",
    name: "Chaman Dhaba Magnet",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 200,
    sizes: ONE_SIZE,
    fabric: "Printed acrylic fridge magnet.",
    description:
      "A tribute to Chaman Dhaba — every Saikapian's favourite escape for a plate of shahi paneer.",
    images: [{ src: `${ACCESSORIES_DIR}/Fridge mAgent 5.png`, label: "Front" }],
  },
  {
    slug: "school-barber-magnet",
    sku: "MAG-001",
    name: "School Barber Magnet",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 200,
    sizes: ONE_SIZE,
    fabric: "Printed acrylic fridge magnet.",
    description:
      "'Our School Barber' — a fond, funny throwback to Billu Barber and mandatory haircut day, on a fridge magnet.",
    images: [{ src: `${ACCESSORIES_DIR}/Fridge Magnet6.png`, label: "Front" }],
  },
  {
    slug: "maroon-tie",
    sku: "TIE-001",
    name: "Maroon Tie",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 499,
    sizes: ONE_SIZE,
    fabric: "Premium microfibre fabric, fine embroidered school logo.",
    description:
      "Classic solid maroon tie with the Sainik School Kapurthala crest embroidered in gold, personalised with your batch.",
    images: [{ src: `${ACCESSORIES_DIR}/Tie Maroon.png`, label: "All Views" }],
  },
  {
    slug: "striped-tie",
    sku: "TIE-001",
    name: "Striped Tie",
    category: "accessories",
    categoryLabel: "Accessories",
    price: 499,
    sizes: ONE_SIZE,
    fabric: "Premium microfibre fabric, fine embroidered school logo.",
    description:
      "Maroon-and-green striped tie with a repeating Sainik School Kapurthala crest pattern.",
    images: [{ src: `${ACCESSORIES_DIR}/Tie2.png`, label: "Front" }],
  },
];

export function getAllProducts() {
  return products;
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getCategories() {
  const seen = new Map<ProductCategory, string>();
  for (const product of products) {
    seen.set(product.category, product.categoryLabel);
  }
  return Array.from(seen, ([value, label]) => ({ value, label }));
}

export function getAllSizes() {
  const sizes = new Set<string>();
  for (const product of products) {
    for (const size of product.sizes) sizes.add(size);
  }
  return Array.from(sizes);
}

export function getPriceBounds() {
  const priceValues = products.map((product) => product.price);
  return { min: Math.min(...priceValues), max: Math.max(...priceValues) };
}
