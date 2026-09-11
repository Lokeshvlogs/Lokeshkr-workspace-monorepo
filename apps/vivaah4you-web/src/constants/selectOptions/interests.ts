import type { SelectOption } from '@lokesh-workspace/ui'

/**
 * What someone is actually like.
 *
 * Two kinds of answer live here, and the split is the point.
 *
 * **Tags** - food, travel, hobbies. Curated lists rather than free text:
 * "Bollywood", "bollywood" and "hindi films" are one taste and three strings,
 * so free tags look expressive and are useless the moment anything tries to
 * match on them. A shared vocabulary is what makes "you both cook" possible.
 * Lists lean Indian-first because the members do, though travel and cuisine
 * stay broad - plenty of members live abroad.
 *
 * **Picks** - music, films, reading. These used to be tags too, and they were
 * the weakest thing on a profile: liking Bollywood is not a fact about anyone.
 * A named song, film or book is, so those three ask for a title (and take a
 * link, which gets unfurled into artwork). They carry no option list at all -
 * see `MediaPick` in `types/profile.ts`.
 *
 * Tag values are stable slugs; only labels are safe to reword.
 */

export const cuisineOptions: SelectOption[] = [
  { value: 'north_indian', label: 'North Indian' },
  { value: 'south_indian', label: 'South Indian' },
  { value: 'bengali', label: 'Bengali' },
  { value: 'gujarati', label: 'Gujarati' },
  { value: 'maharashtrian', label: 'Maharashtrian' },
  { value: 'rajasthani', label: 'Rajasthani' },
  { value: 'punjabi_food', label: 'Punjabi' },
  { value: 'hyderabadi', label: 'Hyderabadi' },
  { value: 'street_food', label: 'Street food / chaat' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'italian', label: 'Italian' },
  { value: 'thai', label: 'Thai' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'continental', label: 'Continental' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'home_cooking', label: 'Home cooking' },
  { value: 'baking', label: 'Baking / desserts' },
  { value: 'kerala', label: 'Kerala' },
  { value: 'goan', label: 'Goan' },
  { value: 'kashmiri', label: 'Kashmiri' },
  { value: 'awadhi', label: 'Awadhi / Lucknowi' },
  { value: 'chettinad', label: 'Chettinad' },
  { value: 'assamese_odia', label: 'Assamese / Odia' },
  { value: 'jain_satvik', label: 'Jain / satvik' },
  { value: 'korean_food', label: 'Korean' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'american_grill', label: 'Grills / barbecue' },
  { value: 'healthy_eating', label: 'Healthy / clean eating' },
  { value: 'tea_coffee', label: 'Chai / coffee' },
  { value: 'experimenting', label: 'Trying new places' },
]

export const travelOptions: SelectOption[] = [
  { value: 'mountains', label: 'Mountains' },
  { value: 'beaches', label: 'Beaches' },
  { value: 'trekking', label: 'Trekking' },
  { value: 'road_trips', label: 'Road trips' },
  { value: 'pilgrimage', label: 'Pilgrimages' },
  { value: 'heritage', label: 'Heritage sites' },
  { value: 'wildlife', label: 'Wildlife / safaris' },
  { value: 'cities', label: 'City breaks' },
  { value: 'international', label: 'International travel' },
  { value: 'backpacking', label: 'Backpacking' },
  { value: 'luxury_stays', label: 'Luxury stays' },
  { value: 'weekend_getaways', label: 'Weekend getaways' },
  { value: 'camping', label: 'Camping' },
  { value: 'food_travel', label: 'Travelling for food' },
  { value: 'homebody', label: 'Happiest at home' },
  { value: 'himalayas', label: 'The Himalayas' },
  { value: 'north_east_india', label: 'North-east India' },
  { value: 'kerala_backwaters', label: 'Backwaters' },
  { value: 'deserts', label: 'Deserts' },
  { value: 'hill_stations', label: 'Hill stations' },
  { value: 'solo_travel', label: 'Solo travel' },
  { value: 'family_holidays', label: 'Family holidays' },
  { value: 'cruises', label: 'Cruises' },
  { value: 'adventure_sports', label: 'Adventure sports' },
  { value: 'scuba_snorkelling', label: 'Scuba / snorkelling' },
  { value: 'skiing', label: 'Snow / skiing' },
  { value: 'festivals_travel', label: 'Festivals & fairs' },
  { value: 'workation', label: 'Working from anywhere' },
]

/**
 * How someone spends their time and what they are like.
 *
 * Kept to observable habits rather than self-flattering adjectives - "plays a
 * sport" says something; "kind" and "honest" are what everybody writes.
 */
export const interestOptions: SelectOption[] = [
  { value: 'fitness', label: 'Fitness / gym' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'running', label: 'Running' },
  { value: 'cricket', label: 'Cricket' },
  { value: 'football', label: 'Football' },
  { value: 'badminton', label: 'Badminton / tennis' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'photography', label: 'Photography' },
  { value: 'painting', label: 'Painting / sketching' },
  { value: 'dancing', label: 'Dancing' },
  { value: 'singing', label: 'Singing' },
  { value: 'playing_instrument', label: 'Playing an instrument' },
  { value: 'writing', label: 'Writing' },
  { value: 'gardening', label: 'Gardening' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'board_games', label: 'Board games / chess' },
  { value: 'volunteering', label: 'Volunteering' },
  { value: 'meditation', label: 'Meditation' },
  { value: 'pets', label: 'Pets / animals' },
  { value: 'diy', label: 'DIY / making things' },
  { value: 'investing', label: 'Investing / markets' },
  { value: 'tech', label: 'Tech / tinkering' },
  { value: 'theatre', label: 'Theatre / stand-up' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'hiking_walks', label: 'Long walks / hiking' },
  { value: 'martial_arts', label: 'Martial arts' },
  { value: 'table_tennis', label: 'Table tennis' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'golf', label: 'Golf' },
  { value: 'motorcycling', label: 'Motorcycling' },
  { value: 'driving', label: 'Driving' },
  { value: 'classical_dance', label: 'Classical dance' },
  { value: 'calligraphy', label: 'Calligraphy / lettering' },
  { value: 'pottery', label: 'Pottery / crafts' },
  { value: 'knitting_stitching', label: 'Stitching / knitting' },
  { value: 'astronomy', label: 'Stargazing' },
  { value: 'birdwatching', label: 'Birdwatching' },
  { value: 'fishing', label: 'Fishing' },
  { value: 'collecting', label: 'Collecting' },
  { value: 'public_speaking', label: 'Public speaking' },
  { value: 'languages', label: 'Learning languages' },
  { value: 'blogging', label: 'Blogging / vlogging' },
  { value: 'temple_visits', label: 'Temple / satsang' },
  { value: 'social_work', label: 'Social work' },
  { value: 'cafe_hopping', label: 'Cafe hopping' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'astrology', label: 'Astrology' },
]

/**
 * The tag categories, in the order the wizard shows them.
 *
 * Hobbies leads because it is the one nobody has to think about - everybody can
 * name something they do - and a first question that is easy to answer is what
 * gets the rest of the section filled in.
 */
export const TAG_CATEGORIES = [
  { key: 'interestsHobbies', label: 'Hobbies & interests', options: interestOptions },
  { key: 'interestsCuisines', label: 'Food you enjoy', options: cuisineOptions },
  { key: 'interestsTravel', label: 'Travel', options: travelOptions },
] as const

/**
 * The pick categories: a title, optionally a link, and whatever artwork the
 * link yielded.
 *
 * `hint` names the sites worth pasting from. It is the only place a member is
 * told that a link does anything, so it has to be specific - "paste a link"
 * would leave them guessing which links work.
 */
export const PICK_CATEGORIES = [
  {
    key: 'interestsMusic',
    label: 'Music you love',
    /** Placeholder on the input. Phrased as an example, not an instruction. */
    placeholder: 'Tum Hi Ho — or a YouTube / Spotify link',
    hint: 'Songs you have on repeat. Paste a YouTube or Spotify link and the artwork comes with it.',
  },
  {
    key: 'interestsMovies',
    label: 'Films & shows',
    placeholder: 'Sholay — or an IMDb link',
    hint: 'Films, shows and series you would recommend. An IMDb link fills in the rest.',
  },
  {
    key: 'interestsBooks',
    label: 'Reading',
    placeholder: 'Godaan — or a Goodreads link',
    hint: 'Books worth passing on. Links from Goodreads, Google Books, Open Library or Wattpad all work.',
  },
] as const

/**
 * Every category, tags and picks together, for anything that needs the whole
 * set rather than one kind - the profile view's ordering, for instance.
 */
export const INTEREST_CATEGORY_KEYS = [
  ...TAG_CATEGORIES.map((category) => category.key),
  ...PICK_CATEGORIES.map((category) => category.key),
] as const
