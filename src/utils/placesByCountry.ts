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
];

// Structure: { [countryValue]: Array<{ value: stateValue, label: stateLabel, cities: Array<{value,label}> }> }
export const placesByCountry: Record<string, { value: string; label: string; cities: { value: string; label: string }[] }[]> = {
  india: [
    { value: 'maharashtra', label: 'Maharashtra', cities: [{ value: 'mumbai', label: 'Mumbai' }, { value: 'pune', label: 'Pune' }, { value: 'nagpur', label: 'Nagpur' }] },
    { value: 'tamil_nadu', label: 'Tamil Nadu', cities: [{ value: 'chennai', label: 'Chennai' }, { value: 'coimbatore', label: 'Coimbatore' }, { value: 'madurai', label: 'Madurai' }] },
    { value: 'karnataka', label: 'Karnataka', cities: [{ value: 'bangalore', label: 'Bengaluru' }, { value: 'mysore', label: 'Mysuru' }, { value: 'mangalore', label: 'Mangalore' }] },
    { value: 'delhi', label: 'Delhi', cities: [{ value: 'new_delhi', label: 'New Delhi' }, { value: 'north_delhi', label: 'North Delhi' }, { value: 'south_delhi', label: 'South Delhi' }] },
    { value: 'uttar_pradesh', label: 'Uttar Pradesh', cities: [{ value: 'lucknow', label: 'Lucknow' }, { value: 'varanasi', label: 'Varanasi' }, { value: 'allahabad', label: 'Prayagraj' }] },
    { value: 'gujarat', label: 'Gujarat', cities: [{ value: 'ahmedabad', label: 'Ahmedabad' }, { value: 'vadodara', label: 'Vadodara' }, { value: 'surat', label: 'Surat' }] },
    { value: 'west_bengal', label: 'West Bengal', cities: [{ value: 'kolkata', label: 'Kolkata' }, { value: 'howrah', label: 'Howrah' }] },
    { value: 'punjab', label: 'Punjab', cities: [{ value: 'amritsar', label: 'Amritsar' }, { value: 'ludhiana', label: 'Ludhiana' }] },
    { value: 'andhra_pradesh', label: 'Andhra Pradesh', cities: [{ value: 'visakhapatnam', label: 'Visakhapatnam' }, { value: 'vijayawada', label: 'Vijayawada' }] },
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
};

export default placesByCountry;
