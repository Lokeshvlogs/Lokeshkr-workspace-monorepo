import { SelectOption } from "@lokesh-workspace/ui";

/**
 * Professions.
 *
 * The original 25 forced most members into "Engineer", "Other", or a title that
 * was not really theirs. These are grouped by field and ordered roughly by how
 * common they are on Indian matrimonial profiles, since SelectDropdown renders
 * array order.
 *
 * Every original value is preserved, so no stored answer is orphaned. Values are
 * stable slugs and also key the employer catalog's `profession_tags`.
 */
export  const professionOptions: SelectOption[] = [
  // Software & data
  { value: 'software_engineer', label: 'Software Engineer' },
  { value: 'data_scientist', label: 'Data Scientist / Analyst' },
  { value: 'devops_engineer', label: 'DevOps / Cloud Engineer' },
  { value: 'qa_engineer', label: 'QA / Test Engineer' },
  { value: 'product_manager', label: 'Product Manager' },
  { value: 'ux_designer', label: 'UX / Product Designer' },
  { value: 'it_support', label: 'IT Support / Admin' },
  { value: 'cybersecurity', label: 'Cybersecurity Specialist' },

  // Engineering
  { value: 'engineer', label: 'Engineer (other)' },
  { value: 'civil_engineer', label: 'Civil Engineer' },
  { value: 'mechanical_engineer', label: 'Mechanical Engineer' },
  { value: 'electrical_engineer', label: 'Electrical Engineer' },
  { value: 'chemical_engineer', label: 'Chemical Engineer' },
  { value: 'architect', label: 'Architect' },

  // Medicine & health
  { value: 'doctor', label: 'Doctor / Physician' },
  { value: 'surgeon', label: 'Surgeon' },
  { value: 'dentist', label: 'Dentist' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'physiotherapist', label: 'Physiotherapist' },
  { value: 'veterinarian', label: 'Veterinarian' },
  { value: 'psychologist', label: 'Psychologist / Therapist' },
  { value: 'medical_researcher', label: 'Medical Researcher' },

  // Finance, law & consulting
  { value: 'chartered_accountant', label: 'Chartered Accountant' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'banker', label: 'Banker' },
  { value: 'investment_professional', label: 'Investment / Finance Professional' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'business_analyst', label: 'Business Analyst' },
  { value: 'lawyer', label: 'Lawyer / Advocate' },
  { value: 'company_secretary', label: 'Company Secretary' },
  { value: 'actuary', label: 'Actuary' },

  // Government & services
  { value: 'civil_servant', label: 'Civil Servant (IAS / IPS / IFS)' },
  { value: 'government_employee', label: 'Government Employee' },
  { value: 'police_officer', label: 'Police Officer' },
  { value: 'defence', label: 'Armed Forces' },
  { value: 'pilot', label: 'Pilot' },
  { value: 'cabin_crew', label: 'Cabin Crew' },
  { value: 'merchant_navy', label: 'Merchant Navy' },

  // Education & research
  { value: 'teacher', label: 'Teacher' },
  { value: 'professor', label: 'Professor / Lecturer' },
  { value: 'scientist', label: 'Scientist / Researcher' },

  // Business & operations
  { value: 'entrepreneur', label: 'Entrepreneur / Founder' },
  { value: 'business_owner', label: 'Business Owner' },
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'marketing_manager', label: 'Marketing Manager' },
  { value: 'hr_professional', label: 'HR Professional' },
  { value: 'operations_manager', label: 'Operations Manager' },
  { value: 'supply_chain', label: 'Supply Chain / Logistics' },
  { value: 'real_estate', label: 'Real Estate Professional' },

  // Creative & media
  { value: 'graphic_designer', label: 'Graphic Designer' },
  { value: 'fashion_designer', label: 'Fashion Designer' },
  { value: 'interior_designer', label: 'Interior Designer' },
  { value: 'journalist', label: 'Journalist' },
  { value: 'content_creator', label: 'Content Creator / Writer' },
  { value: 'photographer', label: 'Photographer / Videographer' },
  { value: 'actor', label: 'Actor / Performer' },
  { value: 'musician', label: 'Musician' },
  { value: 'chef', label: 'Chef' },

  // Other paths
  { value: 'agriculture', label: 'Agriculture / Farming' },
  { value: 'social_worker', label: 'Social Worker / NGO' },
  { value: 'sportsperson', label: 'Sportsperson / Coach' },
  { value: 'homemaker', label: 'Homemaker' },
  { value: 'student_profession', label: 'Student' },
  { value: 'between_jobs', label: 'Between jobs' },
  { value: 'retired', label: 'Retired' },
  { value: 'other', label: 'Other' },
];

export const employedInOptions: SelectOption[] = [
    { value: 'government', label: 'Government' },
    { value: 'private', label: 'Private' },
    { value: 'public_sector', label: 'Public Sector' },
    { value: 'self_employed', label: 'Self Employed' },
    { value: 'business', label: 'Business' },
    { value: 'student', label: 'Student' },
    { value: 'not_employed', label: 'Not Employed' },
    { value: 'other', label: 'Other' },
  ];

export const employedAsOptions: SelectOption[] = [
    { value: 'owner', label: 'Owner / Proprietor' },
    { value: 'partner', label: 'Partner' },
    { value: 'senior_management', label: 'Senior Management' },
    { value: 'middle_management', label: 'Middle Management' },
    { value: 'junior', label: 'Junior / Executive' },
    { value: 'entry_level', label: 'Entry Level' },
    { value: 'freelancer', label: 'Freelancer / Consultant' },
    { value: 'student', label: 'Student' },
    { value: 'other', label: 'Other' },
  ];

  export const educationOptions: SelectOption[] = [
  { value: 'high_school', label: 'High School' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: "Bachelor's" },
  { value: 'masters', label: "Master's" },
  { value: 'phd', label: 'PhD' },
  { value: 'professional', label: 'Professional Degree' },
  { value: 'other', label: 'Other' },
];

/**
 * Fields of study.
 *
 * The original eleven entries were so broad that most graduates had to answer
 * "Engineering" or "Other", which told a reader nothing. These are grouped by
 * discipline and ordered roughly by how common they are on Indian matrimonial
 * profiles, since SelectDropdown renders array order.
 *
 * The original eleven values are all preserved, so no stored answer is orphaned.
 */
export const fieldOfStudyOptions: SelectOption[] = [
  // Engineering & technology
  { value: 'computer_science', label: 'Computer Science / IT' },
  { value: 'engineering', label: 'Engineering (general)' },
  { value: 'electronics_engineering', label: 'Electronics / Electrical Engineering' },
  { value: 'mechanical_engineering', label: 'Mechanical Engineering' },
  { value: 'civil_engineering', label: 'Civil Engineering' },
  { value: 'chemical_engineering', label: 'Chemical Engineering' },
  { value: 'aerospace_engineering', label: 'Aerospace Engineering' },
  { value: 'biotechnology', label: 'Biotechnology / Bioengineering' },
  { value: 'data_science', label: 'Data Science / Analytics' },

  // Medicine & health
  { value: 'medicine', label: 'Medicine (MBBS / MD)' },
  { value: 'dentistry', label: 'Dentistry' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'nursing', label: 'Nursing' },
  { value: 'physiotherapy', label: 'Physiotherapy' },
  { value: 'ayurveda_homeopathy', label: 'Ayurveda / Homeopathy / Unani' },
  { value: 'veterinary', label: 'Veterinary Science' },
  { value: 'public_health', label: 'Public Health' },

  // Business & commerce
  { value: 'management', label: 'Management / MBA' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'accounting_finance', label: 'Accounting / Finance' },
  { value: 'economics', label: 'Economics' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'hospitality', label: 'Hotel Management / Hospitality' },

  // Sciences
  { value: 'science', label: 'Science (general)' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'mathematics', label: 'Mathematics / Statistics' },
  { value: 'biology', label: 'Biology / Life Sciences' },
  { value: 'environmental_science', label: 'Environmental Science' },
  { value: 'agriculture', label: 'Agriculture' },

  // Arts, law & social sciences
  { value: 'arts', label: 'Arts / Humanities' },
  { value: 'law', label: 'Law' },
  { value: 'psychology', label: 'Psychology' },
  { value: 'sociology', label: 'Sociology / Social Work' },
  { value: 'political_science', label: 'Political Science / Public Policy' },
  { value: 'journalism', label: 'Journalism / Mass Communication' },
  { value: 'literature', label: 'Literature / Languages' },
  { value: 'history', label: 'History / Archaeology' },

  // Creative & applied
  { value: 'design', label: 'Design' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'fine_arts', label: 'Fine Arts / Performing Arts' },
  { value: 'fashion', label: 'Fashion / Textile' },
  { value: 'education', label: 'Education / Teaching' },

  { value: 'other', label: 'Other' },
];

export const collegeOptions: SelectOption[] = [
  { value: 'indian_institute_of_science_bangalore', label: 'Indian Institute of Science (Bangalore)' },
  { value: 'iit_bombay', label: 'IIT Bombay' },
  { value: 'iit_delhi', label: 'IIT Delhi' },
  { value: 'iit_madras', label: 'IIT Madras' },
  { value: 'iit_kanpur', label: 'IIT Kanpur' },
  { value: 'iit_kharagpur', label: 'IIT Kharagpur' },
  { value: 'iit_roorkee', label: 'IIT Roorkee' },
  { value: 'iit_guwahati', label: 'IIT Guwahati' },
  { value: 'iit_hyderabad', label: 'IIT Hyderabad' },
  { value: 'iit_bhu_varanasi', label: 'IIT (BHU) Varanasi' },
  { value: 'iisc_bangalore', label: 'IISc Bangalore' },
  { value: 'bits_pilani', label: 'BITS Pilani' },
  { value: 'bits_goa', label: 'BITS Goa' },
  { value: 'bits_hyderabad', label: 'BITS Hyderabad' },
  { value: 'nit_trichy', label: 'NIT Trichy' },
  { value: 'nit_surathkal', label: 'NIT Surathkal' },
  { value: 'nit_warangal', label: 'NIT Warangal' },
  { value: 'nit_calicut', label: 'NIT Calicut' },
  { value: 'nit_rourkela', label: 'NIT Rourkela' },
  { value: 'delhi_university', label: 'University of Delhi' },
  { value: 'st_stephens_college', label: "St. Stephen's College, Delhi" },
  { value: 'hindu_college', label: 'Hindu College (DU)' },
  { value: 'miranda_house', label: 'Miranda House (DU)' },
  { value: 'jawaharlal_nehru_university', label: 'Jawaharlal Nehru University' },
  { value: 'jamia_millia_islamia', label: 'Jamia Millia Islamia' },
  { value: 'banaras_hindu_university', label: 'Banaras Hindu University' },
  { value: 'university_of_calcutta', label: 'University of Calcutta' },
  { value: 'university_of_mumbai', label: 'University of Mumbai' },
  { value: 'anna_university', label: 'Anna University' },
  { value: 'university_of_hyderabad', label: 'University of Hyderabad' },
  { value: 'aligarh_muslim_university', label: 'Aligarh Muslim University' },
  { value: 'savitribai_phule_pune_university', label: 'Savitribai Phule Pune University' },
  { value: 'amrita_vishwa_vidyapeetham', label: 'Amrita Vishwa Vidyapeetham' },
  { value: 'vit_vellore', label: 'VIT Vellore' },
  { value: 'manipal_academy', label: 'Manipal Academy of Higher Education' },
  { value: 'srM_university', label: 'SRM University' },
  { value: 'pes_university', label: 'PES University' },
  { value: 'xlri_jamshedpur', label: 'XLRI Jamshedpur' },
  { value: 'iim_ahmedabad', label: 'IIM Ahmedabad' },
  { value: 'iim_bangalore', label: 'IIM Bangalore' },
  { value: 'iim_calcutta', label: 'IIM Calcutta' },
  { value: 'iim_lucknow', label: 'IIM Lucknow' },
  { value: 'iim_kozhikode', label: 'IIM Kozhikode' },
  { value: 'iim_indore', label: 'IIM Indore' },
  { value: 'tata_institute_of_social_sciences', label: 'TISS' },
  { value: 'tata_institute_of_fundamental_research', label: 'TIFR' },
  { value: 'indian_statistical_institute', label: 'Indian Statistical Institute (ISI)' },
  { value: 'national_law_school_bangalore', label: 'National Law School of India University (NLSIU)' },
  { value: 'nalsar_university', label: 'NALSAR University of Law' },
  { value: 'aiims_new_delhi', label: 'AIIMS New Delhi' },
  { value: 'king_george_medical_university', label: 'King George Medical University' },
  { value: 'christ_university', label: 'Christ University' },
  { value: 'st_xaviers_college_mumbai', label: 'St. Xavier’s College, Mumbai' },
  { value: 'st_xaviers_college_kolkata', label: 'St. Xavier’s College, Kolkata' },
  { value: 'lady_shriram_college', label: 'Lady Shri Ram College (LSR)' },
  { value: 'christian_medical_college', label: 'Christian Medical College (Vellore)' },
  { value: 'kakatiya_university', label: 'Kakatiya University' },
  { value: 'annamalai_university', label: 'Annamalai University' },
  { value: 'kurukshetra_university', label: 'Kurukshetra University' },
  { value: 'gautam_buddha_university', label: 'Gautam Buddha University' },
  { value: 'bhopal_university', label: 'Bhopal University' },
  { value: 'mahatma_gandhi_university', label: 'Mahatma Gandhi University' },
  { value: 'kerala_university', label: 'University of Kerala' },
  { value: 'rajasthan_university', label: 'University of Rajasthan' },
  { value: 'calicut_university', label: 'University of Calicut' },
  { value: 'manipur_university', label: 'Manipur University' },
  { value: 'north_eastern_hill_university', label: 'NEHU' },
  { value: 'bose_institute', label: 'Bose Institute' },
  { value: 'srm_university_chennai', label: 'SRM Institute of Science and Technology' },
  { value: 'amity_university_noida', label: 'Amity University, Noida' },
  { value: 'shri_ram_college_of_commerce', label: 'SRCC (Shri Ram College of Commerce)' },
  { value: 'ips_academy', label: 'IPS Academy' },
  { value: 'law_college_bombay', label: 'Government Law College, Mumbai' },
  { value: 'fms_delhi', label: 'FMS Delhi' },
  { value: 'nift_delhi', label: 'NIFT' },
  { value: 'national_institute_of_design', label: 'NID' },
  { value: 'islami_universities', label: 'Various Islamic Universities' },
  { value: 'pondi_university', label: 'Pondicherry University' },
  { value: 'ciiit', label: 'CIIT' },
  { value: 'manipalinstitute', label: 'Manipal Institute' },
  { value: 'other_college', label: 'Other / Not Listed' },
];
