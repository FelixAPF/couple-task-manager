export const addTimeToCurrentDate = (date: Date, year: number, month: number, day: number): Date => {
    return new Date(date.getFullYear() + year, date.getMonth() + month, date.getDate() + day);
}