"use client";

import { useState } from "react";
import HorizontalFormSlider from "@/components/slider/HorizontalFormSlider";
import DropdownInput from "@/components/dropdown/DropdownInput";


export default function ProfileRegisterPage() {

  const [form, setForm] = useState({
    firstName: "",
    surname: "",
    dob: "",
    gender: "",
    religion: "",
    community: "",
    profession: "",
    salaryAmount: "",
    salaryFrequency: "per_annum",
  });

  async function submit(): Promise<void> {
    console.log(form);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-2xl p-6" style={{ width: 760 }}>
        <HorizontalFormSlider
          onSubmit={submit}
          steps={[
            // Step 1 - Name, DOB, Gender
            <div className="flex flex-col gap-4 p-4">
              <h2 className="text-xl font-semibold">Basic Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="p-3 border rounded-md"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
                <input
                  className="p-3 border rounded-md"
                  placeholder="Surname"
                  value={form.surname}
                  onChange={(e) => setForm({ ...form, surname: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="flex flex-col">
                  <label className="mb-2 font-medium">Date of Birth</label>
                  <input
                    type="date"
                    className="p-3 border rounded-md"
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="mb-2 font-medium">Gender</label>
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={form.gender === 'male'}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      />
                      Male
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={form.gender === 'female'}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      />
                      Female
                    </label>
                  </div>
                </div>
              </div>
            </div>,

            // Step 2 - Religion and Community
            <div className="flex flex-col gap-4 p-4">
              <h2 className="text-xl font-semibold">Background</h2>
              <div className="grid grid-cols-1 gap-4">
                <DropdownInput
                  label="Religion"
                  options={[
                    { value: 'hindu', label: 'Hindu' },
                    { value: 'muslim', label: 'Muslim' },
                    { value: 'sikh', label: 'Sikh' },
                    { value: 'christian', label: 'Christian' },
                    { value: 'jain', label: 'Jain' },
                    { value: 'other', label: 'Other' },
                  ]}
                  initialValue={form.religion}
                  onChange={(v) => setForm({ ...form, religion: v })}
                />

                <DropdownInput
                  label="Community"
                  options={[
                    { value: 'brahmin', label: 'Brahmin' },
                    { value: 'kshatriya', label: 'Kshatriya' },
                    { value: 'vaishya', label: 'Vaishya' },
                    { value: 'dalit', label: 'Dalit' },
                    { value: 'nair', label: 'Nair' },
                    { value: 'iyer', label: 'Iyer' },
                    { value: 'maratha', label: 'Maratha' },
                    { value: 'reddy', label: 'Reddy' },
                    { value: 'other', label: 'Other' },
                  ]}
                  initialValue={form.community}
                  onChange={(v) => setForm({ ...form, community: v })}
                />
              </div>
            </div>,

            // Step 3 - Profession & Salary
            <div className="flex flex-col gap-4 p-4">
              <h2 className="text-xl font-semibold">Career & Package</h2>
              <div className="grid grid-cols-1 gap-4">
                <input
                  className="p-3 border rounded-md"
                  placeholder="Profession"
                  value={form.profession}
                  onChange={(e) => setForm({ ...form, profession: e.target.value })}
                />

                <div className="grid grid-cols-3 gap-3 items-center">
                  <input
                    className="p-3 border rounded-md col-span-2"
                    placeholder="Salary amount"
                    value={form.salaryAmount}
                    onChange={(e) => setForm({ ...form, salaryAmount: e.target.value })}
                  />

                  <select
                    className="p-3 border rounded-md"
                    value={form.salaryFrequency}
                    onChange={(e) => setForm({ ...form, salaryFrequency: e.target.value })}
                  >
                    <option value="per_annum">Per Annum</option>
                    <option value="per_month">Per Month</option>
                  </select>
                </div>
              </div>
            </div>,
          ]}
        />
      </div>
    </div>
  );
}