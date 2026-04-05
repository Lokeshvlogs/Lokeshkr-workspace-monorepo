// Common countries, states and cities mapping commonly used in Indian matrimonial sites.
// Keep lists concise — expand as needed.
import { Code } from 'lucide-react';
import { SelectOption, SelectIconOption } from 'src/types/select';


export const COUNTRY_OPTIONS : SelectOption[] = [
  { value: 'IN', label: 'India',  },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'AE', label: 'UAE' },
  { value: 'SG', label: 'Singapore' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'QA', label: 'Qatar' },
  { value: 'KW', label: 'Kuwait' },
  { value: 'OM', label: 'Oman' },
  { value: 'BH', label: 'Bahrain' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'IE', label: 'Ireland' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'IT', label: 'Italy' },
  { value: 'ES', label: 'Spain' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'KE', label: 'Kenya' },
  { value: 'PH', label: 'Philippines' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'CN', label: 'China' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'TH', label: 'Thailand' },
  { value: 'AT', label: 'Austria' },
  { value: 'BE', label: 'Belgium' },
  { value: 'BG', label: 'Bulgaria' },
  { value: 'HR', label: 'Croatia' },
  { value: 'CZ', label: 'Czech Republic' },
  { value: 'DK', label: 'Denmark' },
  { value: 'EE', label: 'Estonia' },
  { value: 'FI', label: 'Finland' },
  { value: 'GR', label: 'Greece' },
  { value: 'HU', label: 'Hungary' },
  { value: 'IS', label: 'Iceland' },
  { value: 'LV', label: 'Latvia' },
  { value: 'LT', label: 'Lithuania' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'MT', label: 'Malta' },
  { value: 'NO', label: 'Norway' },
  { value: 'PL', label: 'Poland' },
  { value: 'PT', label: 'Portugal' },
  { value: 'RO', label: 'Romania' },
  { value: 'SK', label: 'Slovakia' },
  { value: 'SI', label: 'Slovenia' },
  { value: 'SE', label: 'Sweden' },
  { value: 'UA', label: 'Ukraine' },
  { value: 'RU', label: 'Russia' },
  { value: 'TR', label: 'Turkey' },
  { value: 'EG', label: 'Egypt' },
  { value: 'MA', label: 'Morocco' },
  { value: 'TN', label: 'Tunisia' },
  { value: 'DZ', label: 'Algeria' },
  { value: 'GH', label: 'Ghana' },
  { value: 'ET', label: 'Ethiopia'},
  { value: 'TZ', label: 'Tanzania' },
  { value: 'JO', label: 'Jordan' },
  { value: 'LB', label: 'Lebanon' },
  { value: 'LK', label: 'Sri Lanka' },
  { value: 'BD', label: 'Bangladesh' },
  { value: 'NP', label: 'Nepal'},
  { value: 'BT', label: 'Bhutan' },
  { value: 'MV', label: 'Maldives' },
  { value: 'PK', label: 'Pakistan'},
  { value: 'AF', label: 'Afghanistan'},
  { value: 'IR', label: 'Iran' },
  { value: 'IQ', label: 'Iraq' },
  { value: 'IL', label: 'Israel' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'KP', label: 'North Korea' },
  {  value: 'VN', label: 'Vietnam' },
  { value: 'KH', label: 'Cambodia' },
  { value: 'LA', label: 'Laos' },
  { value: 'MN', label: 'Mongolia' },
  { value: 'TW', label: 'Taiwan'}
];

// Structure: { [countryValue]: Array<{ value: stateValue, label: stateLabel, cities: Array<{value,label}> }> }
export const placesByCountry: Record<string, { value: string; label: string; cities: { value: string; label: string }[] }[]> = {
  IN: [
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

  US: [
    { value: 'california', label: 'California', cities: [{ value: 'los_angeles', label: 'Los Angeles' }, { value: 'san_francisco', label: 'San Francisco' }, { value: 'san_diego', label: 'San Diego' }] },
    { value: 'new_york', label: 'New York', cities: [{ value: 'new_york_city', label: 'New York City' }, { value: 'buffalo', label: 'Buffalo' }] },
    { value: 'texas', label: 'Texas', cities: [{ value: 'houston', label: 'Houston' }, { value: 'dallas', label: 'Dallas' }] },
    { value: 'new_jersey', label: 'New Jersey', cities: [{ value: 'jersey_city', label: 'Jersey City' }, { value: 'newark', label: 'Newark' }] },
  ],

  GB: [
    { value: 'england', label: 'England', cities: [{ value: 'london', label: 'London' }, { value: 'manchester', label: 'Manchester' }, { value: 'birmingham', label: 'Birmingham' }] },
    { value: 'scotland', label: 'Scotland', cities: [{ value: 'edinburgh', label: 'Edinburgh' }, { value: 'glasgow', label: 'Glasgow' }] },
  ],

  CA: [
    { value: 'ontario', label: 'Ontario', cities: [{ value: 'toronto', label: 'Toronto' }, { value: 'ottawa', label: 'Ottawa' }] },
    { value: 'british_columbia', label: 'British Columbia', cities: [{ value: 'vancouver', label: 'Vancouver' }] },
  ],

  AU: [
    { value: 'new_south_wales', label: 'New South Wales', cities: [{ value: 'sydney', label: 'Sydney' }] },
    { value: 'victoria', label: 'Victoria', cities: [{ value: 'melbourne', label: 'Melbourne' }] },
  ],

  AE: [
    { value: 'dubai', label: 'Dubai', cities: [{ value: 'dubai', label: 'Dubai' }] },
    { value: 'abu_dhabi', label: 'Abu Dhabi', cities: [{ value: 'abu_dhabi', label: 'Abu Dhabi' }] },
    { value: 'sharjah', label: 'Sharjah', cities: [{ value: 'sharjah', label: 'Sharjah' }] },
  ],

  SG: [
    { value: 'singapore', label: 'Singapore', cities: [{ value: 'singapore', label: 'Singapore' }] },
  ],

  NZ: [
    { value: 'auckland', label: 'Auckland', cities: [{ value: 'auckland', label: 'Auckland' }] },
    { value: 'wellington', label: 'Wellington', cities: [{ value: 'wellington', label: 'Wellington' }] },
  ],

  SA: [
    { value: 'riyadh', label: 'Riyadh', cities: [{ value: 'riyadh', label: 'Riyadh' }] },
    { value: 'jeddah', label: 'Jeddah', cities: [{ value: 'jeddah', label: 'Jeddah' }] },
  ],

  QA: [
    { value: 'doha', label: 'Doha', cities: [{ value: 'doha', label: 'Doha' }] },
  ],

  KW: [
    { value: 'kuwait_city', label: 'Kuwait City', cities: [{ value: 'kuwait_city', label: 'Kuwait City' }] },
  ],

  OM: [
    { value: 'muscat', label: 'Muscat', cities: [{ value: 'muscat', label: 'Muscat' }] },
  ],

  BH: [
    { value: 'manama', label: 'Manama', cities: [{ value: 'manama', label: 'Manama' }] },
  ],

  MY: [
    { value: 'kuala_lumpur', label: 'Kuala Lumpur', cities: [{ value: 'kuala_lumpur', label: 'Kuala Lumpur' }] },
    { value: 'penang', label: 'Penang', cities: [{ value: 'penang', label: 'Penang' }] },
  ],

  IE: [
    { value: 'leinster', label: 'Leinster', cities: [{ value: 'dublin', label: 'Dublin' }] },
  ],

  DE: [
    { value: 'berlin', label: 'Berlin', cities: [{ value: 'berlin', label: 'Berlin' }] },
    { value: 'bavaria', label: 'Bavaria', cities: [{ value: 'munich', label: 'Munich' }] },
    { value: 'hessen', label: 'Hesse', cities: [{ value: 'frankfurt', label: 'Frankfurt' }] },
  ],

  FR: [
    { value: 'ile_de_france', label: 'Île-de-France', cities: [{ value: 'paris', label: 'Paris' }] },
    { value: 'auvergne_rhone_alpes', label: 'Auvergne-Rhône-Alpes', cities: [{ value: 'lyon', label: 'Lyon' }] },
  ],

  NL: [
    { value: 'north_holland', label: 'North Holland', cities: [{ value: 'amsterdam', label: 'Amsterdam' }] },
    { value: 'south_holland', label: 'South Holland', cities: [{ value: 'rotterdam', label: 'Rotterdam' }] },
  ],

  CH: [
    { value: 'zurich', label: 'Zurich', cities: [{ value: 'zurich', label: 'Zurich' }] },
    { value: 'geneva', label: 'Geneva', cities: [{ value: 'geneva', label: 'Geneva' }] },
  ],

  IT: [
    { value: 'lombardy', label: 'Lombardy', cities: [{ value: 'milan', label: 'Milan' }] },
    { value: 'lazio', label: 'Lazio', cities: [{ value: 'rome', label: 'Rome' }] },
  ],

  ES: [
    { value: 'madrid', label: 'Madrid', cities: [{ value: 'madrid', label: 'Madrid' }] },
    { value: 'catalonia', label: 'Catalonia', cities: [{ value: 'barcelona', label: 'Barcelona' }] },
  ],

  ZA: [
    { value: 'gauteng', label: 'Gauteng', cities: [{ value: 'johannesburg', label: 'Johannesburg' }, { value: 'pretoria', label: 'Pretoria' }] },
    { value: 'western_cape', label: 'Western Cape', cities: [{ value: 'cape_town', label: 'Cape Town' }] },
  ],

  NG: [
    { value: 'lagos', label: 'Lagos', cities: [{ value: 'lagos', label: 'Lagos' }] },
    { value: 'abuja', label: 'Abuja', cities: [{ value: 'abuja', label: 'Abuja' }] },
  ],

  KE: [
    { value: 'nairobi', label: 'Nairobi', cities: [{ value: 'nairobi', label: 'Nairobi' }] },
  ],

  PH: [
    { value: 'metro_manila', label: 'Metro Manila', cities: [{ value: 'manila', label: 'Manila' }, { value: 'quezon_city', label: 'Quezon City' }] },
  ],

  HK: [
    { value: 'hong_kong', label: 'Hong Kong', cities: [{ value: 'hong_kong', label: 'Hong Kong' }] },
  ],

  CN: [
    { value: 'beijing', label: 'Beijing', cities: [{ value: 'beijing', label: 'Beijing' }] },
    { value: 'shanghai', label: 'Shanghai', cities: [{ value: 'shanghai', label: 'Shanghai' }] },
  ],

  ID: [
    { value: 'jakarta', label: 'Jakarta', cities: [{ value: 'jakarta', label: 'Jakarta' }] },
    { value: 'bali', label: 'Bali', cities: [{ value: 'denpasar', label: 'Denpasar' }] },
  ],

  TH: [
    { value: 'bangkok', label: 'Bangkok', cities: [{ value: 'bangkok', label: 'Bangkok' }] },
    { value: 'chiang_mai', label: 'Chiang Mai', cities: [{ value: 'chiang_mai', label: 'Chiang Mai' }] },
  ],

  AT: [
    { value: 'vienna', label: 'Vienna', cities: [{ value: 'vienna', label: 'Vienna' }] },
    { value: 'styria', label: 'Styria', cities: [{ value: 'graz', label: 'Graz' }] },
  ],

  BE: [
    { value: 'brussels', label: 'Brussels', cities: [{ value: 'brussels', label: 'Brussels' }] },
    { value: 'flanders', label: 'Flanders', cities: [{ value: 'antwerp', label: 'Antwerp' }] },
  ],

  BG: [
    { value: 'sofia_city', label: 'Sofia City', cities: [{ value: 'sofia', label: 'Sofia' }] },
    { value: 'plovdiv', label: 'Plovdiv', cities: [{ value: 'plovdiv', label: 'Plovdiv' }] },
  ],

  HR: [
    { value: 'zagreb', label: 'Zagreb', cities: [{ value: 'zagreb', label: 'Zagreb' }] },
    { value: 'split', label: 'Split', cities: [{ value: 'split', label: 'Split' }] },
  ],

  CZ: [
    { value: 'prague', label: 'Prague', cities: [{ value: 'prague', label: 'Prague' }] },
    { value: 'brno', label: 'Brno', cities: [{ value: 'brno', label: 'Brno' }] },
  ],

  DK: [
    { value: 'capital_region', label: 'Capital Region', cities: [{ value: 'copenhagen', label: 'Copenhagen' }] },
    { value: 'central_denmark', label: 'Central Denmark', cities: [{ value: 'aarhus', label: 'Aarhus' }] },
  ],

  EE: [
    { value: 'harju', label: 'Harju County', cities: [{ value: 'tallinn', label: 'Tallinn' }] },
  ],

  FI: [
    { value: 'uusimaa', label: 'Uusimaa', cities: [{ value: 'helsinki', label: 'Helsinki' }] },
  ],

  GR: [
    { value: 'attica', label: 'Attica', cities: [{ value: 'athens', label: 'Athens' }] },
    { value: 'central_macedonia', label: 'Central Macedonia', cities: [{ value: 'thessaloniki', label: 'Thessaloniki' }] },
  ],

  HU: [
    { value: 'budapest', label: 'Budapest', cities: [{ value: 'budapest', label: 'Budapest' }] },
  ],

  IS: [
    { value: 'reykjavik', label: 'Reykjavik', cities: [{ value: 'reykjavik', label: 'Reykjavik' }] },
  ],

  LV: [
    { value: 'riga_region', label: 'Riga Region', cities: [{ value: 'riga', label: 'Riga' }] },
  ],

  LT: [
    { value: 'vilnius_county', label: 'Vilnius County', cities: [{ value: 'vilnius', label: 'Vilnius' }] },
  ],

  LU: [
    { value: 'luxembourg', label: 'Luxembourg', cities: [{ value: 'luxembourg', label: 'Luxembourg' }] },
  ],

  MT: [
    { value: 'valletta', label: 'Valletta', cities: [{ value: 'valletta', label: 'Valletta' }] },
  ],

  NO: [
    { value: 'oslo', label: 'Oslo', cities: [{ value: 'oslo', label: 'Oslo' }] },
    { value: 'vestland', label: 'Vestland', cities: [{ value: 'bergen', label: 'Bergen' }] },
  ],

  PL: [
    { value: 'mazovia', label: 'Mazovia', cities: [{ value: 'warsaw', label: 'Warsaw' }] },
    { value: 'malopolska', label: 'Małopolska', cities: [{ value: 'krakow', label: 'Krakow' }] },
  ],

  PT: [
    { value: 'lisbon', label: 'Lisbon', cities: [{ value: 'lisbon', label: 'Lisbon' }] },
    { value: 'porto', label: 'Porto', cities: [{ value: 'porto', label: 'Porto' }] },
  ],

  RO: [
    { value: 'bucharest', label: 'Bucharest', cities: [{ value: 'bucharest', label: 'Bucharest' }] },
    { value: 'cluj', label: 'Cluj', cities: [{ value: 'cluj_napoca', label: 'Cluj-Napoca' }] },
  ],

  SK: [
    { value: 'bratislava', label: 'Bratislava', cities: [{ value: 'bratislava', label: 'Bratislava' }] },
  ],

  SI: [
    { value: 'ljubljana', label: 'Ljubljana', cities: [{ value: 'ljubljana', label: 'Ljubljana' }] },
  ],

  SE: [
    { value: 'stockholm', label: 'Stockholm', cities: [{ value: 'stockholm', label: 'Stockholm' }] },
    { value: 'vastra_gotaland', label: 'Västra Götaland', cities: [{ value: 'gothenburg', label: 'Gothenburg' }] },
  ],

  UA: [
    { value: 'kyiv', label: 'Kyiv', cities: [{ value: 'kyiv', label: 'Kyiv' }] },
    { value: 'lviv', label: 'Lviv', cities: [{ value: 'lviv', label: 'Lviv' }] },
  ],
  RU: [
    { value: 'moscow_region', label: 'Moscow', cities: [{ value: 'moscow', label: 'Moscow' }] },
    { value: 'sankt_petersburg', label: 'Saint Petersburg', cities: [{ value: 'saint_petersburg', label: 'Saint Petersburg' }] },
  ],

  TR: [
    { value: 'istanbul', label: 'Istanbul', cities: [{ value: 'istanbul', label: 'Istanbul' }] },
    { value: 'ankara', label: 'Ankara', cities: [{ value: 'ankara', label: 'Ankara' }] },
    { value: 'izmir', label: 'Izmir', cities: [{ value: 'izmir', label: 'Izmir' }] },
  ],

  EG: [
    { value: 'cairo', label: 'Cairo', cities: [{ value: 'cairo', label: 'Cairo' }] },
    { value: 'alexandria', label: 'Alexandria', cities: [{ value: 'alexandria', label: 'Alexandria' }] },
  ],

  MA: [
    { value: 'casablanca', label: 'Casablanca', cities: [{ value: 'casablanca', label: 'Casablanca' }] },
    { value: 'rabat', label: 'Rabat', cities: [{ value: 'rabat', label: 'Rabat' }] },
  ],

  TN: [
    { value: 'tunis', label: 'Tunis', cities: [{ value: 'tunis', label: 'Tunis' }] },
  ],

  DZ: [
    { value: 'algiers', label: 'Algiers', cities: [{ value: 'algiers', label: 'Algiers' }] },
    { value: 'oran', label: 'Oran', cities: [{ value: 'oran', label: 'Oran' }] },
  ],

  GH: [
    { value: 'accra', label: 'Accra', cities: [{ value: 'accra', label: 'Accra' }] },
    { value: 'kumasi', label: 'Kumasi', cities: [{ value: 'kumasi', label: 'Kumasi' }] },
  ],

  ET: [
    { value: 'addis_ababa', label: 'Addis Ababa', cities: [{ value: 'addis_ababa', label: 'Addis Ababa' }] },
  ],

  TZ: [
    { value: 'dar_es_salaam', label: 'Dar es Salaam', cities: [{ value: 'dar_es_salaam', label: 'Dar es Salaam' }] },
  ],

  JO: [
    { value: 'amman', label: 'Amman', cities: [{ value: 'amman', label: 'Amman' }] },
  ],

  LB: [
    { value: 'beirut', label: 'Beirut', cities: [{ value: 'beirut', label: 'Beirut' }] },
  ],

  LK: [
    { value: 'colombo', label: 'Colombo', cities: [{ value: 'colombo', label: 'Colombo' }] },
    { value: 'kandy', label: 'Kandy', cities: [{ value: 'kandy', label: 'Kandy' }] },
  ],

  BD: [
    { value: 'dhaka', label: 'Dhaka', cities: [{ value: 'dhaka', label: 'Dhaka' }] },
    { value: 'chittagong', label: 'Chittagong', cities: [{ value: 'chittagong', label: 'Chittagong' }] },
  ],

  NP: [
    { value: 'kathmandu', label: 'Kathmandu', cities: [{ value: 'kathmandu', label: 'Kathmandu' }] },
    { value: 'pokhara', label: 'Pokhara', cities: [{ value: 'pokhara', label: 'Pokhara' }] },
  ],

  BT: [
    { value: 'thimphu', label: 'Thimphu', cities: [{ value: 'thimphu', label: 'Thimphu' }] },
  ],

  MV: [
    { value: 'male', label: 'Malé', cities: [{ value: 'male', label: 'Malé' }] },
  ],

  PK: [
    { value: 'karachi', label: 'Karachi', cities: [{ value: 'karachi', label: 'Karachi' }] },
    { value: 'lahore', label: 'Lahore', cities: [{ value: 'lahore', label: 'Lahore' }] },
    { value: 'islamabad', label: 'Islamabad', cities: [{ value: 'islamabad', label: 'Islamabad' }] },
  ],

  AF: [
    { value: 'kabul', label: 'Kabul', cities: [{ value: 'kabul', label: 'Kabul' }] },
  ],

  IR: [
    { value: 'tehran', label: 'Tehran', cities: [{ value: 'tehran', label: 'Tehran' }] },
    { value: 'mashhad', label: 'Mashhad', cities: [{ value: 'mashhad', label: 'Mashhad' }] },
  ],

  IQ: [
    { value: 'baghdad', label: 'Baghdad', cities: [{ value: 'baghdad', label: 'Baghdad' }] },
    { value: 'basra', label: 'Basra', cities: [{ value: 'basra', label: 'Basra' }] },
  ],

  IL: [
    { value: 'tel_aviv', label: 'Tel Aviv', cities: [{ value: 'tel_aviv', label: 'Tel Aviv' }] },
    { value: 'jerusalem', label: 'Jerusalem', cities: [{ value: 'jerusalem', label: 'Jerusalem' }] },
  ],

  JP: [
    { value: 'tokyo', label: 'Tokyo', cities: [{ value: 'tokyo', label: 'Tokyo' }] },
    { value: 'osaka', label: 'Osaka', cities: [{ value: 'osaka', label: 'Osaka' }] },
    { value: 'kyoto', label: 'Kyoto', cities: [{ value: 'kyoto', label: 'Kyoto' }] },
  ],

  KR: [
    { value: 'seoul', label: 'Seoul', cities: [{ value: 'seoul', label: 'Seoul' }] },
    { value: 'busan', label: 'Busan', cities: [{ value: 'busan', label: 'Busan' }] },
  ],

  KP: [
    { value: 'pyongyang', label: 'Pyongyang', cities: [{ value: 'pyongyang', label: 'Pyongyang' }] },
  ],

  VN: [
    { value: 'hanoi', label: 'Hanoi', cities: [{ value: 'hanoi', label: 'Hanoi' }] },
    { value: 'ho_chi_minh', label: 'Ho Chi Minh City', cities: [{ value: 'ho_chi_minh', label: 'Ho Chi Minh City' }] },
  ],

  KH: [
    { value: 'phnom_penh', label: 'Phnom Penh', cities: [{ value: 'phnom_penh', label: 'Phnom Penh' }] },
    { value: 'siem_reap', label: 'Siem Reap', cities: [{ value: 'siem_reap', label: 'Siem Reap' }] },
  ],

  LA: [
    { value: 'vientiane', label: 'Vientiane', cities: [{ value: 'vientiane', label: 'Vientiane' }] },
  ],

  MN: [
    { value: 'ulan_bator', label: 'Ulaanbaatar', cities: [{ value: 'ulan_bator', label: 'Ulaanbaatar' }] },
  ],

  TW: [
    { value: 'taipei', label: 'Taipei', cities: [{ value: 'taipei', label: 'Taipei' }] },
    { value: 'kaohsiung', label: 'Kaohsiung', cities: [{ value: 'kaohsiung', label: 'Kaohsiung' }] },
  ],
};

export default placesByCountry;

export const COUNTRY_DIAL_CODES : { [key: string]: string } = {
  'AF': '+93',
  'AL': '+355',
  'DZ': '+213',
  'AD': '+376',
  'AO': '+244',
  'AI': '+1-264',
  'AG': '+1-268',
  'AR': '+54',
  'AM': '+374',
  'AU': '+61',
  'AT': '+43',
  'BE': '+32',
  'BA': '+387',
  'BW': '+267',
  'BG': '+359',
  'BR': '+55',
  'BF': '+226',
  'BN': '+673',
  'CO': '+57',
  'CD': '+243',
  'CF': '+236',
  'HR': '+385',
  'CY': '+357',
  'CZ': '+420',
  'DK': '+45',
  'DJ': '+253',
  'EG': '+20',
  'SV': '+503 ',
  'EE': '+372',
  'ER': '+291',
  'ET': '+251',
  'FI': '+358',
  'FR': '+33',
  'GA': '+241',
  'GM': '+220',
  'GE': '+995',
  'DE': '+49',
  'GH': '+233',
  'GR': '+30',
  'GL': '+299',
  'GT': '+502',
  'GN': '+224',
  'GW': '+245',
  'GY': '+592',
  'HT': '+509',
  'HN': '+504',
  'HU': '+36',
  'IS': '+354',
  'IN': '+91',
  'ID': '+62',
  'IR': '+98',
  'IQ': '+964',
  'IE': '+353',
  'IL': '+972',
  'IT': '+39',
  'JM': '+1-876',
  'JP': '+81',
  'JO': '+962',
  'KZ': '+7',
  'KE': '+254',
  'KI': '+686',
  'KW': '+965',
  'KG': '+996',
  'LA': '+856',
  'LV': '+371',
  'LB': '+961',
  'LS': '+266',
  'LR': '+231',
  'LY': '+218',
  'LI': '+423',
  'LT': '+370',
  'LU': '+352',
  'MO': '+853',
  'MK': '+389',
  'MG': '+261',
  'MW': '+265',
  'MY': '+60',
  'MV': '+960',
  'ML': '+223',
  'MT': '+356',
  'MH': '+692',
  'MQ': '+596',
  'MR': '+222',
  'MU': '+230',
  'YT': '+262',
  'MX': '+52',
  'FM': '+691',
  'MD': '+373',
  'MC': '+377',
  'MN': '+976',
  'ME': '+382',
  'MS': '+1-664',
  'MA': '+212',
  'MZ': '+258',
  'MM': '+95',
  'NA': '+264',
  'NR': '+674',
  'NP': '+977',
  'NL': '+31',
  'NC': '+687',
  'NZ': '+64',
  'NI': '+505',
  'NE': '+227',
  'NG': '+234',
  'NU': '+683',
  'NF': '+672',
  'MP': '+1-670',
  'NO': '+47',
  'OM': '+968',
  'PK': '+92',
  'PW': '+680',
  'PS': '+970',
  'PA': '+507',
  'PG': '+675',
  'PY': '+595',
  'PE': '+51',
  'PH': '+63',
  'PN': '+64',
  'PL': '+48',
  'PT': '+351',
  'PR': '+1-787',
  'QA': '+974',
  'RE': '+262',
  'RO': '+40',
  'RU': '+7',
  'RW': '+250',
  'BL': '+590',
  'SH': '+290',
  'KN': '+1-869',
  'LC': '+1-758',
  'MF': '+590',
  'PM': '+508',
  'VC': '+1-784',
  'WS': '+685',
  'SM': '+378',
  'ST': '+239',
  'SA': '+966',
  'SN': '+221',
  'RS': '+381',
  'SC': '+248',
  'SL': '+232',
  'SG': '+65',
  'SK': '+421',
  'SI': '+386',
  'SB': '+677',
  'SO': '+252',
  'ZA': '+27',
  'SS': '+211',
  'ES': '+34',
  'LK': '+94',
  'SD': '+249',
  'SR': '+597',
  'SZ': '+268',
  'SE': '+46',
  'CH': '+41',
  'SY': '+963',
  'TW': '+886',
  'TJ': '+992',
  'TZ': '+255',
  'TH': '+66',
  'TL': '+670',
  'TG': '+228',
  'TK': '+690',
  'TO': '+676',
  'TT': '+1-868',
  'TN': '+216',
  'TR': '+90',
  'TM': '+993',
  'TC': '+1-649',
  'TV': '+688',
  'UG': '+256',
  'UA': '+380',
  'AE': '+971',
  'GB': '+44',
  'US': '+1',
  'UY': '+598',
  'UZ': '+998',
  'VU': '+678',
  'VE': '+58',
  'VN': '+84',
  'VG': '+1-284',
  'VI': '+1-340',
  'WF': '+681',
  'EH': '+212',
  'YE': '+967',
  'ZM': '+260',
  'ZW': '+263'
};


export const COUNTRY_CODES_OPTIONS: SelectIconOption[] = Object.entries(COUNTRY_DIAL_CODES).map(([code, dialCode]) => ({
  value: code,
  label: dialCode,
  extra_label:  COUNTRY_OPTIONS.find(o => o.value === code)?.label ?? code,
  icon: `https://flagcdn.com/w20/${code.toLowerCase()}.png`
}));
