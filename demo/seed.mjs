// Fills a fresh NutriTrace instance with sample data for a test drive:
// 14 foods and two weeks of diary days (meals, water, weigh-ins), so the
// Diary, Statistics and Goals pages have something to show.
//
// Usage (Node 20+, server already running):
//   NT_USER=demo NT_PASS='DemoPass123!' node demo/seed.mjs
//   NT_URL=http://localhost:3001 node demo/seed.mjs   # single-user mode, no login
//
// Run it once: each run adds the foods and diary items again.

const BASE = (process.env.NT_URL || 'http://localhost:3001').replace(/\/$/, '');
const H = { 'content-type': 'application/json' };

if (process.env.NT_USER) {
  const res = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: H,
    body: JSON.stringify({ username: process.env.NT_USER, password: process.env.NT_PASS || '' }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.token) {
    console.error(`Login failed (${res.status}): ${body.error || 'no token returned'}`);
    process.exit(1);
  }
  H.authorization = 'Bearer ' + body.token;
}

async function call(method, path, payload) {
  const res = await fetch(BASE + path, { method, headers: H, body: JSON.stringify(payload) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${body.error || JSON.stringify(body)}`);
  return body;
}

// Nutrition is per portion.
const FOODS = [
  { name: 'Rolled Oats', brand: 'Generic', portion: 40, unit: 'g', category: 'Grains', nutrition: { calories: 150, proteins: 5, carbohydrates: 27, fat: 3, fiber: 4, sugars: 1 } },
  { name: 'Greek Yogurt 2%', brand: 'Fage', portion: 170, unit: 'g', category: 'Dairy', nutrition: { calories: 150, proteins: 17, carbohydrates: 6, fat: 4, sugars: 6, calcium: 200 } },
  { name: 'Blueberries', portion: 75, unit: 'g', category: 'Fruit', nutrition: { calories: 43, proteins: 0.5, carbohydrates: 11, fat: 0.2, fiber: 1.8, sugars: 7.5 } },
  { name: 'Banana', portion: 118, unit: 'g', category: 'Fruit', nutrition: { calories: 105, proteins: 1.3, carbohydrates: 27, fat: 0.4, fiber: 3.1, sugars: 14, potassium: 422 } },
  { name: 'Chicken Breast, grilled', portion: 150, unit: 'g', category: 'Meat', nutrition: { calories: 248, proteins: 46, carbohydrates: 0, fat: 5.4, sodium: 110 } },
  { name: 'Brown Rice, cooked', portion: 150, unit: 'g', category: 'Grains', nutrition: { calories: 166, proteins: 3.9, carbohydrates: 34, fat: 1.3, fiber: 2.7 } },
  { name: 'Broccoli, steamed', portion: 100, unit: 'g', category: 'Vegetables', nutrition: { calories: 35, proteins: 2.4, carbohydrates: 7, fat: 0.4, fiber: 3.3, 'vitamin-c': 65 } },
  { name: 'Salmon Fillet', portion: 140, unit: 'g', category: 'Fish', nutrition: { calories: 290, proteins: 31, carbohydrates: 0, fat: 18, sodium: 85 } },
  { name: 'Sweet Potato, baked', portion: 150, unit: 'g', category: 'Vegetables', nutrition: { calories: 135, proteins: 3, carbohydrates: 31, fat: 0.2, fiber: 5 } },
  { name: 'Almonds', portion: 28, unit: 'g', category: 'Nuts', nutrition: { calories: 164, proteins: 6, carbohydrates: 6, fat: 14, fiber: 3.5 } },
  { name: 'Whole Wheat Bread', portion: 45, unit: 'g', category: 'Bakery', nutrition: { calories: 110, proteins: 5, carbohydrates: 22, fat: 1.5, fiber: 5, sugars: 5 } },
  { name: 'Peanut Butter', portion: 32, unit: 'g', category: 'Spreads', nutrition: { calories: 190, proteins: 7, carbohydrates: 7, fat: 16, fiber: 2, sugars: 3 } },
  { name: 'Eggs, scrambled', portion: 100, unit: 'g', category: 'Eggs', nutrition: { calories: 149, proteins: 10, carbohydrates: 1.6, fat: 11 } },
  { name: 'Cappuccino', portion: 240, unit: 'ml', category: 'Drinks', nutrition: { calories: 110, proteins: 6, carbohydrates: 9, fat: 6, sugars: 9 } },
];

// [food, meal slot (0 Breakfast, 1 Lunch, 2 Dinner, 3 Snacks), servings]
const DAY_PLANS = [
  [['Rolled Oats', 0, 1.5], ['Blueberries', 0, 1], ['Cappuccino', 0, 1], ['Chicken Breast, grilled', 1, 1], ['Brown Rice, cooked', 1, 1], ['Broccoli, steamed', 1, 1], ['Salmon Fillet', 2, 1], ['Sweet Potato, baked', 2, 1], ['Almonds', 3, 1]],
  [['Greek Yogurt 2%', 0, 1], ['Banana', 0, 1], ['Whole Wheat Bread', 1, 2], ['Peanut Butter', 1, 1], ['Chicken Breast, grilled', 2, 1.2], ['Brown Rice, cooked', 2, 1], ['Broccoli, steamed', 2, 1.5], ['Blueberries', 3, 1]],
  [['Eggs, scrambled', 0, 1.5], ['Whole Wheat Bread', 0, 1], ['Cappuccino', 0, 1], ['Salmon Fillet', 1, 1], ['Brown Rice, cooked', 1, 1], ['Chicken Breast, grilled', 2, 1], ['Sweet Potato, baked', 2, 1], ['Greek Yogurt 2%', 3, 1]],
  [['Rolled Oats', 0, 1], ['Banana', 0, 1], ['Chicken Breast, grilled', 1, 1], ['Broccoli, steamed', 1, 2], ['Salmon Fillet', 2, 1], ['Brown Rice, cooked', 2, 1.3], ['Almonds', 3, 1], ['Cappuccino', 3, 1]],
];

const foods = {};
for (const f of FOODS) foods[f.name] = await call('POST', '/api/foods', f);
console.log(`Added ${FOODS.length} foods`);

const today = new Date();
let weight = 81.4;
for (let back = 13; back >= 0; back--) {
  const day = new Date(today);
  day.setDate(today.getDate() - back);
  const date = day.toLocaleDateString('sv-SE'); // YYYY-MM-DD in local time
  // Today is half logged, so there is something left to add.
  const plan = back === 0 ? DAY_PLANS[0].slice(0, 6) : DAY_PLANS[back % DAY_PLANS.length];
  const items = plan.map(([name, meal, quantity], i) => ({
    ...foods[name],
    food_server_id: foods[name].id,
    uuid: crypto.randomUUID(),
    meal,
    quantity,
    addedAt: new Date(day.getTime() + i * 3600e3).toISOString(),
  }));
  const water = Array.from({ length: back === 0 ? 4 : 6 + (back % 3) }, (_, i) => ({
    uuid: crypto.randomUUID(), amount: 250, time: new Date(day.getTime() + i * 5400e3).toISOString(),
  }));
  weight -= back % 3 === 0 ? 0.03 : 0.12;
  const body_stats = back % 2 === 0 ? { weight: Math.round(weight * 10) / 10 } : {};
  await call('PUT', '/api/diary/' + date, { items, water, body_stats });
}
console.log('Added 14 diary days');
