export interface AccountInfo {
  id: string;
  displayName: string;
  username: string;
  dateOfInvitation: string;
  chain: string;
  totalTransacted: string;
  generalScore: string;
  location: string;
  numberOfFriends: number;
  goalsAchieved: number;
  favoriteFriend: string;
  streak: string;
}

export type AccountActionVariant = 'primary' | 'danger';

export interface AccountAction {
  id: string;
  label: string;
  icon: string;
  variant: AccountActionVariant;
}
