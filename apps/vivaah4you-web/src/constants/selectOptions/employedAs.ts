import type { SelectOption } from '@lokesh-workspace/ui'

import { employedAsOptions } from '@/constants/selectOptions/career'

/**
 * Seniority options that suit the profession chosen.
 *
 * One generic ladder served every profession, and it fitted almost none of
 * them: "Senior Management" means nothing to a resident doctor, and
 * "Consultant" means something entirely different to a surgeon than to a
 * management consultant. `employedAsOptions` stays as the fallback and is what
 * every unmapped profession still gets.
 *
 * Safe to reshape freely, unlike `professionOptions`: `employed_as` is display
 * only - nothing filters, scores or matches on it.
 */

const ladder = (pairs: [string, string][]): SelectOption[] =>
  pairs.map(([value, label]) => ({ value, label }))

const MEDICAL = ladder([
  ['intern', 'Intern / House Officer'],
  ['resident', 'Resident'],
  ['registrar', 'Registrar'],
  ['consultant_doctor', 'Consultant'],
  ['senior_consultant', 'Senior Consultant'],
  ['head_of_department', 'Head of Department'],
  ['own_practice', 'Own practice / Clinic'],
  ['visiting', 'Visiting Practitioner'],
  ['other', 'Other'],
])

const TECH = ladder([
  ['intern', 'Intern'],
  ['junior_engineer', 'Junior Engineer'],
  ['engineer_ic', 'Engineer'],
  ['senior_engineer', 'Senior Engineer'],
  ['staff_engineer', 'Staff / Principal Engineer'],
  ['tech_lead', 'Tech Lead'],
  ['engineering_manager', 'Engineering Manager'],
  ['director_engineering', 'Director of Engineering'],
  ['cto', 'CTO / VP Engineering'],
  ['freelancer', 'Freelancer / Consultant'],
  ['other', 'Other'],
])

const ACADEMIC = ladder([
  ['assistant_teacher', 'Assistant Teacher'],
  ['teacher_as', 'Teacher'],
  ['senior_teacher', 'Senior Teacher'],
  ['lecturer', 'Lecturer'],
  ['assistant_professor', 'Assistant Professor'],
  ['associate_professor', 'Associate Professor'],
  ['professor_as', 'Professor'],
  ['principal_as', 'Principal / Dean'],
  ['researcher', 'Researcher'],
  ['other', 'Other'],
])

const LEGAL = ladder([
  ['junior_associate', 'Junior Associate'],
  ['associate', 'Associate'],
  ['senior_associate', 'Senior Associate'],
  ['partner_legal', 'Partner'],
  ['independent_practice', 'Independent Practice'],
  ['in_house_counsel', 'In-house Counsel'],
  ['other', 'Other'],
])

const FINANCE = ladder([
  ['analyst', 'Analyst'],
  ['senior_analyst', 'Senior Analyst'],
  ['associate_finance', 'Associate'],
  ['manager_finance', 'Manager'],
  ['senior_manager', 'Senior Manager'],
  ['vice_president', 'Vice President'],
  ['director_finance', 'Director'],
  ['own_firm', 'Own firm / Practice'],
  ['other', 'Other'],
])

const SERVICE = ladder([
  ['trainee_officer', 'Trainee / Probationer'],
  ['junior_officer', 'Junior Officer'],
  ['officer', 'Officer'],
  ['senior_officer', 'Senior Officer'],
  ['commanding_rank', 'Commanding / Supervisory Rank'],
  ['other', 'Other'],
])

const BUSINESS = ladder([
  ['proprietor', 'Proprietor'],
  ['partner_business', 'Partner'],
  ['founder', 'Founder'],
  ['co_founder', 'Co-founder'],
  ['director_business', 'Director'],
  ['managing_director', 'Managing Director'],
  ['other', 'Other'],
])

const CREATIVE = ladder([
  ['assistant_creative', 'Assistant'],
  ['associate_creative', 'Associate'],
  ['senior_creative', 'Senior'],
  ['lead_creative', 'Creative Lead'],
  ['art_director_as', 'Art Director'],
  ['independent_creative', 'Independent / Freelance'],
  ['studio_owner', 'Studio Owner'],
  ['other', 'Other'],
])

/** Profession value -> the ladder that fits it. */
const LADDERS: Record<string, SelectOption[]> = {}

const assign = (options: SelectOption[], professions: string[]) => {
  for (const key of professions) LADDERS[key] = options
}

assign(TECH, [
  'software_engineer', 'data_scientist', 'devops_engineer', 'qa_engineer',
  'product_manager', 'ux_designer', 'it_support', 'cybersecurity',
  'ml_engineer', 'data_engineer', 'mobile_developer', 'systems_analyst',
  'database_administrator', 'network_engineer', 'scrum_master', 'technical_writer',
  'engineer', 'civil_engineer', 'mechanical_engineer', 'electrical_engineer',
  'chemical_engineer', 'electronics_engineer', 'aerospace_engineer',
  'automobile_engineer', 'production_engineer', 'quality_engineer',
  'site_engineer', 'marine_engineer', 'mining_engineer',
])

assign(MEDICAL, [
  'doctor', 'surgeon', 'dentist', 'nurse', 'pharmacist', 'physiotherapist',
  'veterinarian', 'psychologist', 'medical_researcher', 'ayurvedic_doctor',
  'radiologist', 'pathologist', 'anaesthetist', 'paediatrician',
  'gynaecologist', 'optometrist', 'dietitian', 'lab_technician', 'paramedic',
])

assign(ACADEMIC, [
  'teacher', 'professor', 'scientist', 'principal', 'school_counsellor',
  'special_educator', 'librarian', 'tutor', 'research_associate',
])

assign(LEGAL, ['lawyer', 'judge', 'legal_advisor', 'paralegal', 'company_secretary'])

assign(FINANCE, [
  'chartered_accountant', 'accountant', 'banker', 'investment_professional',
  'consultant', 'business_analyst', 'actuary', 'auditor', 'cost_accountant',
  'financial_analyst', 'investment_banker', 'wealth_manager',
  'insurance_professional', 'tax_consultant',
])

assign(SERVICE, [
  'civil_servant', 'government_employee', 'police_officer', 'defence', 'pilot',
  'cabin_crew', 'merchant_navy', 'air_traffic_controller', 'railway_employee',
  'customs_officer', 'firefighter', 'diplomat', 'postal_services',
  'defence_civilian',
])

assign(BUSINESS, [
  'entrepreneur', 'business_owner', 'sales_manager', 'marketing_manager',
  'hr_professional', 'operations_manager', 'supply_chain', 'real_estate',
  'project_manager', 'account_manager', 'procurement', 'retail_manager',
  'hospitality_manager', 'event_manager', 'travel_professional',
  'customer_success', 'agriculture',
])

assign(CREATIVE, [
  'graphic_designer', 'fashion_designer', 'interior_designer', 'journalist',
  'content_creator', 'photographer', 'actor', 'musician', 'chef', 'architect',
  'animator', 'film_maker', 'editor', 'copywriter', 'radio_tv',
  'makeup_artist', 'art_director',
])

/**
 * Every ladder's options, flattened.
 *
 * The profile's label lookup needs all of them: a value saved from one ladder
 * must still resolve to its label after the member switches profession, or the
 * profile falls back to titleCasing the slug.
 */
export const ALL_EMPLOYED_AS: SelectOption[] = [
  ...MEDICAL, ...TECH, ...ACADEMIC, ...LEGAL,
  ...FINANCE, ...SERVICE, ...BUSINESS, ...CREATIVE,
]

/**
 * The seniority options to offer for a profession.
 *
 * Falls back to the generic ladder, which is what an unmapped or unanswered
 * profession gets - and what every profession got before this existed.
 */
export function employedAsFor(profession: string): SelectOption[] {
  return LADDERS[profession] ?? employedAsOptions
}

/** Whether a stored `employedAs` still makes sense for the chosen profession. */
export function employedAsFits(profession: string, employedAs: string): boolean {
  if (!employedAs) return true
  return employedAsFor(profession).some((option) => option.value === employedAs)
}
