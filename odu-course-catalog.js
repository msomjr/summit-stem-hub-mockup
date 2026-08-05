// Manually maintained local ODU course catalog.
//
// NOTE: ODU has no public course API. catalog.odu.edu / courses.odu.edu is a
// CourseLeaf/Banner catalog site (not a documented API), so we cannot pull
// courses live. This list is maintained by hand.
//
// This is a CURATED STARTER LIST of real ODU subjects/courses. To expand it,
// open a subject on https://catalog.odu.edu/courses/ (e.g. "CS - Computer
// Science"), then paste additional entries below using the same format:
//
//   { code: "SUBJ ###", title: "Course Title", credits: <number or null> }
//
// Tips for expanding:
//   - "code" is the subject prefix + number exactly as ODU lists it (e.g. "CS 150").
//   - "credits" is optional; when present, picking the course auto-fills the
//     Credit Hours field (still editable). Use null if you are unsure.
//   - Entries are grouped by subject only for readability; order does not matter.

const ODU_COURSE_CATALOG = [
  // CS - Computer Science
  { code: "CS 150", title: "Introduction to Programming and Problem Solving", credits: 4 },
  { code: "CS 250", title: "Problem Solving and Programming", credits: 4 },
  { code: "CS 252", title: "Introduction to Unix for Programmers", credits: 1 },
  { code: "CS 330", title: "Object-Oriented Programming and Design", credits: 3 },
  { code: "CS 333", title: "Programming and Problem Solving in C++", credits: 3 },
  { code: "CS 361", title: "Data Structures and Algorithms", credits: 3 },
  { code: "CS 411W", title: "Professional Workforce Development II", credits: 3 },

  // CYSE - Cybersecurity
  { code: "CYSE 200T", title: "Cybersecurity, Technology and Society", credits: 3 },
  { code: "CYSE 301", title: "Cybersecurity Techniques and Operations", credits: 3 },

  // MATH - Mathematics
  { code: "MATH 162M", title: "Precalculus I", credits: 3 },
  { code: "MATH 211", title: "Calculus I", credits: 4 },
  { code: "MATH 212", title: "Calculus II", credits: 4 },

  // STAT - Statistics
  { code: "STAT 130M", title: "Elementary Statistics", credits: 3 },

  // ENGL - English
  { code: "ENGL 110C", title: "English Composition", credits: 3 },

  // COMM - Communication
  { code: "COMM 101R", title: "Public Speaking", credits: 3 },

  // BIOL - Biological Sciences
  { code: "BIOL 121N", title: "General Biology I", credits: 4 },
  { code: "BIOL 122N", title: "General Biology II", credits: 4 },

  // CHEM - Chemistry and Biochemistry
  { code: "CHEM 121N", title: "Foundations of Chemistry I", credits: 4 },
  { code: "CHEM 122N", title: "Foundations of Chemistry II", credits: 4 },

  // PHYS - Physics
  { code: "PHYS 231N", title: "University Physics I", credits: 4 },
  { code: "PHYS 232N", title: "University Physics II", credits: 4 },

  // PSYC - Psychology
  { code: "PSYC 201S", title: "Introduction to Psychology", credits: 3 },

  // SOC - Sociology
  { code: "SOC 201S", title: "Introduction to Sociology", credits: 3 },

  // ECON - Economics
  { code: "ECON 201S", title: "Principles of Macroeconomics", credits: 3 },
  { code: "ECON 202S", title: "Principles of Microeconomics", credits: 3 },

  // ACCT - Accounting
  { code: "ACCT 201", title: "Principles of Accounting I", credits: 3 },
  { code: "ACCT 202", title: "Principles of Accounting II", credits: 3 },

  // FIN - Finance
  { code: "FIN 323", title: "Financial Management", credits: 3 },

  // MKTG - Marketing
  { code: "MKTG 311", title: "Marketing Principles", credits: 3 }
];

// Expose globally so a page can load this file before its main script.
if (typeof window !== "undefined") {
  window.ODU_COURSE_CATALOG = ODU_COURSE_CATALOG;
}
