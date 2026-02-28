// Common countries, states and cities mapping commonly used in Indian matrimonial sites.
// Keep lists concise — expand as needed.
import { SelectOption, SelectIconOption } from 'src/types/select';

export const countryOptions : SelectOption[] = [
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

export const CountryCodes : SelectIconOption[] = [
  { value: '+93', label: 'AF', extra_label: '+93 (Afghanistan)', icon: 'https://flagcdn.com/w20/af.png' },
  { value: '+355', label: 'AL', extra_label: '+355 (Albania)', icon: 'https://flagcdn.com/w20/al.png' },
  { value: '+213', label: 'DZ', extra_label: '+213 (Algeria)', icon: 'https://flagcdn.com/w20/dz.png' },
  { value: '+376', label: 'AD', extra_label: '+376 (Andorra)', icon: 'https://flagcdn.com/w20/ad.png' },
  { value: '+244', label: 'AO', extra_label: '+244 (Angola)', icon: 'https://flagcdn.com/w20/ao.png' },
  { value: '+1-264', label: 'AI', extra_label: '+1-264 (Anguilla)', icon: 'https://flagcdn.com/w20/ai.png' },
  { value: '+1-268', label: 'AG', extra_label: '+1-268 (Antigua & Barbuda)', icon: 'https://flagcdn.com/w20/ag.png' },
  { value: '+54', label: 'AR', extra_label: '+54 (Argentina)', icon: 'https://flagcdn.com/w20/ar.png' },
  { value: '+374', label: 'AM', extra_label: '+374 (Armenia)', icon: 'https://flagcdn.com/w20/am.png' },
  { value: '+61', label: 'AU', extra_label: '+61 (Australia)', icon: 'https://flagcdn.com/w20/au.png' },
  { value: '+43', label: 'AT', extra_label: '+43 (Austria)', icon: 'https://flagcdn.com/w20/at.png' },
  { value: '+32', label: 'BE', extra_label: '+32 (Belgium)', icon: 'https://flagcdn.com/w20/be.png' },
  { value: '+387', label: 'BA', extra_label: '+387 (Bosnia & Herzegovina)', icon: 'https://flagcdn.com/w20/ba.png' },
  { value: '+267', label: 'BW', extra_label: '+267 (Botswana)', icon: 'https://flagcdn.com/w20/bw.png' },
  { value: '+359', label: 'BG', extra_label: '+359 (Bulgaria)', icon: 'https://flagcdn.com/w20/bg.png' },
  { value: '+55', label: 'BR', extra_label: '+55 (Brazil)', icon: 'https://flagcdn.com/w20/br.png' },
  { value: '+226', label: 'BF', extra_label: '+226 (Burkina Faso)', icon: 'https://flagcdn.com/w20/bf.png' },
  { value: '+673', label: 'BN', extra_label: '+673 (Brunei)', icon: 'https://flagcdn.com/w20/bn.png' },
  { value: '+57', label: 'CO', extra_label: '+57 (Colombia)', icon: 'https://flagcdn.com/w20/co.png' },
  { value: '+243', label: 'CD', extra_label: '+243 (Congo - Kinshasa)', icon: 'https://flagcdn.com/w20/cd.png' },
  { value: '+236', label: 'CF', extra_label: '+236 (Central African Republic)', icon: 'https://flagcdn.com/w20/cf.png' },
  { value: '+385', label: 'HR', extra_label: '+385 (Croatia)', icon: 'https://flagcdn.com/w20/hr.png' },
  { value: '+357', label: 'CY', extra_label: '+357 (Cyprus)', icon: 'https://flagcdn.com/w20/cy.png' },
  { value: '+420', label: 'CZ', extra_label: '+420 (Czech Republic)', icon: 'https://flagcdn.com/w20/cz.png' },
  { value: '+45', label: 'DK', extra_label: '+45 (Denmark)', icon: 'https://flagcdn.com/w20/dk.png' },
  { value: '+253', label: 'DJ', extra_label: '+253 (Djibouti)', icon: 'https://flagcdn.com/w20/dj.png' },
  { value: '+20', label: 'EG', extra_label: '+20 (Egypt)', icon: 'https://flagcdn.com/w20/eg.png' },
  { value: '+503', label: 'SV', extra_label: '+503 (El Salvador)', icon: 'https://flagcdn.com/w20/sv.png' },
  { value: '+372', label: 'EE', extra_label: '+372 (Estonia)', icon: 'https://flagcdn.com/w20/ee.png' },
  { value: '+291', label: 'ER', extra_label: '+291 (Eritrea)', icon: 'https://flagcdn.com/w20/er.png' },
  { value: '+251', label: 'ET', extra_label: '+251 (Ethiopia)', icon: 'https://flagcdn.com/w20/et.png' },
  { value: '+358', label: 'FI', extra_label: '+358 (Finland)', icon: 'https://flagcdn.com/w20/fi.png' },
  { value: '+33', label: 'FR', extra_label: '+33 (France)', icon: 'https://flagcdn.com/w20/fr.png' },
  { value: '+241', label: 'GA', extra_label: '+241 (Gabon)', icon: 'https://flagcdn.com/w20/ga.png' },
  { value: '+220', label: 'GM', extra_label: '+220 (Gambia)', icon: 'https://flagcdn.com/w20/gm.png' },
  { value: '+995', label: 'GE', extra_label: '+995 (Georgia)', icon: 'https://flagcdn.com/w20/ge.png' },
  { value: '+49', label: 'DE', extra_label: '+49 (Germany)', icon: 'https://flagcdn.com/w20/de.png' },
  { value: '+233', label: 'GH', extra_label: '+233 (Ghana)', icon: 'https://flagcdn.com/w20/gh.png' },
  { value: '+30', label: 'GR', extra_label: '+30 (Greece)', icon: 'https://flagcdn.com/w20/gr.png' },
  { value: '+502', label: 'GT', extra_label: '+502 (Guatemala)', icon: 'https://flagcdn.com/w20/gt.png' },
  { value: '+852', label: 'HK', extra_label: '+852 (Hong Kong)', icon: 'https://flagcdn.com/w20/hk.png' },
  { value: '+504', label: 'HN', extra_label: '+504 (Honduras)', icon: 'https://flagcdn.com/w20/hn.png' },
  { value: '+36', label: 'HU', extra_label: '+36 (Hungary)', icon: 'https://flagcdn.com/w20/hu.png' },
  { value: '+354', label: 'IS', extra_label: '+354 (Iceland)', icon: 'https://flagcdn.com/w20/is.png' },
  { value: '+91', label: 'IN', extra_label: '+91 (India)', icon: 'https://flagcdn.com/w20/in.png' },
  { value: '+62', label: 'ID', extra_label: '+62 (Indonesia)', icon: 'https://flagcdn.com/w20/id.png' },
  { value: '+98', label: 'IR', extra_label: '+98 (Iran)', icon: 'https://flagcdn.com/w20/ir.png' },
  { value: '+964', label: 'IQ', extra_label: '+964 (Iraq)', icon: 'https://flagcdn.com/w20/iq.png' },
  { value: '+353', label: 'IE', extra_label: '+353 (Ireland)', icon: 'https://flagcdn.com/w20/ie.png' },
  { value: '+39', label: 'IT', extra_label: '+39 (Italy)', icon: 'https://flagcdn.com/w20/it.png' },
  { value: '+81', label: 'JP', extra_label: '+81 (Japan)', icon: 'https://flagcdn.com/w20/jp.png' },
  { value: '+962', label: 'JO', extra_label: '+962 (Jordan)', icon: 'https://flagcdn.com/w20/jo.png' },
  { value: '+7', label: 'RU', extra_label: '+7 (Kazakhstan / Russia)', icon: 'https://flagcdn.com/w20/ru.png' },
  { value: '+254', label: 'KE', extra_label: '+254 (Kenya)', icon: 'https://flagcdn.com/w20/ke.png' },
  { value: '+965', label: 'KW', extra_label: '+965 (Kuwait)', icon: 'https://flagcdn.com/w20/kw.png' },
  { value: '+856', label: 'LA', extra_label: '+856 (Laos)', icon: 'https://flagcdn.com/w20/la.png' },
  { value: '+371', label: 'LV', extra_label: '+371 (Latvia)', icon: 'https://flagcdn.com/w20/lv.png' },
  { value: '+423', label: 'LI', extra_label: '+423 (Liechtenstein)', icon: 'https://flagcdn.com/w20/li.png' },
  { value: '+370', label: 'LT', extra_label: '+370 (Lithuania)', icon: 'https://flagcdn.com/w20/lt.png' },
  { value: '+352', label: 'LU', extra_label: '+352 (Luxembourg)', icon: 'https://flagcdn.com/w20/lu.png' },
  { value: '+853', label: 'MO', extra_label: '+853 (Macau)', icon: 'https://flagcdn.com/w20/mo.png' },
  { value: '+60', label: 'MY', extra_label: '+60 (Malaysia)', icon: 'https://flagcdn.com/w20/my.png' },
  { value: '+356', label: 'MT', extra_label: '+356 (Malta)', icon: 'https://flagcdn.com/w20/mt.png' },
  { value: '+960', label: 'MV', extra_label: '+960 (Maldives)', icon: 'https://flagcdn.com/w20/mv.png' },
  { value: '+223', label: 'ML', extra_label: '+223 (Mali)', icon: 'https://flagcdn.com/w20/ml.png' },
  { value: '+212', label: 'MA', extra_label: '+212 (Morocco)', icon: 'https://flagcdn.com/w20/ma.png' },
  { value: '+258', label: 'MZ', extra_label: '+258 (Mozambique)', icon: 'https://flagcdn.com/w20/mz.png' },
  { value: '+95', label: 'MM', extra_label: '+95 (Myanmar)', icon: 'https://flagcdn.com/w20/mm.png' },
  { value: '+264', label: 'NA', extra_label: '+264 (Namibia)', icon: 'https://flagcdn.com/w20/na.png' },
  { value: '+977', label: 'NP', extra_label: '+977 (Nepal)', icon: 'https://flagcdn.com/w20/np.png' },
  { value: '+31', label: 'NL', extra_label: '+31 (Netherlands)', icon: 'https://flagcdn.com/w20/nl.png' },
  { value: '+687', label: 'NC', extra_label: '+687 (New Caledonia)', icon: 'https://flagcdn.com/w20/nc.png' },
  { value: '+64', label: 'NZ', extra_label: '+64 (New Zealand)', icon: 'https://flagcdn.com/w20/nz.png' },
  { value: '+505', label: 'NI', extra_label: '+505 (Nicaragua)', icon: 'https://flagcdn.com/w20/ni.png' },
  { value: '+234', label: 'NG', extra_label: '+234 (Nigeria)', icon: 'https://flagcdn.com/w20/ng.png' },
  { value: '+47', label: 'NO', extra_label: '+47 (Norway)', icon: 'https://flagcdn.com/w20/no.png' },
  { value: '+968', label: 'OM', extra_label: '+968 (Oman)', icon: 'https://flagcdn.com/w20/om.png' },
  { value: '+92', label: 'PK', extra_label: '+92 (Pakistan)', icon: 'https://flagcdn.com/w20/pk.png' },
  { value: '+507', label: 'PA', extra_label: '+507 (Panama)', icon: 'https://flagcdn.com/w20/pa.png' },
  { value: '+51', label: 'PE', extra_label: '+51 (Peru)', icon: 'https://flagcdn.com/w20/pe.png' },
  { value: '+63', label: 'PH', extra_label: '+63 (Philippines)', icon: 'https://flagcdn.com/w20/ph.png' },
  { value: '+48', label: 'PL', extra_label: '+48 (Poland)', icon: 'https://flagcdn.com/w20/pl.png' },
  { value: '+351', label: 'PT', extra_label: '+351 (Portugal)', icon: 'https://flagcdn.com/w20/pt.png' },
  { value: '+974', label: 'QA', extra_label: '+974 (Qatar)', icon: 'https://flagcdn.com/w20/qa.png' },
  { value: '+40', label: 'RO', extra_label: '+40 (Romania)', icon: 'https://flagcdn.com/w20/ro.png' },
  { value: '+7', label: 'RU', extra_label: '+7 (Russia)', icon: 'https://flagcdn.com/w20/ru.png' },
  { value: '+250', label: 'RW', extra_label: '+250 (Rwanda)', icon: 'https://flagcdn.com/w20/rw.png' },
  { value: '+966', label: 'SA', extra_label: '+966 (Saudi Arabia)', icon: 'https://flagcdn.com/w20/sa.png' },
  { value: '+65', label: 'SG', extra_label: '+65 (Singapore)', icon: 'https://flagcdn.com/w20/sg.png' },
  { value: '+421', label: 'SK', extra_label: '+421 (Slovakia)', icon: 'https://flagcdn.com/w20/sk.png' },
  { value: '+386', label: 'SI', extra_label: '+386 (Slovenia)', icon: 'https://flagcdn.com/w20/si.png' },
  { value: '+27', label: 'ZA', extra_label: '+27 (South Africa)', icon: 'https://flagcdn.com/w20/za.png' },
  { value: '+82', label: 'KR', extra_label: '+82 (South Korea)', icon: 'https://flagcdn.com/w20/kr.png' },
  { value: '+34', label: 'ES', extra_label: '+34 (Spain)', icon: 'https://flagcdn.com/w20/es.png' },
  { value: '+46', label: 'SE', extra_label: '+46 (Sweden)', icon: 'https://flagcdn.com/w20/se.png' },
  { value: '+41', label: 'CH', extra_label: '+41 (Switzerland)', icon: 'https://flagcdn.com/w20/ch.png' },
  { value: '+886', label: 'TW', extra_label: '+886 (Taiwan)', icon: 'https://flagcdn.com/w20/tw.png' },
  { value: '+66', label: 'TH', extra_label: '+66 (Thailand)', icon: 'https://flagcdn.com/w20/th.png' },
  { value: '+216', label: 'TN', extra_label: '+216 (Tunisia)', icon: 'https://flagcdn.com/w20/tn.png' },
  { value: '+90', label: 'TR', extra_label: '+90 (Turkey)', icon: 'https://flagcdn.com/w20/tr.png' },
  { value: '+1', label: 'US', extra_label: '+1 (United States)', icon: 'https://flagcdn.com/w20/us.png' },
  { value: '+44', label: 'UK', extra_label: '+44 (United Kingdom)', icon: 'https://flagcdn.com/w20/gb.png' },
  { value: '+380', label: 'UA', extra_label: '+380 (Ukraine)', icon: 'https://flagcdn.com/w20/ua.png' },
  { value: '+971', label: 'AE', extra_label: '+971 (UAE)', icon: 'https://flagcdn.com/w20/ae.png' },
  { value: '+598', label: 'UY', extra_label: '+598 (Uruguay)', icon: 'https://flagcdn.com/w20/uy.png' },
  { value: '+998', label: 'UZ', extra_label: '+998 (Uzbekistan)', icon: 'https://flagcdn.com/w20/uz.png' },
  { value: '+1-787', label: 'PR', extra_label: '+1-787 (Puerto Rico)', icon: 'https://flagcdn.com/w20/pr.png' },
  { value: '+58', label: 'VE', extra_label: '+58 (Venezuela)', icon: 'https://flagcdn.com/w20/ve.png' },
  { value: '+84', label: 'VN', extra_label: '+84 (Vietnam)', icon: 'https://flagcdn.com/w20/vn.png' },
  { value: '+681', label: 'WF', extra_label: '+681 (Wallis & Futuna)', icon: 'https://flagcdn.com/w20/wf.png' },
  { value: '+212', label: 'EH', extra_label: '+212 (Western Sahara)', icon: 'https://flagcdn.com/w20/eh.png' },
  { value: '+967', label: 'YE', extra_label: '+967 (Yemen)', icon: 'https://flagcdn.com/w20/ye.png' },
  { value: '+260', label: 'ZM', extra_label: '+260 (Zambia)', icon: 'https://flagcdn.com/w20/zm.png' },
  { value: '+263', label: 'ZW', extra_label: '+263 (Zimbabwe)', icon: 'https://flagcdn.com/w20/zw.png' },
];
