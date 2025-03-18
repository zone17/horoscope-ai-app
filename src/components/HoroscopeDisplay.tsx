import { ZodiacCard } from './ZodiacCard';
import { getHoroscopesForAllSigns } from '@/utils/horoscope-service';

// Zodiac sign data with symbols and date ranges
const ZODIAC_SIGNS = [
  { sign: 'aries', symbol: '♈', dateRange: 'Mar 21 - Apr 19' },
  { sign: 'taurus', symbol: '♉', dateRange: 'Apr 20 - May 20' },
  { sign: 'gemini', symbol: '♊', dateRange: 'May 21 - Jun 20' },
  { sign: 'cancer', symbol: '♋', dateRange: 'Jun 21 - Jul 22' },
  { sign: 'leo', symbol: '♌', dateRange: 'Jul 23 - Aug 22' },
  { sign: 'virgo', symbol: '♍', dateRange: 'Aug 23 - Sep 22' },
  { sign: 'libra', symbol: '♎', dateRange: 'Sep 23 - Oct 22' },
  { sign: 'scorpio', symbol: '♏', dateRange: 'Oct 23 - Nov 21' },
  { sign: 'sagittarius', symbol: '♐', dateRange: 'Nov 22 - Dec 21' },
  { sign: 'capricorn', symbol: '♑', dateRange: 'Dec 22 - Jan 19' },
  { sign: 'aquarius', symbol: '♒', dateRange: 'Jan 20 - Feb 18' },
  { sign: 'pisces', symbol: '♓', dateRange: 'Feb 19 - Mar 20' },
];

export async function HoroscopeDisplay() {
  // Fetch horoscopes for all zodiac signs
  const horoscopes = await getHoroscopesForAllSigns();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
      {ZODIAC_SIGNS.map(({ sign, symbol, dateRange }) => (
        <ZodiacCard
          key={sign}
          sign={sign}
          symbol={symbol}
          dateRange={dateRange}
          horoscope={horoscopes[sign]}
        />
      ))}
    </div>
  );
} 