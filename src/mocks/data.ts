/**
 * Mock data for testing
 */
import { ZODIAC_DATE_RANGES } from '@/constants';
import { ZodiacSign } from '@/constants';

export interface ZodiacSignData {
  name: string;
  date: string;
}

export interface HoroscopeData {
  sign: string;
  content: string;
  date: string;
}

// Mock zodiac sign data
export const mockZodiacSigns: ZodiacSignData[] = [
  { name: 'Aries', date: ZODIAC_DATE_RANGES.Aries },
  { name: 'Taurus', date: ZODIAC_DATE_RANGES.Taurus },
  { name: 'Gemini', date: ZODIAC_DATE_RANGES.Gemini },
  { name: 'Cancer', date: ZODIAC_DATE_RANGES.Cancer },
  { name: 'Leo', date: ZODIAC_DATE_RANGES.Leo },
  { name: 'Virgo', date: ZODIAC_DATE_RANGES.Virgo },
  { name: 'Libra', date: ZODIAC_DATE_RANGES.Libra },
  { name: 'Scorpio', date: ZODIAC_DATE_RANGES.Scorpio },
  { name: 'Sagittarius', date: ZODIAC_DATE_RANGES.Sagittarius },
  { name: 'Capricorn', date: ZODIAC_DATE_RANGES.Capricorn },
  { name: 'Aquarius', date: ZODIAC_DATE_RANGES.Aquarius },
  { name: 'Pisces', date: ZODIAC_DATE_RANGES.Pisces },
];

// Mock horoscope data
export const mockHoroscopes: HoroscopeData[] = [
  {
    sign: 'Aries',
    content: "Today is a great day for new beginnings, Aries. Take initiative in projects you have been putting off.",
    date: '2023-06-15',
  },
  {
    sign: 'Taurus',
    content: "Focus on financial stability today, Taurus. A new opportunity for growth may present itself.",
    date: '2023-06-15',
  },
  {
    sign: 'Gemini',
    content: "Your communication skills are heightened today, Gemini. Use them to resolve any lingering misunderstandings.",
    date: '2023-06-15',
  },
  {
    sign: 'Cancer',
    content: "Emotional matters require your attention today, Cancer. Take time for self-care and nurturing.",
    date: '2023-06-15',
  },
  {
    sign: 'Leo',
    content: "Your creative energy is strong today, Leo. Express yourself through art or other passion projects.",
    date: '2023-06-15',
  },
  {
    sign: 'Virgo',
    content: "Pay attention to details today, Virgo. Your analytical skills will help solve a complex problem.",
    date: '2023-06-15',
  },
  {
    sign: 'Libra',
    content: "Balance is key today, Libra. Make time for both work and personal relationships.",
    date: '2023-06-15',
  },
  {
    sign: 'Scorpio',
    content: "Your intuition is especially sharp today, Scorpio. Trust your instincts in important decisions.",
    date: '2023-06-15',
  },
  {
    sign: 'Sagittarius',
    content: "Adventure calls today, Sagittarius. Explore new ideas or consider planning a future trip.",
    date: '2023-06-15',
  },
  {
    sign: 'Capricorn',
    content: "Career matters come into focus today, Capricorn. Your discipline will be recognized by others.",
    date: '2023-06-15',
  },
  {
    sign: 'Aquarius',
    content: "Innovative thinking brings rewards today, Aquarius. Share your unique perspective with others.",
    date: '2023-06-15',
  },
  {
    sign: 'Pisces',
    content: "Your compassionate nature is highlighted today, Pisces. Helping others will bring you fulfillment.",
    date: '2023-06-15',
  },
]; 