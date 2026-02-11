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
  
  { value: 'russia', label: 'Russia' },
  { value: 'turkey', label: 'Turkey' },
  { value: 'egypt', label: 'Egypt' },
{ value: 'morocco', label: 'Morocco' },
{ value: 'tunisia', label: 'Tunisia' },
{ value: 'algeria', label: 'Algeria' },
{ value: 'ghana', label: 'Ghana' },
{ value: 'ethiopia', label: 'Ethiopia'},
{ value: 'tanzania', label: 'Tanzania' },
{ value: 'jordan', label: 'Jordan' },
{ value: 'lebanon', label: 'Lebanon' },
{ value: 'sri_lanka', label: 'Sri Lanka' },
{ value: 'bangladesh', label: 'Bangladesh' },
{ value: 'nepal', label: 'Nepal'},
{ value: 'bhutan', label: 'Bhutan' },
{ value: 'maldives', label: 'Maldives' },
{ value: 'pakistan', label: 'Pakistan'},
{ value: 'afghanistan', label: 'Afghanistan'},
{ value: 'iran', label: 'Iran' },
{ value: 'iraq', label: 'Iraq' },
{ value: 'israel', label: 'Israel' },
{ value: 'japan', label: 'Japan' },
{ value: 'south_korea', label: 'South Korea' },
{ value: 'north_korea', label: 'North Korea' },
{  value: 'vietnam', label: 'Vietnam' },
{ value: 'cambodia', label: 'Cambodia' },
{ value: 'laos', label: 'Laos' },
{ value: 'mongolia', label: 'Mongolia' },
{ value: 'taiwan', label: 'Taiwan'}
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
    { value: 'madhya_pradesh', label: 'Madhya Pradesh', cities: [
      { value: 'indore', label: 'Indore' },
      { value: 'bhopal', label: 'Bhopal' },
      { value: 'gwalior', label: 'Gwalior' },
      { value: 'ujjain', label: 'Ujjain' },
      { value: 'jabalpur', label: 'Jabalpur' },
    ] },
    { value: 'sikkim', label: 'Sikkim', cities: [
      { value: 'gangtok', label: 'Gangtok' },
    ] },
    { value: 'manipur', label: 'Manipur', cities: [
      { value: 'imphal', label: 'Imphal' },
    ] },
    { value: 'meghalaya', label: 'Meghalaya', cities: [
      { value: 'shillong', label: 'Shillong' },
    ] },
    { value: 'mizoram', label: 'Mizoram', cities: [
      { value: 'aizawl', label: 'Aizawl' },
    ] },
    { value: 'nagaland', label: 'Nagaland', cities: [
      { value: 'kohima', label: 'Kohima' },
      { value: 'dimapur', label: 'Dimapur' },
    ] },
    { value: 'tripura', label: 'Tripura', cities: [
      { value: 'agartala', label: 'Agartala' },
    ] },
    { value: 'arunachal_pradesh', label: 'Arunachal Pradesh', cities: [
      { value: 'itanagar', label: 'Itanagar' },
    ] },
    { value: 'puducherry', label: 'Puducherry', cities: [
      { value: 'puducherry_city', label: 'Puducherry' },
    ] },
    { value: 'andaman_nicobar', label: 'Andaman & Nicobar Islands', cities: [
      { value: 'port_blair', label: 'Port Blair' },
    ] },
    { value: 'ladakh', label: 'Ladakh', cities: [
      { value: 'leh', label: 'Leh' },
    ] },
    { value: 'lakshadweep', label: 'Lakshadweep', cities: [
      { value: 'kavaratti', label: 'Kavaratti' },
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
  russia: [
    { value: 'moscow_region', label: 'Moscow', cities: [{ value: 'moscow', label: 'Moscow' }] },
    { value: 'sankt_petersburg', label: 'Saint Petersburg', cities: [{ value: 'saint_petersburg', label: 'Saint Petersburg' }] },
  ],

  turkey: [
    { value: 'istanbul', label: 'Istanbul', cities: [{ value: 'istanbul', label: 'Istanbul' }] },
    { value: 'ankara', label: 'Ankara', cities: [{ value: 'ankara', label: 'Ankara' }] },
    { value: 'izmir', label: 'Izmir', cities: [{ value: 'izmir', label: 'Izmir' }] },
  ],

  egypt: [
    { value: 'cairo', label: 'Cairo', cities: [{ value: 'cairo', label: 'Cairo' }] },
    { value: 'alexandria', label: 'Alexandria', cities: [{ value: 'alexandria', label: 'Alexandria' }] },
  ],

  morocco: [
    { value: 'casablanca', label: 'Casablanca', cities: [{ value: 'casablanca', label: 'Casablanca' }] },
    { value: 'rabat', label: 'Rabat', cities: [{ value: 'rabat', label: 'Rabat' }] },
  ],

  tunisia: [
    { value: 'tunis', label: 'Tunis', cities: [{ value: 'tunis', label: 'Tunis' }] },
  ],

  algeria: [
    { value: 'algiers', label: 'Algiers', cities: [{ value: 'algiers', label: 'Algiers' }] },
    { value: 'oran', label: 'Oran', cities: [{ value: 'oran', label: 'Oran' }] },
  ],

  ghana: [
    { value: 'accra', label: 'Accra', cities: [{ value: 'accra', label: 'Accra' }] },
    { value: 'kumasi', label: 'Kumasi', cities: [{ value: 'kumasi', label: 'Kumasi' }] },
  ],

  ethiopia: [
    { value: 'addis_ababa', label: 'Addis Ababa', cities: [{ value: 'addis_ababa', label: 'Addis Ababa' }] },
  ],

  tanzania: [
    { value: 'dar_es_salaam', label: 'Dar es Salaam', cities: [{ value: 'dar_es_salaam', label: 'Dar es Salaam' }] },
  ],

  jordan: [
    { value: 'amman', label: 'Amman', cities: [{ value: 'amman', label: 'Amman' }] },
  ],

  lebanon: [
    { value: 'beirut', label: 'Beirut', cities: [{ value: 'beirut', label: 'Beirut' }] },
  ],

  sri_lanka: [
    { value: 'colombo', label: 'Colombo', cities: [{ value: 'colombo', label: 'Colombo' }] },
    { value: 'kandy', label: 'Kandy', cities: [{ value: 'kandy', label: 'Kandy' }] },
  ],

  bangladesh: [
    { value: 'dhaka', label: 'Dhaka', cities: [{ value: 'dhaka', label: 'Dhaka' }] },
    { value: 'chittagong', label: 'Chittagong', cities: [{ value: 'chittagong', label: 'Chittagong' }] },
  ],

  nepal: [
    { value: 'kathmandu', label: 'Kathmandu', cities: [{ value: 'kathmandu', label: 'Kathmandu' }] },
    { value: 'pokhara', label: 'Pokhara', cities: [{ value: 'pokhara', label: 'Pokhara' }] },
  ],

  bhutan: [
    { value: 'thimphu', label: 'Thimphu', cities: [{ value: 'thimphu', label: 'Thimphu' }] },
  ],

  maldives: [
    { value: 'male', label: 'Malé', cities: [{ value: 'male', label: 'Malé' }] },
  ],

  pakistan: [
    { value: 'karachi', label: 'Karachi', cities: [{ value: 'karachi', label: 'Karachi' }] },
    { value: 'lahore', label: 'Lahore', cities: [{ value: 'lahore', label: 'Lahore' }] },
    { value: 'islamabad', label: 'Islamabad', cities: [{ value: 'islamabad', label: 'Islamabad' }] },
  ],

  afghanistan: [
    { value: 'kabul', label: 'Kabul', cities: [{ value: 'kabul', label: 'Kabul' }] },
  ],

  iran: [
    { value: 'tehran', label: 'Tehran', cities: [{ value: 'tehran', label: 'Tehran' }] },
    { value: 'mashhad', label: 'Mashhad', cities: [{ value: 'mashhad', label: 'Mashhad' }] },
  ],

  iraq: [
    { value: 'baghdad', label: 'Baghdad', cities: [{ value: 'baghdad', label: 'Baghdad' }] },
    { value: 'basra', label: 'Basra', cities: [{ value: 'basra', label: 'Basra' }] },
  ],

  israel: [
    { value: 'tel_aviv', label: 'Tel Aviv', cities: [{ value: 'tel_aviv', label: 'Tel Aviv' }] },
    { value: 'jerusalem', label: 'Jerusalem', cities: [{ value: 'jerusalem', label: 'Jerusalem' }] },
  ],

  japan: [
    { value: 'tokyo', label: 'Tokyo', cities: [{ value: 'tokyo', label: 'Tokyo' }] },
    { value: 'osaka', label: 'Osaka', cities: [{ value: 'osaka', label: 'Osaka' }] },
    { value: 'kyoto', label: 'Kyoto', cities: [{ value: 'kyoto', label: 'Kyoto' }] },
  ],

  south_korea: [
    { value: 'seoul', label: 'Seoul', cities: [{ value: 'seoul', label: 'Seoul' }] },
    { value: 'busan', label: 'Busan', cities: [{ value: 'busan', label: 'Busan' }] },
  ],

  north_korea: [
    { value: 'pyongyang', label: 'Pyongyang', cities: [{ value: 'pyongyang', label: 'Pyongyang' }] },
  ],

  vietnam: [
    { value: 'hanoi', label: 'Hanoi', cities: [{ value: 'hanoi', label: 'Hanoi' }] },
    { value: 'ho_chi_minh', label: 'Ho Chi Minh City', cities: [{ value: 'ho_chi_minh', label: 'Ho Chi Minh City' }] },
  ],

  cambodia: [
    { value: 'phnom_penh', label: 'Phnom Penh', cities: [{ value: 'phnom_penh', label: 'Phnom Penh' }] },
    { value: 'siem_reap', label: 'Siem Reap', cities: [{ value: 'siem_reap', label: 'Siem Reap' }] },
  ],

  laos: [
    { value: 'vientiane', label: 'Vientiane', cities: [{ value: 'vientiane', label: 'Vientiane' }] },
  ],

  mongolia: [
    { value: 'ulan_bator', label: 'Ulaanbaatar', cities: [{ value: 'ulan_bator', label: 'Ulaanbaatar' }] },
  ],

  taiwan: [
    { value: 'taipei', label: 'Taipei', cities: [{ value: 'taipei', label: 'Taipei' }] },
    { value: 'kaohsiung', label: 'Kaohsiung', cities: [{ value: 'kaohsiung', label: 'Kaohsiung' }] },
  ],
};

export default placesByCountry;

export const CountryCodes = [
  { value: '+93', short: 'AF', label: '+93 (Afghanistan)', flag: 'https://flagcdn.com/w20/af.png' },
  { value: '+355', short: 'AL', label: '+355 (Albania)', flag: 'https://flagcdn.com/w20/al.png' },
  { value: '+213', short: 'DZ', label: '+213 (Algeria)', flag: 'https://flagcdn.com/w20/dz.png' },
  { value: '+376', short: 'AD', label: '+376 (Andorra)', flag: 'https://flagcdn.com/w20/ad.png' },
  { value: '+244', short: 'AO', label: '+244 (Angola)', flag: 'https://flagcdn.com/w20/ao.png' },
  { value: '+1-264', short: 'AI', label: '+1-264 (Anguilla)', flag: 'https://flagcdn.com/w20/ai.png' },
  { value: '+1-268', short: 'AG', label: '+1-268 (Antigua & Barbuda)', flag: 'https://flagcdn.com/w20/ag.png' },
  { value: '+54', short: 'AR', label: '+54 (Argentina)', flag: 'https://flagcdn.com/w20/ar.png' },
  { value: '+374', short: 'AM', label: '+374 (Armenia)', flag: 'https://flagcdn.com/w20/am.png' },
  { value: '+61', short: 'AU', label: '+61 (Australia)', flag: 'https://flagcdn.com/w20/au.png' },
  { value: '+43', short: 'AT', label: '+43 (Austria)', flag: 'https://flagcdn.com/w20/at.png' },
  { value: '+32', short: 'BE', label: '+32 (Belgium)', flag: 'https://flagcdn.com/w20/be.png' },
  { value: '+387', short: 'BA', label: '+387 (Bosnia & Herzegovina)', flag: 'https://flagcdn.com/w20/ba.png' },
  { value: '+267', short: 'BW', label: '+267 (Botswana)', flag: 'https://flagcdn.com/w20/bw.png' },
  { value: '+359', short: 'BG', label: '+359 (Bulgaria)', flag: 'https://flagcdn.com/w20/bg.png' },
  { value: '+55', short: 'BR', label: '+55 (Brazil)', flag: 'https://flagcdn.com/w20/br.png' },
  { value: '+226', short: 'BF', label: '+226 (Burkina Faso)', flag: 'https://flagcdn.com/w20/bf.png' },
  { value: '+673', short: 'BN', label: '+673 (Brunei)', flag: 'https://flagcdn.com/w20/bn.png' },
  { value: '+57', short: 'CO', label: '+57 (Colombia)', flag: 'https://flagcdn.com/w20/co.png' },
  { value: '+243', short: 'CD', label: '+243 (Congo - Kinshasa)', flag: 'https://flagcdn.com/w20/cd.png' },
  { value: '+236', short: 'CF', label: '+236 (Central African Republic)', flag: 'https://flagcdn.com/w20/cf.png' },
  { value: '+385', short: 'HR', label: '+385 (Croatia)', flag: 'https://flagcdn.com/w20/hr.png' },
  { value: '+357', short: 'CY', label: '+357 (Cyprus)', flag: 'https://flagcdn.com/w20/cy.png' },
  { value: '+420', short: 'CZ', label: '+420 (Czech Republic)', flag: 'https://flagcdn.com/w20/cz.png' },
  { value: '+45', short: 'DK', label: '+45 (Denmark)', flag: 'https://flagcdn.com/w20/dk.png' },
  { value: '+253', short: 'DJ', label: '+253 (Djibouti)', flag: 'https://flagcdn.com/w20/dj.png' },
  { value: '+20', short: 'EG', label: '+20 (Egypt)', flag: 'https://flagcdn.com/w20/eg.png' },
  { value: '+503', short: 'SV', label: '+503 (El Salvador)', flag: 'https://flagcdn.com/w20/sv.png' },
  { value: '+372', short: 'EE', label: '+372 (Estonia)', flag: 'https://flagcdn.com/w20/ee.png' },
  { value: '+291', short: 'ER', label: '+291 (Eritrea)', flag: 'https://flagcdn.com/w20/er.png' },
  { value: '+251', short: 'ET', label: '+251 (Ethiopia)', flag: 'https://flagcdn.com/w20/et.png' },
  { value: '+358', short: 'FI', label: '+358 (Finland)', flag: 'https://flagcdn.com/w20/fi.png' },
  { value: '+33', short: 'FR', label: '+33 (France)', flag: 'https://flagcdn.com/w20/fr.png' },
  { value: '+241', short: 'GA', label: '+241 (Gabon)', flag: 'https://flagcdn.com/w20/ga.png' },
  { value: '+220', short: 'GM', label: '+220 (Gambia)', flag: 'https://flagcdn.com/w20/gm.png' },
  { value: '+995', short: 'GE', label: '+995 (Georgia)', flag: 'https://flagcdn.com/w20/ge.png' },
  { value: '+49', short: 'DE', label: '+49 (Germany)', flag: 'https://flagcdn.com/w20/de.png' },
  { value: '+233', short: 'GH', label: '+233 (Ghana)', flag: 'https://flagcdn.com/w20/gh.png' },
  { value: '+30', short: 'GR', label: '+30 (Greece)', flag: 'https://flagcdn.com/w20/gr.png' },
  { value: '+502', short: 'GT', label: '+502 (Guatemala)', flag: 'https://flagcdn.com/w20/gt.png' },
  { value: '+852', short: 'HK', label: '+852 (Hong Kong)', flag: 'https://flagcdn.com/w20/hk.png' },
  { value: '+504', short: 'HN', label: '+504 (Honduras)', flag: 'https://flagcdn.com/w20/hn.png' },
  { value: '+36', short: 'HU', label: '+36 (Hungary)', flag: 'https://flagcdn.com/w20/hu.png' },
  { value: '+354', short: 'IS', label: '+354 (Iceland)', flag: 'https://flagcdn.com/w20/is.png' },
  { value: '+91', short: 'IN', label: '+91 (India)', flag: 'https://flagcdn.com/w20/in.png' },
  { value: '+62', short: 'ID', label: '+62 (Indonesia)', flag: 'https://flagcdn.com/w20/id.png' },
  { value: '+98', short: 'IR', label: '+98 (Iran)', flag: 'https://flagcdn.com/w20/ir.png' },
  { value: '+964', short: 'IQ', label: '+964 (Iraq)', flag: 'https://flagcdn.com/w20/iq.png' },
  { value: '+353', short: 'IE', label: '+353 (Ireland)', flag: 'https://flagcdn.com/w20/ie.png' },
  { value: '+39', short: 'IT', label: '+39 (Italy)', flag: 'https://flagcdn.com/w20/it.png' },
  { value: '+81', short: 'JP', label: '+81 (Japan)', flag: 'https://flagcdn.com/w20/jp.png' },
  { value: '+962', short: 'JO', label: '+962 (Jordan)', flag: 'https://flagcdn.com/w20/jo.png' },
  { value: '+7', short: 'RU', label: '+7 (Kazakhstan / Russia)', flag: 'https://flagcdn.com/w20/ru.png' },
  { value: '+254', short: 'KE', label: '+254 (Kenya)', flag: 'https://flagcdn.com/w20/ke.png' },
  { value: '+965', short: 'KW', label: '+965 (Kuwait)', flag: 'https://flagcdn.com/w20/kw.png' },
  { value: '+856', short: 'LA', label: '+856 (Laos)', flag: 'https://flagcdn.com/w20/la.png' },
  { value: '+371', short: 'LV', label: '+371 (Latvia)', flag: 'https://flagcdn.com/w20/lv.png' },
  { value: '+423', short: 'LI', label: '+423 (Liechtenstein)', flag: 'https://flagcdn.com/w20/li.png' },
  { value: '+370', short: 'LT', label: '+370 (Lithuania)', flag: 'https://flagcdn.com/w20/lt.png' },
  { value: '+352', short: 'LU', label: '+352 (Luxembourg)', flag: 'https://flagcdn.com/w20/lu.png' },
  { value: '+853', short: 'MO', label: '+853 (Macau)', flag: 'https://flagcdn.com/w20/mo.png' },
  { value: '+60', short: 'MY', label: '+60 (Malaysia)', flag: 'https://flagcdn.com/w20/my.png' },
  { value: '+356', short: 'MT', label: '+356 (Malta)', flag: 'https://flagcdn.com/w20/mt.png' },
  { value: '+960', short: 'MV', label: '+960 (Maldives)', flag: 'https://flagcdn.com/w20/mv.png' },
  { value: '+223', short: 'ML', label: '+223 (Mali)', flag: 'https://flagcdn.com/w20/ml.png' },
  { value: '+212', short: 'MA', label: '+212 (Morocco)', flag: 'https://flagcdn.com/w20/ma.png' },
  { value: '+258', short: 'MZ', label: '+258 (Mozambique)', flag: 'https://flagcdn.com/w20/mz.png' },
  { value: '+95', short: 'MM', label: '+95 (Myanmar)', flag: 'https://flagcdn.com/w20/mm.png' },
  { value: '+264', short: 'NA', label: '+264 (Namibia)', flag: 'https://flagcdn.com/w20/na.png' },
  { value: '+977', short: 'NP', label: '+977 (Nepal)', flag: 'https://flagcdn.com/w20/np.png' },
  { value: '+31', short: 'NL', label: '+31 (Netherlands)', flag: 'https://flagcdn.com/w20/nl.png' },
  { value: '+687', short: 'NC', label: '+687 (New Caledonia)', flag: 'https://flagcdn.com/w20/nc.png' },
  { value: '+64', short: 'NZ', label: '+64 (New Zealand)', flag: 'https://flagcdn.com/w20/nz.png' },
  { value: '+505', short: 'NI', label: '+505 (Nicaragua)', flag: 'https://flagcdn.com/w20/ni.png' },
  { value: '+234', short: 'NG', label: '+234 (Nigeria)', flag: 'https://flagcdn.com/w20/ng.png' },
  { value: '+47', short: 'NO', label: '+47 (Norway)', flag: 'https://flagcdn.com/w20/no.png' },
  { value: '+968', short: 'OM', label: '+968 (Oman)', flag: 'https://flagcdn.com/w20/om.png' },
  { value: '+92', short: 'PK', label: '+92 (Pakistan)', flag: 'https://flagcdn.com/w20/pk.png' },
  { value: '+507', short: 'PA', label: '+507 (Panama)', flag: 'https://flagcdn.com/w20/pa.png' },
  { value: '+51', short: 'PE', label: '+51 (Peru)', flag: 'https://flagcdn.com/w20/pe.png' },
  { value: '+63', short: 'PH', label: '+63 (Philippines)', flag: 'https://flagcdn.com/w20/ph.png' },
  { value: '+48', short: 'PL', label: '+48 (Poland)', flag: 'https://flagcdn.com/w20/pl.png' },
  { value: '+351', short: 'PT', label: '+351 (Portugal)', flag: 'https://flagcdn.com/w20/pt.png' },
  { value: '+974', short: 'QA', label: '+974 (Qatar)', flag: 'https://flagcdn.com/w20/qa.png' },
  { value: '+40', short: 'RO', label: '+40 (Romania)', flag: 'https://flagcdn.com/w20/ro.png' },
  { value: '+7', short: 'RU', label: '+7 (Russia)', flag: 'https://flagcdn.com/w20/ru.png' },
  { value: '+250', short: 'RW', label: '+250 (Rwanda)', flag: 'https://flagcdn.com/w20/rw.png' },
  { value: '+966', short: 'SA', label: '+966 (Saudi Arabia)', flag: 'https://flagcdn.com/w20/sa.png' },
  { value: '+65', short: 'SG', label: '+65 (Singapore)', flag: 'https://flagcdn.com/w20/sg.png' },
  { value: '+421', short: 'SK', label: '+421 (Slovakia)', flag: 'https://flagcdn.com/w20/sk.png' },
  { value: '+386', short: 'SI', label: '+386 (Slovenia)', flag: 'https://flagcdn.com/w20/si.png' },
  { value: '+27', short: 'ZA', label: '+27 (South Africa)', flag: 'https://flagcdn.com/w20/za.png' },
  { value: '+82', short: 'KR', label: '+82 (South Korea)', flag: 'https://flagcdn.com/w20/kr.png' },
  { value: '+34', short: 'ES', label: '+34 (Spain)', flag: 'https://flagcdn.com/w20/es.png' },
  { value: '+46', short: 'SE', label: '+46 (Sweden)', flag: 'https://flagcdn.com/w20/se.png' },
  { value: '+41', short: 'CH', label: '+41 (Switzerland)', flag: 'https://flagcdn.com/w20/ch.png' },
  { value: '+886', short: 'TW', label: '+886 (Taiwan)', flag: 'https://flagcdn.com/w20/tw.png' },
  { value: '+66', short: 'TH', label: '+66 (Thailand)', flag: 'https://flagcdn.com/w20/th.png' },
  { value: '+216', short: 'TN', label: '+216 (Tunisia)', flag: 'https://flagcdn.com/w20/tn.png' },
  { value: '+90', short: 'TR', label: '+90 (Turkey)', flag: 'https://flagcdn.com/w20/tr.png' },
  { value: '+1', short: 'US', label: '+1 (United States)', flag: 'https://flagcdn.com/w20/us.png' },
  { value: '+44', short: 'UK', label: '+44 (United Kingdom)', flag: 'https://flagcdn.com/w20/gb.png' },
  { value: '+380', short: 'UA', label: '+380 (Ukraine)', flag: 'https://flagcdn.com/w20/ua.png' },
  { value: '+971', short: 'AE', label: '+971 (UAE)', flag: 'https://flagcdn.com/w20/ae.png' },
  { value: '+598', short: 'UY', label: '+598 (Uruguay)', flag: 'https://flagcdn.com/w20/uy.png' },
  { value: '+998', short: 'UZ', label: '+998 (Uzbekistan)', flag: 'https://flagcdn.com/w20/uz.png' },
  { value: '+1-787', short: 'PR', label: '+1-787 (Puerto Rico)', flag: 'https://flagcdn.com/w20/pr.png' },
  { value: '+58', short: 'VE', label: '+58 (Venezuela)', flag: 'https://flagcdn.com/w20/ve.png' },
  { value: '+84', short: 'VN', label: '+84 (Vietnam)', flag: 'https://flagcdn.com/w20/vn.png' },
  { value: '+681', short: 'WF', label: '+681 (Wallis & Futuna)', flag: 'https://flagcdn.com/w20/wf.png' },
  { value: '+212', short: 'EH', label: '+212 (Western Sahara)', flag: 'https://flagcdn.com/w20/eh.png' },
  { value: '+967', short: 'YE', label: '+967 (Yemen)', flag: 'https://flagcdn.com/w20/ye.png' },
  { value: '+260', short: 'ZM', label: '+260 (Zambia)', flag: 'https://flagcdn.com/w20/zm.png' },
  { value: '+263', short: 'ZW', label: '+263 (Zimbabwe)', flag: 'https://flagcdn.com/w20/zw.png' },
];
