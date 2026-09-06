import type { SelectOption } from '@lokesh-workspace/ui'

/**
 * What someone is actually like, as pickable tags.
 *
 * Curated lists rather than free text on purpose. "Bollywood", "bollywood" and
 * "hindi films" are the same taste but three different strings, so free tags
 * would look expressive and be useless the moment anything tried to match on
 * them. A shared vocabulary is what makes "you both love ghazals" possible.
 *
 * Lists lean Indian-first because the members are, but travel and cuisine stay
 * broad - plenty of members live abroad.
 *
 * Values are stable slugs; only labels are safe to reword.
 */

export const musicOptions: SelectOption[] = [
  { value: 'bollywood', label: 'Bollywood' },
  { value: 'indie', label: 'Indie' },
  { value: 'hindustani_classical', label: 'Hindustani classical' },
  { value: 'carnatic', label: 'Carnatic' },
  { value: 'ghazal', label: 'Ghazals' },
  { value: 'sufi', label: 'Sufi' },
  { value: 'devotional', label: 'Devotional / bhajans' },
  { value: 'folk', label: 'Folk' },
  { value: 'punjabi', label: 'Punjabi / bhangra' },
  { value: 'rock', label: 'Rock' },
  { value: 'pop', label: 'Pop' },
  { value: 'hip_hop', label: 'Hip-hop / rap' },
  { value: 'edm', label: 'Electronic / EDM' },
  { value: 'jazz_blues', label: 'Jazz / blues' },
  { value: 'western_classical', label: 'Western classical' },
  { value: 'lo_fi', label: 'Lo-fi / chill' },
  { value: 'regional_cinema_music', label: 'Regional film music' },
  { value: 'instrumental', label: 'Instrumental' },
]

export const movieOptions: SelectOption[] = [
  { value: 'bollywood_films', label: 'Bollywood' },
  { value: 'regional_cinema', label: 'Regional cinema' },
  { value: 'hollywood', label: 'Hollywood' },
  { value: 'world_cinema', label: 'World cinema' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'thriller', label: 'Thriller / mystery' },
  { value: 'action', label: 'Action' },
  { value: 'romance', label: 'Romance' },
  { value: 'drama', label: 'Drama' },
  { value: 'sci_fi', label: 'Sci-fi' },
  { value: 'horror', label: 'Horror' },
  { value: 'documentary', label: 'Documentaries' },
  { value: 'anime', label: 'Anime' },
  { value: 'classics', label: 'Old classics' },
  { value: 'web_series', label: 'Web series / OTT' },
  { value: 'sports_viewing', label: 'Live sport' },
]

export const bookOptions: SelectOption[] = [
  { value: 'fiction', label: 'Fiction' },
  { value: 'literary_fiction', label: 'Literary fiction' },
  { value: 'mythology', label: 'Mythology' },
  { value: 'history', label: 'History' },
  { value: 'biography', label: 'Biography / memoir' },
  { value: 'self_help', label: 'Self-help' },
  { value: 'business', label: 'Business / economics' },
  { value: 'science', label: 'Popular science' },
  { value: 'philosophy', label: 'Philosophy' },
  { value: 'spirituality', label: 'Spirituality' },
  { value: 'poetry', label: 'Poetry / shayari' },
  { value: 'crime_thriller', label: 'Crime / thriller' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'regional_literature', label: 'Regional literature' },
  { value: 'comics', label: 'Comics / graphic novels' },
  { value: 'not_much_reading', label: 'Not much of a reader' },
]

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
]

/** Every interest category, so the wizard and the profile view stay in step. */
export const INTEREST_CATEGORIES = [
  { key: 'interestsMusic', label: 'Music you love', options: musicOptions },
  { key: 'interestsMovies', label: 'Films & shows', options: movieOptions },
  { key: 'interestsBooks', label: 'Reading', options: bookOptions },
  { key: 'interestsCuisines', label: 'Food you enjoy', options: cuisineOptions },
  { key: 'interestsTravel', label: 'Travel', options: travelOptions },
  { key: 'interestsHobbies', label: 'Hobbies & interests', options: interestOptions },
] as const
