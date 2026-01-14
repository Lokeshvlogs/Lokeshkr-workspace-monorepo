// Common countries, states and cities mapping commonly used in Indian matrimonial sites.
// Keep lists concise — expand as needed.

export const countryOptions = [
  { value: 'india', label: 'India' },
  { value: 'united_states', label: 'United States' },
  { value: 'united_kingdom', label: 'United Kingdom' },
  { value: 'canada', label: 'Canada' },
  { value: 'australia', label: 'Australia' },
  { value: 'uae', label: 'UAE' },
  { value: 'singapore', label: 'Singapore' },
  { value: 'new_zealand', label: 'New Zealand' },
  { value: 'saudi_arabia', label: 'Saudi Arabia' },
  { value: 'qatar', label: 'Qatar' },
  { value: 'kuwait', label: 'Kuwait' },
  { value: 'oman', label: 'Oman' },
  { value: 'bahrain', label: 'Bahrain' },
  { value: 'malaysia', label: 'Malaysia' },
  { value: 'ireland', label: 'Ireland' },
  { value: 'germany', label: 'Germany' },
  { value: 'france', label: 'France' },
  { value: 'netherlands', label: 'Netherlands' },
  { value: 'switzerland', label: 'Switzerland' },
  { value: 'italy', label: 'Italy' },
  { value: 'spain', label: 'Spain' },
  { value: 'south_africa', label: 'South Africa' },
  { value: 'nigeria', label: 'Nigeria' },
  { value: 'kenya', label: 'Kenya' },
  { value: 'philippines', label: 'Philippines' },
  { value: 'hong_kong', label: 'Hong Kong' },
  { value: 'china', label: 'China' },
  { value: 'indonesia', label: 'Indonesia' },
  { value: 'thailand', label: 'Thailand' },
  { value: 'austria', label: 'Austria' },
  { value: 'belgium', label: 'Belgium' },
  { value: 'bulgaria', label: 'Bulgaria' },
  { value: 'croatia', label: 'Croatia' },
  { value: 'czech_republic', label: 'Czech Republic' },
  { value: 'denmark', label: 'Denmark' },
  { value: 'estonia', label: 'Estonia' },
  { value: 'finland', label: 'Finland' },
  { value: 'greece', label: 'Greece' },
  { value: 'hungary', label: 'Hungary' },
  { value: 'iceland', label: 'Iceland' },
  { value: 'latvia', label: 'Latvia' },
  { value: 'lithuania', label: 'Lithuania' },
  { value: 'luxembourg', label: 'Luxembourg' },
  { value: 'malta', label: 'Malta' },
  { value: 'norway', label: 'Norway' },
  { value: 'poland', label: 'Poland' },
  { value: 'portugal', label: 'Portugal' },
  { value: 'romania', label: 'Romania' },
  { value: 'slovakia', label: 'Slovakia' },
  { value: 'slovenia', label: 'Slovenia' },
  { value: 'sweden', label: 'Sweden' },
  { value: 'ukraine', label: 'Ukraine' },
];

// Structure: { [countryValue]: Array<{ value: stateValue, label: stateLabel, cities: Array<{value,label}> }> }
export const placesByCountry: Record<string, { value: string; label: string; cities: { value: string; label: string }[] }[]> = {
  india: [
    { value: 'maharashtra', label: 'Maharashtra', cities: [
      { value: 'mumbai', label: 'Mumbai' },
      { value: 'pune', label: 'Pune' },
      { value: 'nagpur', label: 'Nagpur' },
      { value: 'nashik', label: 'Nashik' },
      { value: 'aurangabad', label: 'Aurangabad' },
      { value: 'thane', label: 'Thane' },
      { value: 'navi_mumbai', label: 'Navi Mumbai' },
      { value: 'kalyan', label: 'Kalyan' },
      { value: 'kolhapur', label: 'Kolhapur' },
      { value: 'solapur', label: 'Solapur' },
      { value: 'ahmednagar', label: 'Ahmednagar' },
      { value: 'jalgaon', label: 'Jalgaon' },
    ] },
    { value: 'tamil_nadu', label: 'Tamil Nadu', cities: [
      { value: 'chennai', label: 'Chennai' },
      { value: 'coimbatore', label: 'Coimbatore' },
      { value: 'madurai', label: 'Madurai' },
      { value: 'salem', label: 'Salem' },
      { value: 'tiruchirappalli', label: 'Tiruchirappalli' },
      { value: 'erode', label: 'Erode' },
      { value: 'tirunelveli', label: 'Tirunelveli' },
      { value: 'nagercoil', label: 'Nagercoil' },
      { value: 'kanchipuram', label: 'Kanchipuram' },
    ] },
    { value: 'karnataka', label: 'Karnataka', cities: [
      { value: 'bangalore', label: 'Bengaluru' },
      { value: 'mysore', label: 'Mysuru' },
      { value: 'mangalore', label: 'Mangalore' },
      { value: 'hubli', label: 'Hubli' },
      { value: 'belagavi', label: 'Belagavi' },
      { value: 'davanagere', label: 'Davanagere' },
      { value: 'shivamogga', label: 'Shivamogga' },
      { value: 'tumkur', label: 'Tumkur' },
    ] },
    { value: 'delhi', label: 'Delhi', cities: [
      { value: 'new_delhi', label: 'New Delhi' },
      { value: 'north_delhi', label: 'North Delhi' },
      { value: 'south_delhi', label: 'South Delhi' },
      { value: 'west_delhi', label: 'West Delhi' },
      { value: 'central_delhi', label: 'Central Delhi' },
    ] },
    { value: 'uttar_pradesh', label: 'Uttar Pradesh', cities: [
      { value: 'lucknow', label: 'Lucknow' },
      { value: 'varanasi', label: 'Varanasi' },
      { value: 'prayagraj', label: 'Prayagraj' },
      { value: 'kanpur', label: 'Kanpur' },
      { value: 'noida', label: 'Noida' },
      { value: 'ghaziabad', label: 'Ghaziabad' },
      { value: 'meerut', label: 'Meerut' },
      { value: 'aligarh', label: 'Aligarh' },
      { value: 'bareilly', label: 'Bareilly' },
      { value: 'moradabad', label: 'Moradabad' },
      { value: 'agra', label: 'Agra' },
      { value: 'saharanpur', label: 'Saharanpur' },
    ] },
    { value: 'gujarat', label: 'Gujarat', cities: [
      { value: 'ahmedabad', label: 'Ahmedabad' },
      { value: 'vadodara', label: 'Vadodara' },
      { value: 'surat', label: 'Surat' },
      { value: 'rajkot', label: 'Rajkot' },
      { value: 'bhavnagar', label: 'Bhavnagar' },
      { value: 'jamnagar', label: 'Jamnagar' },
      { value: 'vapi', label: 'Vapi' },
      { value: 'bhuj', label: 'Bhuj' },
    ] },
    { value: 'west_bengal', label: 'West Bengal', cities: [
      { value: 'kolkata', label: 'Kolkata' },
      { value: 'howrah', label: 'Howrah' },
      { value: 'durgapur', label: 'Durgapur' },
      { value: 'asansol', label: 'Asansol' },
      { value: 'siliguri', label: 'Siliguri' },
      { value: 'kharagpur', label: 'Kharagpur' },
    ] },
    { value: 'punjab', label: 'Punjab', cities: [
      { value: 'amritsar', label: 'Amritsar' },
      { value: 'ludhiana', label: 'Ludhiana' },
      { value: 'jalandhar', label: 'Jalandhar' },
      { value: 'chandigarh', label: 'Chandigarh' },
      { value: 'patiala', label: 'Patiala' },
      { value: 'bathinda', label: 'Bathinda' },
      { value: 'sangrur', label: 'Sangrur' },
    ] },
    { value: 'andhra_pradesh', label: 'Andhra Pradesh', cities: [
      { value: 'visakhapatnam', label: 'Visakhapatnam' },
      { value: 'vijayawada', label: 'Vijayawada' },
      { value: 'guntur', label: 'Guntur' },
      { value: 'nellore', label: 'Nellore' },
      { value: 'kurnool', label: 'Kurnool' },
      { value: 'anantapur', label: 'Anantapur' },
    ] },
    { value: 'telangana', label: 'Telangana', cities: [
      { value: 'hyderabad', label: 'Hyderabad' },
      { value: 'warangal', label: 'Warangal' },
      { value: 'nizamabad', label: 'Nizamabad' },
      { value: 'karimnagar', label: 'Karimnagar' },
      { value: 'mahbubnagar', label: 'Mahbubnagar' },
    ] },
    { value: 'rajasthan', label: 'Rajasthan', cities: [
      { value: 'jaipur', label: 'Jaipur' },
      { value: 'jodhpur', label: 'Jodhpur' },
      { value: 'udaipur', label: 'Udaipur' },
      { value: 'kota', label: 'Kota' },
      { value: 'bikaner', label: 'Bikaner' },
      { value: 'sikar', label: 'Sikar' },
      { value: 'alwar', label: 'Alwar' },
      { value: 'jhunjhunu', label: 'Jhunjhunu' },
      { value: 'ajmer', label: 'Ajmer' },
      { value: 'sawai_madhopur', label: 'Sawai Madhopur' },
      { value: 'tonk', label: 'Tonk' },
    ] },
    { value: 'kerala', label: 'Kerala', cities: [
      { value: 'thiruvananthapuram', label: 'Thiruvananthapuram' },
      { value: 'kochi', label: 'Kochi' },
      { value: 'kozhikode', label: 'Kozhikode' },
      { value: 'thrissur', label: 'Thrissur' },
      { value: 'kollam', label: 'Kollam' },
      { value: 'alappuzha', label: 'Alappuzha' },
      { value: 'kottayam', label: 'Kottayam' },
    ] },
    { value: 'odisha', label: 'Odisha', cities: [
      { value: 'bhubaneswar', label: 'Bhubaneswar' },
      { value: 'cuttack', label: 'Cuttack' },
      { value: 'rourkela', label: 'Rourkela' },
      { value: 'berhampur', label: 'Berhampur' },
    ] },
    { value: 'haryana', label: 'Haryana', cities: [
      { value: 'gurugram', label: 'Gurugram' },
      { value: 'faridabad', label: 'Faridabad' },
      { value: 'panipat', label: 'Panipat' },
      { value: 'karnal', label: 'Karnal' },
      { value: 'sonipat', label: 'Sonipat' },
    ] },
    { value: 'bihar', label: 'Bihar', cities: [
      { value: 'patna', label: 'Patna' },
      { value: 'gaya', label: 'Gaya' },
      { value: 'muzaffarpur', label: 'Muzaffarpur' },
      { value: 'bhagalpur', label: 'Bhagalpur' },
      { value: 'siwan', label: 'Siwan' },
    ] },
    { value: 'assam', label: 'Assam', cities: [
      { value: 'guwahati', label: 'Guwahati' },
      { value: 'dibrugarh', label: 'Dibrugarh' },
      { value: 'silchar', label: 'Silchar' },
      { value: 'tezpur', label: 'Tezpur' },
    ] },
    { value: 'jharkhand', label: 'Jharkhand', cities: [
      { value: 'ranchi', label: 'Ranchi' },
      { value: 'jamshedpur', label: 'Jamshedpur' },
      { value: 'dhanbad', label: 'Dhanbad' },
      { value: 'bokaro', label: 'Bokaro' },
    ] },
    { value: 'chhattisgarh', label: 'Chhattisgarh', cities: [
      { value: 'raipur', label: 'Raipur' },
      { value: 'bilaspur', label: 'Bilaspur' },
      { value: 'raigarh', label: 'Raigarh' },
      { value: 'bhilai', label: 'Bhilai' },
    ] },
    { value: 'uttarakhand', label: 'Uttarakhand', cities: [
      { value: 'dehradun', label: 'Dehradun' },
      { value: 'haldwani', label: 'Haldwani' },
      { value: 'haridwar', label: 'Haridwar' },
      { value: 'rudrapur', label: 'Rudrapur' },
    ] },
    { value: 'goa', label: 'Goa', cities: [
      { value: 'panaji', label: 'Panaji' },
      { value: 'margao', label: 'Margao' },
      { value: 'vasco_da_gama', label: 'Vasco da Gama' },
      { value: 'mapusa', label: 'Mapusa' },
    ] },
    { value: 'himachal_pradesh', label: 'Himachal Pradesh', cities: [
      { value: 'shimla', label: 'Shimla' },
      { value: 'dharamshala', label: 'Dharamshala' },
      { value: 'solan', label: 'Solan' },
    ] },
    { value: 'jammu_kashmir', label: 'Jammu & Kashmir', cities: [
      { value: 'srinagar', label: 'Srinagar' },
      { value: 'jammu', label: 'Jammu' },
      { value: 'anantnag', label: 'Anantnag' },
      { value: 'baramulla', label: 'Baramulla' },
    ] },
  ],

  united_states: [
    { value: 'california', label: 'California', cities: [{ value: 'los_angeles', label: 'Los Angeles' }, { value: 'san_francisco', label: 'San Francisco' }, { value: 'san_diego', label: 'San Diego' }] },
    { value: 'new_york', label: 'New York', cities: [{ value: 'new_york_city', label: 'New York City' }, { value: 'buffalo', label: 'Buffalo' }] },
    { value: 'texas', label: 'Texas', cities: [{ value: 'houston', label: 'Houston' }, { value: 'dallas', label: 'Dallas' }] },
    { value: 'new_jersey', label: 'New Jersey', cities: [{ value: 'jersey_city', label: 'Jersey City' }, { value: 'newark', label: 'Newark' }] },
  ],

  united_kingdom: [
    { value: 'england', label: 'England', cities: [{ value: 'london', label: 'London' }, { value: 'manchester', label: 'Manchester' }, { value: 'birmingham', label: 'Birmingham' }] },
    { value: 'scotland', label: 'Scotland', cities: [{ value: 'edinburgh', label: 'Edinburgh' }, { value: 'glasgow', label: 'Glasgow' }] },
  ],

  canada: [
    { value: 'ontario', label: 'Ontario', cities: [{ value: 'toronto', label: 'Toronto' }, { value: 'ottawa', label: 'Ottawa' }] },
    { value: 'british_columbia', label: 'British Columbia', cities: [{ value: 'vancouver', label: 'Vancouver' }] },
  ],

  australia: [
    { value: 'new_south_wales', label: 'New South Wales', cities: [{ value: 'sydney', label: 'Sydney' }] },
    { value: 'victoria', label: 'Victoria', cities: [{ value: 'melbourne', label: 'Melbourne' }] },
  ],

  uae: [
    { value: 'dubai', label: 'Dubai', cities: [{ value: 'dubai', label: 'Dubai' }] },
    { value: 'abu_dhabi', label: 'Abu Dhabi', cities: [{ value: 'abu_dhabi', label: 'Abu Dhabi' }] },
    { value: 'sharjah', label: 'Sharjah', cities: [{ value: 'sharjah', label: 'Sharjah' }] },
  ],

  singapore: [
    { value: 'singapore', label: 'Singapore', cities: [{ value: 'singapore', label: 'Singapore' }] },
  ],

  new_zealand: [
    { value: 'auckland', label: 'Auckland', cities: [{ value: 'auckland', label: 'Auckland' }] },
    { value: 'wellington', label: 'Wellington', cities: [{ value: 'wellington', label: 'Wellington' }] },
  ],

  saudi_arabia: [
    { value: 'riyadh', label: 'Riyadh', cities: [{ value: 'riyadh', label: 'Riyadh' }] },
    { value: 'jeddah', label: 'Jeddah', cities: [{ value: 'jeddah', label: 'Jeddah' }] },
  ],

  qatar: [
    { value: 'doha', label: 'Doha', cities: [{ value: 'doha', label: 'Doha' }] },
  ],

  kuwait: [
    { value: 'kuwait_city', label: 'Kuwait City', cities: [{ value: 'kuwait_city', label: 'Kuwait City' }] },
  ],

  oman: [
    { value: 'muscat', label: 'Muscat', cities: [{ value: 'muscat', label: 'Muscat' }] },
  ],

  bahrain: [
    { value: 'manama', label: 'Manama', cities: [{ value: 'manama', label: 'Manama' }] },
  ],

  malaysia: [
    { value: 'kuala_lumpur', label: 'Kuala Lumpur', cities: [{ value: 'kuala_lumpur', label: 'Kuala Lumpur' }] },
    { value: 'penang', label: 'Penang', cities: [{ value: 'penang', label: 'Penang' }] },
  ],

  ireland: [
    { value: 'leinster', label: 'Leinster', cities: [{ value: 'dublin', label: 'Dublin' }] },
  ],

  germany: [
    { value: 'berlin', label: 'Berlin', cities: [{ value: 'berlin', label: 'Berlin' }] },
    { value: 'bavaria', label: 'Bavaria', cities: [{ value: 'munich', label: 'Munich' }] },
    { value: 'hessen', label: 'Hesse', cities: [{ value: 'frankfurt', label: 'Frankfurt' }] },
  ],

  france: [
    { value: 'ile_de_france', label: 'Île-de-France', cities: [{ value: 'paris', label: 'Paris' }] },
    { value: 'auvergne_rhone_alpes', label: 'Auvergne-Rhône-Alpes', cities: [{ value: 'lyon', label: 'Lyon' }] },
  ],

  netherlands: [
    { value: 'north_holland', label: 'North Holland', cities: [{ value: 'amsterdam', label: 'Amsterdam' }] },
    { value: 'south_holland', label: 'South Holland', cities: [{ value: 'rotterdam', label: 'Rotterdam' }] },
  ],

  switzerland: [
    { value: 'zurich', label: 'Zurich', cities: [{ value: 'zurich', label: 'Zurich' }] },
    { value: 'geneva', label: 'Geneva', cities: [{ value: 'geneva', label: 'Geneva' }] },
  ],

  italy: [
    { value: 'lombardy', label: 'Lombardy', cities: [{ value: 'milan', label: 'Milan' }] },
    { value: 'lazio', label: 'Lazio', cities: [{ value: 'rome', label: 'Rome' }] },
  ],

  spain: [
    { value: 'madrid', label: 'Madrid', cities: [{ value: 'madrid', label: 'Madrid' }] },
    { value: 'catalonia', label: 'Catalonia', cities: [{ value: 'barcelona', label: 'Barcelona' }] },
  ],

  south_africa: [
    { value: 'gauteng', label: 'Gauteng', cities: [{ value: 'johannesburg', label: 'Johannesburg' }, { value: 'pretoria', label: 'Pretoria' }] },
    { value: 'western_cape', label: 'Western Cape', cities: [{ value: 'cape_town', label: 'Cape Town' }] },
  ],

  nigeria: [
    { value: 'lagos', label: 'Lagos', cities: [{ value: 'lagos', label: 'Lagos' }] },
    { value: 'abuja', label: 'Abuja', cities: [{ value: 'abuja', label: 'Abuja' }] },
  ],

  kenya: [
    { value: 'nairobi', label: 'Nairobi', cities: [{ value: 'nairobi', label: 'Nairobi' }] },
  ],

  philippines: [
    { value: 'metro_manila', label: 'Metro Manila', cities: [{ value: 'manila', label: 'Manila' }, { value: 'quezon_city', label: 'Quezon City' }] },
  ],

  hong_kong: [
    { value: 'hong_kong', label: 'Hong Kong', cities: [{ value: 'hong_kong', label: 'Hong Kong' }] },
  ],

  china: [
    { value: 'beijing', label: 'Beijing', cities: [{ value: 'beijing', label: 'Beijing' }] },
    { value: 'shanghai', label: 'Shanghai', cities: [{ value: 'shanghai', label: 'Shanghai' }] },
  ],

  indonesia: [
    { value: 'jakarta', label: 'Jakarta', cities: [{ value: 'jakarta', label: 'Jakarta' }] },
    { value: 'bali', label: 'Bali', cities: [{ value: 'denpasar', label: 'Denpasar' }] },
  ],

  thailand: [
    { value: 'bangkok', label: 'Bangkok', cities: [{ value: 'bangkok', label: 'Bangkok' }] },
    { value: 'chiang_mai', label: 'Chiang Mai', cities: [{ value: 'chiang_mai', label: 'Chiang Mai' }] },
  ],

  austria: [
    { value: 'vienna', label: 'Vienna', cities: [{ value: 'vienna', label: 'Vienna' }] },
    { value: 'styria', label: 'Styria', cities: [{ value: 'graz', label: 'Graz' }] },
  ],

  belgium: [
    { value: 'brussels', label: 'Brussels', cities: [{ value: 'brussels', label: 'Brussels' }] },
    { value: 'flanders', label: 'Flanders', cities: [{ value: 'antwerp', label: 'Antwerp' }] },
  ],

  bulgaria: [
    { value: 'sofia_city', label: 'Sofia City', cities: [{ value: 'sofia', label: 'Sofia' }] },
    { value: 'plovdiv', label: 'Plovdiv', cities: [{ value: 'plovdiv', label: 'Plovdiv' }] },
  ],

  croatia: [
    { value: 'zagreb', label: 'Zagreb', cities: [{ value: 'zagreb', label: 'Zagreb' }] },
    { value: 'split', label: 'Split', cities: [{ value: 'split', label: 'Split' }] },
  ],

  czech_republic: [
    { value: 'prague', label: 'Prague', cities: [{ value: 'prague', label: 'Prague' }] },
    { value: 'brno', label: 'Brno', cities: [{ value: 'brno', label: 'Brno' }] },
  ],

  denmark: [
    { value: 'capital_region', label: 'Capital Region', cities: [{ value: 'copenhagen', label: 'Copenhagen' }] },
    { value: 'central_denmark', label: 'Central Denmark', cities: [{ value: 'aarhus', label: 'Aarhus' }] },
  ],

  estonia: [
    { value: 'harju', label: 'Harju County', cities: [{ value: 'tallinn', label: 'Tallinn' }] },
  ],

  finland: [
    { value: 'uusimaa', label: 'Uusimaa', cities: [{ value: 'helsinki', label: 'Helsinki' }] },
  ],

  greece: [
    { value: 'attica', label: 'Attica', cities: [{ value: 'athens', label: 'Athens' }] },
    { value: 'central_macedonia', label: 'Central Macedonia', cities: [{ value: 'thessaloniki', label: 'Thessaloniki' }] },
  ],

  hungary: [
    { value: 'budapest', label: 'Budapest', cities: [{ value: 'budapest', label: 'Budapest' }] },
  ],

  iceland: [
    { value: 'reykjavik', label: 'Reykjavik', cities: [{ value: 'reykjavik', label: 'Reykjavik' }] },
  ],

  latvia: [
    { value: 'riga_region', label: 'Riga Region', cities: [{ value: 'riga', label: 'Riga' }] },
  ],

  lithuania: [
    { value: 'vilnius_county', label: 'Vilnius County', cities: [{ value: 'vilnius', label: 'Vilnius' }] },
  ],

  luxembourg: [
    { value: 'luxembourg', label: 'Luxembourg', cities: [{ value: 'luxembourg', label: 'Luxembourg' }] },
  ],

  malta: [
    { value: 'valletta', label: 'Valletta', cities: [{ value: 'valletta', label: 'Valletta' }] },
  ],

  norway: [
    { value: 'oslo', label: 'Oslo', cities: [{ value: 'oslo', label: 'Oslo' }] },
    { value: 'vestland', label: 'Vestland', cities: [{ value: 'bergen', label: 'Bergen' }] },
  ],

  poland: [
    { value: 'mazovia', label: 'Mazovia', cities: [{ value: 'warsaw', label: 'Warsaw' }] },
    { value: 'malopolska', label: 'Małopolska', cities: [{ value: 'krakow', label: 'Krakow' }] },
  ],

  portugal: [
    { value: 'lisbon', label: 'Lisbon', cities: [{ value: 'lisbon', label: 'Lisbon' }] },
    { value: 'porto', label: 'Porto', cities: [{ value: 'porto', label: 'Porto' }] },
  ],

  romania: [
    { value: 'bucharest', label: 'Bucharest', cities: [{ value: 'bucharest', label: 'Bucharest' }] },
    { value: 'cluj', label: 'Cluj', cities: [{ value: 'cluj_napoca', label: 'Cluj-Napoca' }] },
  ],

  slovakia: [
    { value: 'bratislava', label: 'Bratislava', cities: [{ value: 'bratislava', label: 'Bratislava' }] },
  ],

  slovenia: [
    { value: 'ljubljana', label: 'Ljubljana', cities: [{ value: 'ljubljana', label: 'Ljubljana' }] },
  ],

  sweden: [
    { value: 'stockholm', label: 'Stockholm', cities: [{ value: 'stockholm', label: 'Stockholm' }] },
    { value: 'vastra_gotaland', label: 'Västra Götaland', cities: [{ value: 'gothenburg', label: 'Gothenburg' }] },
  ],

  ukraine: [
    { value: 'kyiv', label: 'Kyiv', cities: [{ value: 'kyiv', label: 'Kyiv' }] },
    { value: 'lviv', label: 'Lviv', cities: [{ value: 'lviv', label: 'Lviv' }] },
  ],
};

export default placesByCountry;
