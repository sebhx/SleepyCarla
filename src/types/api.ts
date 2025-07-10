// API-related types and enums

export const StatusCode = {
  Ok: 200,
  Created: 201,
  NoContent: 204,
  BadRequest: 400,
  NotFound: 404,
  InternalServerError: 500
} as const;

export type StatusCode = typeof StatusCode[keyof typeof StatusCode];

export const SleepEntryType = {
  Sleep: 'sleep',
  Wake: 'wake'
} as const;

export type SleepEntryType = typeof SleepEntryType[keyof typeof SleepEntryType];

export const SleepType = {
  Nap: 'nap',
  Night: 'night'
} as const;

export type SleepType = typeof SleepType[keyof typeof SleepType];

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: StatusCode;
}

export interface ApiError {
  status: StatusCode;
  message: string;
}
