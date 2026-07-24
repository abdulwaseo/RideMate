import { z } from 'zod';

// Pakistani mobile number regex
// Matches: 03001234567, 923001234567, +923001234567, 3001234567
const pakMobileRegex = /^((\+92)|(92)|(0092)|0)?3\d{9}$/;

// Pakistani CNIC format regex (5 digits, dash, 7 digits, dash, 1 digit)
// Matches: 42101-1234567-1
const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;

// Password rules: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .refine((val) => /[A-Z]/.test(val), { message: 'Password must contain at least one uppercase letter' })
  .refine((val) => /[a-z]/.test(val), { message: 'Password must contain at least one lowercase letter' })
  .refine((val) => /[0-9]/.test(val), { message: 'Password must contain at least one number' });

export const mobileSchema = z.string()
  .min(1, 'Mobile number is required')
  .refine((val) => pakMobileRegex.test(val), { message: 'Enter a valid Pakistani mobile number (e.g., 03001234567)' });

// Login Validation Schema
export const loginSchema = z.object({
  mobileNumber: mobileSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Passenger Registration Schema
export const passengerRegisterSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters long'),
  mobileNumber: mobileSchema,
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  officeName: z.string().optional().or(z.literal('')),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Driver Registration Schema
export const driverRegisterSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters long'),
  mobileNumber: mobileSchema,
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  cnicNumber: z.string()
    .min(1, 'CNIC number is required')
    .refine((val) => cnicRegex.test(val), { message: 'Enter CNIC in 12345-1234567-1 format' }),
  licenseNumber: z.string().min(5, 'Driving license number is required'),
  vehicleType: z.union([z.literal('Car'), z.literal('Bike')]),
  vehicleModel: z.string().min(2, 'Vehicle model is required (e.g. Corolla 2022)'),
  vehicleRegistrationNumber: z.string().min(3, 'Vehicle registration plate number is required'),
  officeName: z.string().optional().or(z.literal('')),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type PassengerRegisterFormValues = z.infer<typeof passengerRegisterSchema>;
export type DriverRegisterFormValues = z.infer<typeof driverRegisterSchema>;

// Publish Ride Validation Schema
export const publishRideSchema = z.object({
  vehicleType: z.union([z.literal('Car'), z.literal('Bike')]),
  vehicleModel: z.string().optional().or(z.literal('')),
  pickupArea: z.string().min(2, 'Pickup area is required'),
  destination: z.string().min(2, 'Destination is required'),
  meetingPoint: z.string().optional().or(z.literal('')),
  date: z.string().min(1, 'Date is required'),
  departureTime: z.string().min(1, 'Departure time is required'),
  availableSeats: z.number({ message: 'Seats must be a number' })
    .int('Seats must be a whole number')
    .min(1, 'Provide at least 1 seat')
    .max(6, 'Maximum allowed seats is 6'),
  farePerPassenger: z.number({ message: 'Fare must be a number' })
    .min(1, 'Fare must be greater than zero'),
  description: z.string().optional().or(z.literal('')),
}).refine((data) => data.pickupArea.trim().toLowerCase() !== data.destination.trim().toLowerCase(), {
  message: 'Pickup area and destination cannot be identical',
  path: ['destination'],
});

export type PublishRideFormValues = z.infer<typeof publishRideSchema>;

