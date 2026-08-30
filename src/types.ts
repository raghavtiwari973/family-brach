export type Gender = 'male' | 'female' | 'other';
export type LifeStatus = 'alive' | 'deceased' | 'unknown';
export type ChildrenStatus = 'has_children' | 'no_children' | 'unknown';
export type BranchStatus = 'continues' | 'ends_here' | 'unknown';
export type MarriageStatus = 'married' | 'separated' | 'divorced' | 'widowed' | 'unknown';

export interface Person {
  id: string;
  first_name_en: string | null;
  middle_name_en: string | null;
  last_name_en: string | null;
  first_name_hi: string | null;
  middle_name_hi: string | null;
  last_name_hi: string | null;
  nickname: string | null;
  gender: Gender | null;
  date_of_birth: string | null;
  place_of_birth: string | null;
  date_of_death: string | null;
  place_of_death: string | null;
  life_status: LifeStatus;
  profile_photo: string | null;
  biography: string | null;
  father_id: string | null;
  mother_id: string | null;
  children_status: ChildrenStatus;
  branch_status: BranchStatus;
  created_at: string;
  updated_at: string;
}

export interface Spouse {
  id: string;
  person_one: string;
  person_two: string;
  marriage_date: string | null;
  marriage_location: string | null;
  marriage_status: MarriageStatus;
  created_at: string;
}

export interface PersonWithRelations extends Person {
  father?: Person | null;
  mother?: Person | null;
  spouses?: Person[];
  children?: Person[];
  marriage?: Spouse | null;
}

export interface PersonInput {
  first_name_en?: string | null;
  middle_name_en?: string | null;
  last_name_en?: string | null;
  first_name_hi?: string | null;
  middle_name_hi?: string | null;
  last_name_hi?: string | null;
  nickname?: string | null;
  gender?: Gender | null;
  date_of_birth?: string | null;
  place_of_birth?: string | null;
  date_of_death?: string | null;
  place_of_death?: string | null;
  life_status?: LifeStatus;
  profile_photo?: string | null;
  biography?: string | null;
  father_id?: string | null;
  mother_id?: string | null;
  children_status?: ChildrenStatus;
  branch_status?: BranchStatus;
}
