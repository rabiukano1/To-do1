
export interface Task {
    id: number;
    text: string;
    completed: boolean;
    reminder?: string;
    timeoutId?: number;
}
