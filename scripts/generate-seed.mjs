import { writeFileSync } from 'node:fs';
import { cropReference } from '../packages/shared/domain.mjs';
const q = (x) =>
  x == null ? 'null' : typeof x === 'number' ? String(x) : `'${String(x).replaceAll("'", "''")}'`;
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const sql = ['-- SYNTHETIC DEMO DATA. NOT A LIVE AGRONOMIC OR GOVERNMENT REFERENCE.', 'begin;'];
const insert = (table, cols, values) =>
  sql.push(`insert into public.${table}(${cols}) values(${values.map(q).join(',')});`);
const cropIds = cropReference.map((c) => c.id);
for (const c of cropReference)
  sql.push(
    `insert into public.crop_reference values(${q(c.id)},ARRAY[${c.kc}],ARRAY[${c.stageDays}],${c.duration},${['tomato', 'chilli'].includes(c.id) ? 7 : 180},${c.residueFactor},'Illustrative demo values; FAO-56/local agronomist review required','2026-10-01',now());`,
  );
const roles = [
  'seller',
  'buyer',
  'transporter',
  'storage_operator',
  'landowner',
  'stubble_partner',
  'technician',
  'expert',
  'admin',
];
for (let i = 1; i <= 49; i++) {
  const user = id(i),
    phone = `91999999${String(i).padStart(4, '0')}`;
  sql.push(
    `insert into auth.users(id,instance_id,aud,role,phone,phone_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values(${q(user)},'00000000-0000-0000-0000-000000000000','authenticated','authenticated',${q(phone)},now(),'{}','{}',now(),now()) on conflict(id) do nothing;`,
  );
  const role = i <= 40 ? 'farmer' : roles[i - 41];
  const village = ['Rampur', 'Kithore', 'Mawana', 'Kharkhauda'][(i - 1) % 4];
  sql.push(
    `update public.profiles set role=${q(role)},name=${q(i === 1 ? 'Ramesh Kumar' : `Demo ${role} ${i}`)},village=${q(village)},benchmark_opt_in=true,verified_status='approved',location=extensions.st_setsrid(extensions.st_makepoint(${77.71 + (i % 4) * 0.008},${28.98 + (i % 10) * 0.004}),4326)::extensions.geography where id=${q(user)};`,
  );
  if (i <= 40) {
    insert(
      'fields',
      'id,farmer_id,name,area,unit,ownership,soil,irrigation_method,pump_flow_rate',
      [
        id(100 + i),
        user,
        `Field ${i}`,
        i === 1 ? 2.5 : 2 + (i % 4),
        'acre',
        'owned',
        'alluvial',
        'flood',
        25,
      ],
    );
    sql.push(
      `update fields set location=(select location from profiles where id=${q(user)}) where id=${q(id(100 + i))};`,
    );
    insert(
      'seasons',
      'id,farmer_id,field_id,crop_id,season,variety,sowing_date,yield_quintals,yield_per_acre,sowing_offset_days,fertiliser_splits,soil',
      [
        id(200 + i),
        user,
        id(100 + i),
        'wheat',
        'rabi-2025',
        'HD 3086',
        '2025-11-10',
        40 + i,
        17 + (i % 12),
        i % 4 ? 12 : 2,
        i % 4 ? 1 : 2,
        'alluvial',
      ],
    );
  }
}
const diseaseNames = {
  wheat: ['leaf_rust', 'stripe_rust', 'powdery_mildew'],
  rice: ['bacterial_leaf_blight', 'blast', 'brown_spot'],
  maize: ['common_rust', 'northern_leaf_blight', 'grey_leaf_spot'],
  tomato: ['early_blight', 'late_blight', 'leaf_mold'],
  potato: ['early_blight', 'late_blight', 'black_scurf'],
  onion: ['purple_blotch', 'downy_mildew', 'basal_rot'],
  cotton: ['bacterial_blight', 'alternaria_leaf_spot', 'fusarium_wilt'],
  sugarcane: ['red_rot', 'smut', 'wilt'],
  mustard: ['alternaria_blight', 'white_rust', 'downy_mildew'],
  chilli: ['anthracnose', 'leaf_curl', 'powdery_mildew'],
};
for (const c of cropIds)
  for (const d of diseaseNames[c]) {
    const disease = `${c}_${d}`;
    insert('diseases', 'id,crop_id,name_en,description_en', [
      disease,
      c,
      d.replaceAll('_', ' '),
      'Demo reference. Expert confirmation is required before treatment.',
    ]);
    insert('treatments', 'disease_id,kind,advice_en,safety_en,reference_source', [
      disease,
      'low_cost',
      'Monitor affected plants, avoid spreading contaminated material, and contact an agricultural expert.',
      'No pesticide dose is provided in this demo. Use the registered label and expert crop-specific guidance.',
      'Demo content; qualified review required',
    ]);
  }
const sellerNames = [
  'Kisan Seva Kendra',
  'Hariyali Organics',
  'Bharat Beej Bhandar',
  'Gram Krishi Store',
  'Khet Mitra',
  'Krishi Vikas',
  'Pending Dealer',
];
for (let i = 0; i < 7; i++)
  insert('sellers', 'id,owner_id,name,verified_status', [
    id(300 + i),
    id(41),
    sellerNames[i],
    i === 6 ? 'pending' : 'approved',
  ]);
const names = [
  'Vermicompost',
  'Neem oil',
  'Wheat seed HD 3086',
  'Urea',
  'DAP',
  'Trichoderma',
  'Farmyard manure',
  'Rice seed',
  'Maize seed',
  'Mustard seed',
  'Tomato seed',
  'Onion seed',
  'Potato seed tuber',
  'Cotton seed',
  'Chilli seed',
  'Bio compost',
  'Bone meal',
  'Rock phosphate',
  'Potash',
  'NPK blend',
  'Gypsum',
  'Neem cake',
  'PSB biofertiliser',
  'Azotobacter',
  'Seed trays',
];
for (let i = 0; i < 25; i++) {
  const category =
    i === 3 || i === 4 || i === 18 || i === 19
      ? 'fertiliser'
      : i === 1 || i === 5
        ? 'protection'
        : i < 15 && i >= 2
          ? 'seed'
          : 'manure';
  insert('products', 'id,name_en,category,manufacturer,govt_mrp,mrp_source,mrp_effective_date', [
    id(400 + i),
    names[i],
    category,
    'Demo manufacturer',
    i === 3 ? 266.5 : null,
    i === 3 ? 'Illustrative demo reference; verify government notification' : null,
    i === 3 ? '2026-10-01' : null,
  ]);
  insert(
    'seller_listings',
    'id,seller_id,product_id,price,pack_quantity,pack_unit,stock,delivery_hours,rating,commission',
    [
      id(500 + i),
      id(300 + (i % 6)),
      id(400 + i),
      i === 3 ? 290 : 180 + i * 35,
      i === 3 ? 45 : i === 1 ? 1 : 50,
      'kg',
      100,
      24,
      4.5 + (i % 5) / 10,
      i * 3,
    ],
  );
}
insert('seller_listings', 'seller_id,product_id,price,pack_quantity,pack_unit,stock', [
  id(306),
  id(402),
  1,
  50,
  'kg',
  100,
]);
insert('verified_batches', 'product_id,batch_no,status', [
  id(400),
  'DEMO-VERIFIED-001',
  'verified',
]);
insert('verified_batches', 'product_id,batch_no,status', [
  id(401),
  'DEMO-REPORTED-001',
  'reported_fake',
]);
for (let i = 0; i < 5; i++) {
  insert('mandis', 'id,name,fee_per_quintal', [
    id(600 + i),
    ['Meerut', 'Mawana', 'Hapur', 'Muzaffarnagar', 'Baghpat'][i] + ' Mandi',
    10,
  ]);
  sql.push(
    `insert into mandi_prices(mandi_id,crop_id,price_date,min_price,modal_price,max_price,source) select ${q(id(600 + i))},c.id,'2026-10-18'::date-d,2200+${i * 20}+d,2400+${i * 20}+d,2600+${i * 20}+d,'Synthetic demo data, not Agmarknet' from crop_reference c cross join generate_series(0,59) d;`,
  );
}
for (let i = 0; i < 8; i++)
  insert(
    'buyer_demands',
    'id,owner_id,name,crop_id,quantity_quintals,price_per_quintal,grade,pickup,verified_status',
    [
      id(700 + i),
      id(42),
      [
        'Meerut Farmers Collective',
        'Annapurna Flour Mills',
        'Green Basket FPO',
        'Shakti Grain Traders',
        'Krishi Foods',
        'Village Retail',
        'UP Grain Co',
        'Harvest Partners',
      ][i],
      'wheat',
      100 + i * 20,
      2400 + i * 50,
      'A',
      i % 2 ? 'false' : 'true',
      'approved',
    ],
  );
// Boolean values below are SQL literals, not quoted text (Postgres also accepts the literals above).
for (let i = 0; i < 10; i++) {
  insert(
    'vehicles',
    'id,owner_id,type,capacity_kg,covered,rate_per_km,minimum_fare,vehicle_number,verified_status',
    [
      id(800 + i),
      id(43),
      i % 2 ? 'mini_truck' : 'tractor_trolley',
      3000 + i * 100,
      i % 2 ? 'true' : 'false',
      25 + i,
      500 + i * 50,
      `DEMO UP15 ${1000 + i}`,
      'approved',
    ],
  );
  sql.push(
    `insert into trips(id,vehicle_id,owner_id,departure,return_trip,available_kg,fare) values(${q(id(850 + i))},${q(id(800 + i))},${q(id(43))},'2026-11-01T08:00:00Z',${i < 3},2000,${650 + i * 80});`,
  );
}
for (let i = 0; i < 3; i++)
  sql.push(
    `insert into cold_storages(id,owner_id,name,crops,capacity_total,capacity_available,rate,govt_rate,rate_authority,rate_source,rate_effective_date,verified_status) values(${q(id(900 + i))},${q(id(44))},${q(['Meerut Cold Chain', 'Kisan Fresh Storage', 'Mawana Agro Store'][i])},ARRAY['potato','onion'],100,40,${180 + i * 10},${190 + i * 10},'Demo authority - not verified','Synthetic reference, verify actual notification','2026-10-01','approved');`,
  );
for (let i = 0; i < 2; i++)
  sql.push(
    `insert into stubble_partners(id,owner_id,name,capacity_quintals,accepted_crops,verified_status) values(${q(id(950 + i))},${q(id(46))},${q(['Green Fuel Biomass', 'Meerut CBG Collective'][i])},10000,ARRAY['wheat','rice'],'approved');`,
  );
sql.push(
  `insert into credit_scheme_rules(id,name,version,rate_per_quintal,cap_per_collection,eligible_crops,valid_from,valid_until,active) values(${q(id(960))},'Demo residue exchange',1,40,4000,ARRAY['wheat','rice'],'2026-01-01','2027-12-31',true);`,
);
for (let i = 0; i < 12; i++) {
  const farmer = id(i + 1);
  insert(
    'stubble_pledges',
    'id,farmer_id,field_id,crop_id,expected_quintals,harvest_date,access_details,status',
    [
      id(1000 + i),
      farmer,
      id(101 + i),
      'wheat',
      30 + i,
      '2027-04-15',
      'Demo village road',
      i < 4 ? 'collected' : 'pledged',
    ],
  );
  if (i < 4) {
    insert('stubble_pickups', 'id,pledge_id,partner_id,status', [
      id(1100 + i),
      id(1000 + i),
      id(950 + (i % 2)),
      'collected',
    ]);
    sql.push(
      `insert into stubble_collections(id,pickup_id,farmer_id,crop_id,weight_quintals,photos,farmer_confirmed_at) values(${q(id(1200 + i))},${q(id(1100 + i))},${q(farmer)},'wheat',${30 + i},ARRAY['demo/collection.jpg'],'2026-04-20');`,
    );
    insert('credit_ledger', 'farmer_id,collection_id,scheme_id,amount,kind,request_id', [
      farmer,
      id(1200 + i),
      id(960),
      (30 + i) * 40,
      'credit',
      id(1300 + i),
    ]);
  }
}
for (let i = 0; i < 8; i++)
  insert(
    'land_listings',
    'id,owner_id,title,area_acres,rent_per_acre,season,soil,water_source,verified_status',
    [
      id(1400 + i),
      id(45),
      `Demo village plot ${i + 1}`,
      2 + i / 2,
      15000 + i * 1000,
      'rabi-2026',
      'alluvial',
      i % 2 ? 'canal' : 'borewell',
      'approved',
    ],
  );
for (let i = 0; i < 3; i++) {
  insert('iot_devices', 'id,farmer_id,field_id,type,status,firmware,last_seen', [
    id(1500 + i),
    id(i + 1),
    id(101 + i),
    'sensor',
    'simulated',
    'reference-0.1',
    '2026-10-18T00:00:00Z',
  ]);
  insert('sensor_readings', 'device_id,moisture,temperature,humidity,battery,observed_at', [
    id(1500 + i),
    31 + i,
    28,
    62,
    90,
    '2026-10-18T00:00:00Z',
  ]);
}
insert('iot_packages', 'name,sensors_per_acre,installation_fee,monthly_fee', [
  'Demo starter',
  2,
  4999,
  199,
]);
insert('msp_reference', 'crop_id,season,price_per_quintal,source,effective_date', [
  'wheat',
  'demo-rabi-2026',
  2500,
  'Synthetic demo value - NOT an actual MSP notification',
  '2026-10-01',
]);
for (const table of [
  'sellers',
  'buyer_demands',
  'cold_storages',
  'vehicles',
  'stubble_partners',
  'land_listings',
])
  sql.push(`update ${table} t set location=p.location from profiles p where p.id=t.owner_id;`);
sql.push('commit;');
writeFileSync(new URL('../supabase/seed.sql', import.meta.url), sql.join('\n') + '\n');
console.log(`Generated ${sql.length} SQL statements; all data synthetic.`);
