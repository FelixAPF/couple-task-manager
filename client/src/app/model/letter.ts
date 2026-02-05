import { HouseholdMember } from './household';

export interface Letter {
  id: number;
  title: string;
  letterType: string;
  sender: HouseholdMember;
  receiver: HouseholdMember;
  description: string;
  opened: boolean;
  createdDate: Date;
  repliedDate?: Date;
  replyRead: boolean;
  hasOptions: boolean;
  optionsTitle?: string;
  options: string[];
  selectedOption?: string;
}

export interface CreateLetterDto {
  receiverId: number;
  title: string;
  letterType: string;
  description: string;
  hasOptions: boolean;
  optionsTitle?: string;
  options?: string[];
}
