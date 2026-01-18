// Singapore educational institution email domains
export const SINGAPORE_SCHOOL_DOMAINS = [
  // Polytechnics
  'tp.edu.sg',      // Temasek Polytechnic
  'np.edu.sg',      // Ngee Ann Polytechnic
  'rp.edu.sg',      // Republic Polytechnic
  'sp.edu.sg',      // Singapore Polytechnic
  'ite.edu.sg',     // ITE colleges
  
  // Junior Colleges
  'ac.edu.sg',      // Anglo-Chinese JC
  'sajc.edu.sg',    // St. Andrew's JC
  'vjc.edu.sg',     // Victoria JC
  'tjc.edu.sg',     // Tampines JC
  'ejc.edu.sg',     // Eunoia JC
  'yjc.edu.sg',     // Yishun JC
  'mjc.edu.sg',     // Meridian JC
  'pjc.edu.sg',     // Pioneer JC
  'rjc.edu.sg',     // Raffles JC
  'dhs.sg',         // Dunman High
  'hci.edu.sg',     // Hwa Chong Institution
  'acjc.moe.edu.sg',
  
  // Universities (bonus)
  'u.nus.edu',      // NUS
  'ntu.edu.sg',     // NTU
  'smu.edu.sg',     // SMU
  'sutd.edu.sg',    // SUTD
  'sit.edu.sg',     // SIT
  'nus.edu.sg',     // NUS general
];

export function validateSingaporeSchoolEmail(email: string): boolean {
  const lowercaseEmail = email.toLowerCase();
  return SINGAPORE_SCHOOL_DOMAINS.some(domain => 
    lowercaseEmail.endsWith('@' + domain)
  );
}

export function getSchoolFromEmail(email: string): string | null {
  const lowercaseEmail = email.toLowerCase();
  const domain = SINGAPORE_SCHOOL_DOMAINS.find(d => 
    lowercaseEmail.endsWith('@' + d)
  );
  
  if (!domain) return null;
  
  // Map domains to school names
  const schoolMap: Record<string, string> = {
    'tp.edu.sg': 'Temasek Polytechnic',
    'np.edu.sg': 'Ngee Ann Polytechnic',
    'rp.edu.sg': 'Republic Polytechnic',
    'sp.edu.sg': 'Singapore Polytechnic',
    'ite.edu.sg': 'ITE',
    'u.nus.edu': 'National University of Singapore',
    'ntu.edu.sg': 'Nanyang Technological University',
    'smu.edu.sg': 'Singapore Management University',
    'sutd.edu.sg': 'Singapore University of Design & Technology',
    'sit.edu.sg': 'Singapore Institute of Technology',
    'nus.edu.sg': 'National University of Singapore',
  };
  
  return schoolMap[domain] || domain;
}
