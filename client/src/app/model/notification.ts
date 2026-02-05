export interface AppNotification {
    id: number;
    title: string;
    message: string;
    type: string;        // 'LETTER', 'TASK', 'GENERIC'
    referenceId?: number;
    read: boolean;       // matches 'isRead' from backend
    createdDate: Date;
}