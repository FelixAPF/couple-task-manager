export interface Task {
    id?: number;
    title?: string;
    description?: string;
    frequency?: Frequency;
}

export enum Frequency {
    DAILY = "DAILY", BIWEEKLY = "BIWEEKLY", WEEKLY = "WEEKLY", MONTHLY = "MONTHLY", BIYEARLY = "BIYEARLY", YEARLY = "YEARLY"
}

export enum CreationMethod {
    AUTOMATIC = "AUTOMATIC", MANUAL = "MANUAL"
}