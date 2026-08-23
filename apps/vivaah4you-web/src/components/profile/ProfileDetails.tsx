'use client'

import React from 'react'

import {
  FAMILY_TYPE_LABELS,
  MANGLIK_LABELS,
  formatHeight,
  labelFor,
} from '@/lib/profileDisplay'
import type { PublicProfile } from '@/types/profile'

type Row = { label: string; value: string }

const scale = (value: number, low: string, high: string) => {
  if (!value) return ''
  if (value <= 3) return `${low} (${value}/10)`
  if (value >= 8) return `${high} (${value}/10)`
  return `Moderate (${value}/10)`
}

function sectionsFor(profile: PublicProfile): { title: string; rows: Row[] }[] {
  return [
    {
      title: 'Basic Details',
      rows: [
        { label: 'Age', value: profile.age ? `${profile.age} years` : '' },
        { label: 'Height', value: formatHeight(profile.heightFeet, profile.heightInches) },
        { label: 'Body type', value: labelFor('bodyPhysique', profile.bodyPhysique) },
        { label: 'Marital status', value: labelFor('maritalStatus', profile.maritalStatus) },
        { label: 'Manglik', value: MANGLIK_LABELS[profile.manglikLevel] ?? '' },
      ],
    },
    {
      title: 'Religion & Community',
      rows: [
        { label: 'Religion', value: labelFor('religion', profile.religion) },
        { label: 'Community', value: labelFor('community', profile.community) },
        { label: 'Mother tongue', value: labelFor('mothertongue', profile.mothertongue) },
      ],
    },
    {
      title: 'Location',
      rows: [
        { label: 'Lives in', value: profile.currentCity || labelFor('currentCountry', profile.currentCountry) },
        { label: 'Born in', value: profile.placeOfBirthCity || labelFor('placeOfBirthCountry', profile.placeOfBirthCountry) },
      ],
    },
    {
      title: 'Education & Career',
      rows: [
        { label: 'Education', value: labelFor('educationLevel', profile.educationLevel) },
        { label: 'Field of study', value: labelFor('fieldOfStudy', profile.fieldOfStudy) },
        { label: 'College', value: labelFor('collegeUniversity', profile.collegeUniversity) },
        { label: 'Profession', value: labelFor('profession', profile.profession) },
        { label: 'Employed in', value: labelFor('employedIn', profile.employedIn) },
        { label: 'Employed as', value: labelFor('employedAs', profile.employedAs) },
        { label: 'Annual income', value: labelFor('salaryAmount', profile.salaryAmount) },
      ],
    },
    {
      title: 'Family',
      rows: [
        { label: 'Family lives in', value: profile.familyLivingInCity || labelFor('familyLivingInCountry', profile.familyLivingInCountry) },
        { label: 'Family type', value: FAMILY_TYPE_LABELS[profile.familyType] ?? '' },
        { label: 'Family income', value: labelFor('familyIncome', profile.familyIncome) },
        { label: 'Lives with family', value: profile.livesWithFamily ? 'Yes' : 'No' },
      ],
    },
    {
      title: 'Lifestyle',
      rows: [
        { label: 'Diet', value: labelFor('diet', profile.diet) },
        { label: 'Smoking', value: labelFor('smoking', profile.smoking) },
        { label: 'Drinking', value: labelFor('drinking', profile.drinking) },
        { label: 'Daily routine', value: labelFor('routine', profile.routine) },
        { label: 'Exercise', value: scale(profile.exercise, 'Rarely', 'Very often') },
        { label: 'Religiousness', value: scale(profile.religiousness, 'Not religious', 'Very religious') },
        { label: 'Believes in astrology', value: scale(profile.astrologyBelief, 'Not really', 'Strongly') },
        { label: 'Wants children', value: profile.wantsChildren ? 'Yes' : 'No' },
      ],
    },
  ]
}

export default function ProfileDetails({ profile }: { profile: PublicProfile }) {
  const sections = sectionsFor(profile)
    .map((section) => ({ ...section, rows: section.rows.filter((r) => r.value) }))
    .filter((section) => section.rows.length > 0)

  if (sections.length === 0) {
    return (
      <p className="text-sm text-color-placeholder-text">
        This profile has not been filled in yet.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {sections.map((section) => (
        <section key={section.title} className="form-section">
          <h3 className="form-section-title">{section.title}</h3>
          <dl className="mt-3 space-y-2">
            {section.rows.map((row) => (
              <div key={row.label} className="flex justify-between gap-4 text-sm">
                <dt className="shrink-0 text-color-placeholder-text">{row.label}</dt>
                <dd className="text-right font-medium text-gray-900">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
