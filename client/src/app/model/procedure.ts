export interface ProcedureStep {
    id?: number;
    description: string;
    stepOrder: number;
}

export interface Procedure {
    id?: number;
    name: string;
    steps: ProcedureStep[];
    householdId?: number;
}