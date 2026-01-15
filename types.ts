
export enum Hall {
  AlWaha = 'al-waha',
  AlDana = 'al-dana',
}

export interface Booking {
  id: string;
  hallId: Hall;
  date: string; // Format: YYYY-MM-DD
  time: string; // e.g., '09:00'
  endTime: string; // e.g., '11:00'
  department: string;
  notes: string;
}
